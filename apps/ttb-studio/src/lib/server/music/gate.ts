export function generationAllowed(): boolean {
  // No user identity, tenant scoping or spending caps yet: hosted generation stays development-only.
  return process.env.NODE_ENV === 'development';
}

export function generationDisabledResponse(): Response | null {
  if (generationAllowed()) return null;
  return Response.json(
    { detail: 'Song generation is disabled pending authentication, billing and spending caps.' },
    { status: 403 }
  );
}

export function configuredKey(value: string | undefined): string | null {
  const key = value?.trim();
  return key ? key : null;
}

// Paid requests must be JSON so a cross-site text/plain or form POST cannot spend credit.
export function isJsonRequest(request: Request): boolean {
  return (
    (request.headers.get('content-type') ?? '').toLowerCase().split(';')[0].trim() ===
    'application/json'
  );
}
