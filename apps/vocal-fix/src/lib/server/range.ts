// Copied from apps/ttb-studio/src/lib/server/studio/range.ts (independent apps share no server code).
/** Parses a single bytes range; returns null for none, 'invalid' for unsatisfiable. */
export function parseRange(
  header: string | null,
  size: number
): { start: number; end: number } | null | 'invalid' {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === '' && match[2] === '')) return 'invalid';
  let start: number;
  let end: number;
  if (match[1] === '') {
    const suffix = Number(match[2]);
    if (suffix === 0) return 'invalid';
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  if (start >= size || start > end) return 'invalid';
  return { start, end };
}

export function fileResponse(
  file: string,
  size: number,
  contentType: string,
  rangeHeader: string | null,
  downloadName?: string
): Response {
  const headers: Record<string, string> = {
    'content-type': contentType,
    'accept-ranges': 'bytes',
    'cache-control': 'private, no-store',
    'x-content-type-options': 'nosniff'
  };
  if (downloadName)
    headers['content-disposition'] =
      'attachment; filename="' + downloadName.replace(/[^\w.-]/g, '_') + '"';
  const range = parseRange(rangeHeader, size);
  if (range === 'invalid')
    return new Response(null, {
      status: 416,
      headers: { ...headers, 'content-range': 'bytes */' + size }
    });
  const blob = Bun.file(file);
  if (!range)
    return new Response(blob, {
      status: 200,
      headers: { ...headers, 'content-length': String(size) }
    });
  return new Response(blob.slice(range.start, range.end + 1), {
    status: 206,
    headers: {
      ...headers,
      'content-length': String(range.end - range.start + 1),
      'content-range': 'bytes ' + range.start + '-' + range.end + '/' + size
    }
  });
}
