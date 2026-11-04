export function countWords(text) {
  const t = (text || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

export function formatMB(bytes) {
  return (bytes / 1048576).toFixed(1).replace('.', ',');
}
