// Text chunking via LangChain's RecursiveCharacterTextSplitter.
//
// The splitter tries paragraph -> line -> sentence -> word boundaries in order,
// packing up to ~targetChars with overlap so a bullet that straddles a chunk
// boundary still survives retrieval. Async because splitText returns a Promise.

const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

async function chunkText(text, { targetChars = 900, overlapChars = 150 } = {}) {
  const clean = (text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!clean) return [];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: targetChars,
    chunkOverlap: overlapChars,
    // Prefer semantic boundaries first, fall back to character-level. Includes
    // CJK sentence punctuation so Chinese resumes/JDs split sensibly too.
    separators: ['\n\n', '\n', '。', '！', '？', '. ', '! ', '? ', ' ', ''],
  });

  return splitter.splitText(clean);
}

module.exports = { chunkText };
