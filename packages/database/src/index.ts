/** Future persistence contracts; no database connection is initialized. */
export interface ProjectRecord {
  id: string;
  tenantId: string;
  product: 'vocal-fix' | 'ttb-studio';
  createdAt: string;
}
export interface AudioAssetRecord {
  id: string;
  tenantId: string;
  projectId: string;
  storageKey: string;
  sha256: string;
  ownerConsentId: string | null;
}
