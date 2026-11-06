/** Authorization contract only: no identity provider is integrated.
 * Production endpoints must fail closed until verified sessions and ownership
 * checks are implemented. Do not use a development header as authentication.
 */
export interface SaaSSession {
  subject: string;
  tenantId: string;
  emailVerified: boolean;
  roles: readonly string[];
}
export function assertAuthenticated(session: SaaSSession | null): asserts session is SaaSSession {
  if (!session || !session.subject || !session.tenantId || !session.emailVerified) {
    throw new Error('Authentication is not configured or session is unauthorized.');
  }
}
