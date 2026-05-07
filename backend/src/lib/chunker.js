// Paragraph-aware chunker. Splits on blank lines, then packs paragraphs up
// to ~targetChars with overlap between adjacent chunks so retrieval doesn't
// miss bullets that straddle a boundary.
function chunkText(text, { targetChars = 900, overlapChars = 150 } = {}) {
  const clean = (text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!clean) return [];

  const paragraphs = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let buf = '';

  const flush = () => {
    if (buf.trim()) chunks.push(buf.trim());
    buf = '';
  };

  for (const p of paragraphs) {
    if (p.length > targetChars) {
      // Hard-split overly long paragraphs on sentence boundaries.
      flush();
      const sentences = p.split(/(?<=[.!?。！？])\s+/);
      let s = '';
      for (const sent of sentences) {
        if ((s + ' ' + sent).length > targetChars) {
          if (s) chunks.push(s.trim());
          s = sent;
        } else {
          s = s ? `${s} ${sent}` : sent;
        }
      }
      if (s) chunks.push(s.trim());
      continue;
    }
    if (buf.length + p.length + 2 > targetChars) {
      flush();
    }
    buf = buf ? `${buf}\n\n${p}` : p;
  }
  flush();

  if (overlapChars > 0 && chunks.length > 1) {
    for (let i = 1; i < chunks.length; i += 1) {
      const prev = chunks[i - 1];
      const tail = prev.slice(Math.max(0, prev.length - overlapChars));
      chunks[i] = `${tail}\n${chunks[i]}`;
    }
  }

  return chunks;
}

module.exports = { chunkText };
