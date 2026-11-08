/**
 * Square brackets describe structure or performance; parentheses remain sung backing vocals.
 * This is a provider-input transformation only. Never overwrite the author's stored lyrics.
 */
const SECTION =
  /^((?:(?:final|last|double|half|short|extended|repeat|full|first|second|third)\s+)?(?:intro|verse|pre[- ]?chorus|chorus|post[- ]?chorus|hook|refrain|bridge|breakdown|break|build[- ]?up|build|drop|interlude|instrumental|solo|outro|coda|ending|end|ad[- ]?libs?|vamp|chant)(?:\s+\d+)?)(?:\s*[-–—,:]\s*([\s\S]+))?$/i;

export function separateLyriaDirections(text: string): {
  lyrics: string;
  directions: string[];
  hasWords: boolean;
} {
  const directions: string[] = [];
  let section = 'Song';
  let hasWords = false;
  // Split complete bracket blocks, including multiline instructions. Unmatched brackets are
  // preserved rather than silently deleting the remainder of an author's text.
  const chunks = text.replace(/\r\n?/g, '\n').split(/(\[[^[\]]*\])/);
  const lyrics = chunks
    .map((chunk, index) => {
      if (index % 2 === 0) {
        if (chunk.trim()) hasWords = true;
        return chunk;
      }
      const content = chunk.slice(1, -1).trim();
      const heading = SECTION.exec(content);
      if (heading) {
        section = heading[1];
        if (heading[2]) directions.push(section + ': ' + heading[2].trim());
        return '[' + section + ']';
      }
      if (content) directions.push(section + ': ' + content);
      return '';
    })
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { lyrics, directions, hasWords };
}
