const falPrefix = 'fal.';

export function falJobId(requestId: string): string {
  return falPrefix + requestId;
}

export function parseJobId(
  jobId: string
): { provider: 'fal'; requestId: string } | { provider: 'lyria' } | null {
  if (jobId.startsWith(falPrefix))
    return { provider: 'fal', requestId: jobId.slice(falPrefix.length).toLowerCase() };
  if (jobId.startsWith('lyria.')) return { provider: 'lyria' };
  return null;
}
