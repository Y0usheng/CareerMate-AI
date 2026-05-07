// Intent classification.
//
// Two-tier strategy:
//   1. Cheap regex heuristics catch the obvious cases without an LLM call.
//   2. Falls back to a tiny Gemini classifier for ambiguous messages.
//
// Returns one of: resume_rewrite | interview_prep | job_match | career_planning | general

const { GoogleGenAI } = require('@google/genai');
const config = require('../config');

const KEYWORDS = {
  resume_rewrite: [
    /\brewrite\b/i, /\bimprove\b.*\b(bullet|resume|cv)\b/i, /\bbullet point/i,
    /\bstronger\b.*\b(verb|wording)\b/i, /\b(quantify|action verb)\b/i,
    /改写|润色|重写.*简历|简历.*优化|措辞|动词/, /强化.*经历/,
  ],
  interview_prep: [
    /\binterview\b/i, /\bbehavioral\s+question/i, /\bSTAR\b/, /\bmock\b/i,
    /\bhow would I answer\b/i, /\btell me about a time\b/i,
    /面试|模拟面试|行为面试|技术面试|怎么回答|如何回答/,
  ],
  job_match: [
    /\bjob\s+description\b/i, /\bJD\b/, /\bfit\b.*\b(role|job|position)\b/i,
    /\bmatch\b.*\b(resume|cv|job)\b/i, /\bgap analysis\b/i, /\bam I qualified\b/i,
    /岗位|职位描述|匹配度|适合.*岗位|岗位.*匹配|能力差距/,
  ],
  career_planning: [
    /\bcareer\s+(plan|path|roadmap|trajectory)\b/i, /\bnext\s+role\b/i,
    /\b(3|5|10)[\s-]?year\s+plan\b/i, /\btransition\s+(to|into)\b/i,
    /\bwhat should I learn\b/i,
    /职业规划|发展路径|转行|下一步|学什么/,
  ],
};

function heuristicIntent(message) {
  const text = message || '';
  for (const [intent, patterns] of Object.entries(KEYWORDS)) {
    if (patterns.some((re) => re.test(text))) return intent;
  }
  return null;
}

let _client = null;
function client() {
  if (!_client) _client = new GoogleGenAI({ apiKey: config.geminiApiKey });
  return _client;
}

async function llmIntent(message) {
  if (!config.geminiApiKey) return 'general';
  const prompt = `Classify the user's career-coach message into ONE label.
Labels: resume_rewrite, interview_prep, job_match, career_planning, general.
Reply with the label only — no punctuation, no explanation.

Message: """${message.slice(0, 800)}"""`;
  try {
    const res = await client().models.generateContent({
      model: config.geminiModel,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0, maxOutputTokens: 8 },
    });
    const label = (res.text || '').trim().toLowerCase().replace(/[^a-z_]/g, '');
    const valid = ['resume_rewrite', 'interview_prep', 'job_match', 'career_planning', 'general'];
    return valid.includes(label) ? label : 'general';
  } catch {
    return 'general';
  }
}

async function classifyIntent(message) {
  const fast = heuristicIntent(message);
  if (fast) return fast;
  return llmIntent(message);
}

module.exports = { classifyIntent, heuristicIntent };
