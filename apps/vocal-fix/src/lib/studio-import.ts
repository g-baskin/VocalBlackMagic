/** Read-only handoff from the Studio song library to Vocal Fix's existing intake form. */
export const STUDIO_IMPORT_LIMIT = 100 * 1024 * 1024;
export const studioSongId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface StudioImportSource {
  id: string;
  title: string;
  filename: string;
  bytes: number;
  content_type: string;
}
