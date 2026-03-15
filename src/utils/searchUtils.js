export function cleanSearchQuery(query) {
  const raw = String(query || '')

  return raw
    .replace(/\bHW\s*\d+\b/gi, ' ')
    .replace(/\(?\b(?:Assignment|Task|Project|Homework)\b\)?/gi, ' ')
    .replace(/\(\s*\)/g, ' ')
    .replace(/\s*[:\-–—]+\s*/g, ' ')
    .replace(/^[\s:,\-–—]+|[\s:,\-–—]+$/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

