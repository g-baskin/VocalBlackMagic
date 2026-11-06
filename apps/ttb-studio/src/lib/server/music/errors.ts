export class ProviderError extends Error {
  constructor(readonly status: number, readonly publicMessage: string, readonly logDetail?: string) {
    super(publicMessage);
    this.name = 'ProviderError';
  }
}
export function errorResponse(error: unknown): Response {
  if (error instanceof ProviderError) {
    if (error.logDetail) console.error('Music provider error:', error.logDetail);
    return Response.json({ detail: error.publicMessage }, { status: error.status });
  }
  const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
  console.error('Music provider request failed:', error instanceof Error ? error.message : String(error));
  return Response.json(
    { detail: timedOut ? 'The music provider took too long to respond.' : 'The music provider could not be reached.' },
    { status: timedOut ? 504 : 502 }
  );
}
