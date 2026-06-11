// Multi-step career-coach agent built with LangGraph.
//
// Graph (note the cycle — this is what makes it an "agent" rather than a
// single LLM call):
//
//   START -> classify -> retrieve -> generate -> critique --grounded?--> finalize -> END
//                           ^                          |
//                           |________ not grounded ____|   (up to MAX_ATTEMPTS)
//
//   classify : reuse the existing intent router (regex + Gemini fallback)
//   retrieve : pull resume/job context via the LangChain retrievers (rag.js)
//   generate : answer with the intent-specific grounded prompt template
//   critique : a cheap LLM self-check — is every claim backed by the context?
//   loop     : if not grounded, re-retrieve (folding in the critique) + redraft
//
// The whole thing reuses the same RAG layer the plain /api/chat path uses, so
// the only new moving part is the control flow.

const { StateGraph, Annotation, START, END } = require('@langchain/langgraph');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { SystemMessage, HumanMessage, AIMessage } = require('@langchain/core/messages');
const { classifyIntent } = require('./intentRouter');
const { buildPrompt } = require('./promptTemplates');
const { retrieve } = require('./rag');
const { loadActiveResume, resumeTextBlock } = require('./resumeContext');
const config = require('../config');

const MAX_ATTEMPTS = 2;

function chatModel(temperature, { json = false } = {}) {
  return new ChatGoogleGenerativeAI({
    apiKey: config.geminiApiKey,
    model: config.geminiModel,
    temperature,
    maxRetries: 2, // ride out transient 429/503s
    // json: true makes Gemini return pure JSON (no ```json fences), so the
    // critique self-check parses reliably.
    json,
  });
}

function asText(content) {
  return typeof content === 'string' ? content : JSON.stringify(content);
}

// --- Graph state ------------------------------------------------------------

const AgentState = Annotation.Root({
  // Inputs
  message: Annotation(),
  user: Annotation(),
  history: Annotation({ reducer: (_p, n) => n, default: () => [] }),
  // Derived
  intent: Annotation(),
  includeJobs: Annotation(),
  resumeChunks: Annotation({ reducer: (_p, n) => n, default: () => [] }),
  jobChunks: Annotation({ reducer: (_p, n) => n, default: () => [] }),
  draft: Annotation(),
  critique: Annotation(),
  attempts: Annotation({ reducer: (_p, n) => n, default: () => 0 }),
  reply: Annotation(),
  // A visible breadcrumb trail of the path taken (handy for debugging / demos).
  steps: Annotation({ reducer: (p, n) => p.concat(n), default: () => [] }),
});

// --- Nodes ------------------------------------------------------------------

async function classify(state) {
  const intent = await classifyIntent(state.message);
  const includeJobs =
    intent === 'job_match' || intent === 'interview_prep' || intent === 'career_planning';
  return { intent, includeJobs, steps: [`classify:${intent}`] };
}

async function retrieveNode(state) {
  // On a retry, fold the critique feedback into the query so we can surface
  // different/more relevant chunks than last time.
  const query = state.critique?.feedback
    ? `${state.message}\n\n(focus: ${state.critique.feedback})`
    : state.message;
  const { resumeChunks, jobChunks } = await retrieve({
    userId: state.user._id,
    query,
    includeJobs: state.includeJobs,
  });
  return {
    resumeChunks,
    jobChunks,
    steps: [`retrieve:r${resumeChunks.length}/j${jobChunks.length}`],
  };
}

async function generate(state) {
  let system = buildPrompt(state.intent, {
    user: state.user,
    resumeChunks: state.resumeChunks,
    jobChunks: state.jobChunks,
  });
  if (state.critique && !state.critique.grounded) {
    system += `\n\nREVISION NOTE: A previous draft failed a grounding self-check. Address this feedback and ground every claim in the RESUME CONTEXT above:\n"${state.critique.feedback}"`;
  }

  // Fallback: RAG found no resume chunks (e.g. a scanned PDF that didn't index,
  // or a resume uploaded before indexing existed). Inline the whole resume so
  // the agent isn't blind — mirrors what /api/chat does every turn.
  let resumeFallback = null;
  if (!state.resumeChunks?.length) {
    resumeFallback = await loadActiveResume(state.user._id);
    if (resumeFallback) {
      system +=
        '\n\nNOTE: No pre-indexed resume chunks were available, so the user\'s full resume is attached in the next message. Read it directly to ground your answer — do NOT ask them to upload a resume.';
    }
  }

  const messages = [new SystemMessage(system)];
  for (const h of state.history || []) {
    const text = h.text || h.content || '';
    if (!text) continue;
    if (h.role === 'assistant') messages.push(new AIMessage(text));
    else if (h.role === 'user') messages.push(new HumanMessage(text));
  }

  if (resumeFallback) {
    // Multimodal turn: attach the resume (PDF inline / DOCX text) + the question.
    // LangChain's Gemini adapter maps { type: 'media', mimeType, data } straight
    // to Gemini's inlineData — same wire format /api/chat uses.
    const parts =
      resumeFallback.kind === 'pdf'
        ? [{ type: 'media', mimeType: resumeFallback.mimeType, data: resumeFallback.dataBase64 }]
        : [{ type: 'text', text: resumeTextBlock(resumeFallback.filename, resumeFallback.text) }];
    parts.push({ type: 'text', text: state.message });
    messages.push(new HumanMessage({ content: parts }));
  } else {
    messages.push(new HumanMessage(state.message));
  }

  const res = await chatModel(0.4).invoke(messages);
  return {
    draft: asText(res.content),
    attempts: state.attempts + 1,
    steps: [`generate:#${state.attempts + 1}${resumeFallback ? '+resume' : ''}`],
  };
}

async function critique(state) {
  // Skip the self-check entirely when there's no resume context to ground
  // against — nothing to verify, and we don't want to burn a call.
  if (!state.resumeChunks?.length) {
    return { critique: { grounded: true, feedback: '' }, steps: ['critique:skipped'] };
  }

  const context = state.resumeChunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n');
  const checkPrompt = `You are a strict fact-checker. Below is RESUME CONTEXT and a DRAFT answer about the candidate.
Decide whether every factual claim in the DRAFT about the candidate's experience is supported by the RESUME CONTEXT.
Reply with ONLY a JSON object: {"grounded": true|false, "feedback": "<one sentence; empty if grounded>"}

RESUME CONTEXT:
${context}

DRAFT:
${state.draft}`;

  try {
    const res = await chatModel(0, { json: true }).invoke([new HumanMessage(checkPrompt)]);
    const raw = asText(res.content);
    // JSON mode returns clean JSON; the regex is a belt-and-braces fallback.
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : raw);
    return {
      critique: { grounded: parsed.grounded !== false, feedback: parsed.feedback || '' },
      steps: [`critique:${parsed.grounded !== false ? 'ok' : 'retry'}`],
    };
  } catch {
    // Fail open: if the checker misbehaves, don't block the answer.
    return { critique: { grounded: true, feedback: '' }, steps: ['critique:parse-fail'] };
  }
}

function finalize(state) {
  return { reply: state.draft, steps: ['finalize'] };
}

// Conditional edge: loop back to retrieval if the draft isn't grounded and we
// still have attempts left; otherwise finish.
function afterCritique(state) {
  if (state.critique?.grounded === false && state.attempts < MAX_ATTEMPTS) {
    return 'retrieve';
  }
  return 'finalize';
}

// --- Compile ----------------------------------------------------------------

const graph = new StateGraph(AgentState)
  .addNode('classify', classify)
  .addNode('retrieve', retrieveNode)
  .addNode('generate', generate)
  .addNode('critiqueDraft', critique)
  .addNode('finalize', finalize)
  .addEdge(START, 'classify')
  .addEdge('classify', 'retrieve')
  .addEdge('retrieve', 'generate')
  .addEdge('generate', 'critiqueDraft')
  .addConditionalEdges('critiqueDraft', afterCritique, { retrieve: 'retrieve', finalize: 'finalize' })
  .addEdge('finalize', END)
  .compile();

// Run the agent for one user turn. Returns a chat-route-compatible payload
// plus agent-specific diagnostics (attempts, grounded, step trace).
async function runAgent({ message, history = [], user }) {
  const final = await graph.invoke({ message, history, user });
  return {
    reply: final.reply || final.draft || '',
    intent: final.intent,
    attempts: final.attempts,
    grounded: final.critique ? final.critique.grounded : true,
    steps: final.steps,
    retrieval: {
      resume_chunks: (final.resumeChunks || []).map((c) => ({ id: c.id, score: Number(c.score.toFixed(4)) })),
      job_chunks: (final.jobChunks || []).map((c) => ({
        id: c.id,
        job_id: String(c.job_id),
        title: c.job_title,
        score: Number(c.score.toFixed(4)),
      })),
    },
  };
}

module.exports = { runAgent, graph };
