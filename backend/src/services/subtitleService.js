export function createSrt(text) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  const chunks = clean.match(/.{1,70}(\s|$)/g) || [clean];
  return chunks.map((line, index) => {
    const start = index * 3;
    const end = start + 3;
    return `${index + 1}\n00:00:${String(start).padStart(2,'0')},000 --> 00:00:${String(end).padStart(2,'0')},000\n${line.trim()}\n`;
  }).join('\n');
}
