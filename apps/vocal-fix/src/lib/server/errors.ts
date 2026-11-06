export class VocalFixError extends Error {
  constructor(
    message: string,
    readonly status: number = 422
  ) {
    super(message);
    this.name = 'VocalFixError';
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof VocalFixError)
    return Response.json({ detail: error.message }, { status: error.status });
  console.error('Vocal Fix internal error:', error instanceof Error ? error.message : error);
  return Response.json({ detail: 'Internal processing error.' }, { status: 500 });
}
