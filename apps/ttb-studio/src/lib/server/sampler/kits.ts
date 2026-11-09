import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isKitId, newKit, validateKit, type Kit, type KitSummary } from '@vbm/contracts';
import { LibraryError } from '../studio/library';

/** File-backed kits: <root>/studio/kits/<id>.json, written atomically. */
export class KitStore {
  readonly kitsDir: string;
  constructor(
    readonly root: string,
    private readonly now: () => Date = () => new Date()
  ) {
    this.kitsDir = path.join(root, 'studio', 'kits');
  }

  private file(id: string): string {
    if (!isKitId(id)) throw new LibraryError(404, 'Kit not found.');
    return path.join(this.kitsDir, id + '.json');
  }

  private async write(kit: Kit): Promise<void> {
    await mkdir(this.kitsDir, { recursive: true });
    const tmp = this.file(kit.id) + '.' + crypto.randomUUID() + '.tmp';
    await writeFile(tmp, JSON.stringify(kit, null, 2));
    await rename(tmp, this.file(kit.id));
  }

  async create(name: string): Promise<Kit> {
    const kit = newKit(
      crypto.randomUUID(),
      name.trim() || 'Untitled kit',
      this.now().toISOString()
    );
    const invalid = validateKit(kit);
    if (invalid) throw new LibraryError(422, invalid);
    await this.write(kit);
    return kit;
  }

  async get(id: string): Promise<Kit> {
    let raw: string;
    try {
      raw = await readFile(this.file(id), 'utf8');
    } catch {
      throw new LibraryError(404, 'Kit not found.');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new LibraryError(500, 'Kit file is corrupt.');
    }
    const invalid = validateKit(parsed);
    // Unknown versions are refused rather than guessed at.
    if (invalid) throw new LibraryError(422, 'This kit cannot be opened: ' + invalid);
    if ((parsed as Kit).id !== id) throw new LibraryError(500, 'Kit file is corrupt.');
    return parsed as Kit;
  }

  /** Replaces a stored kit; the id and created_at stay the server's, updated_at is set here. */
  async save(id: string, value: unknown): Promise<Kit> {
    const existing = await this.get(id);
    const invalid = validateKit(value);
    if (invalid) throw new LibraryError(422, invalid);
    const kit = value as Kit;
    if (kit.id !== id) throw new LibraryError(422, 'The kit id does not match the address.');
    const saved: Kit = {
      ...kit,
      name: kit.name.trim(),
      created_at: existing.created_at,
      updated_at: this.now().toISOString()
    };
    await this.write(saved);
    return saved;
  }

  async list(): Promise<KitSummary[]> {
    let names: string[];
    try {
      names = await readdir(this.kitsDir);
    } catch {
      return [];
    }
    const out: KitSummary[] = [];
    for (const name of names) {
      if (!name.endsWith('.json') || !isKitId(name.slice(0, -5))) continue;
      try {
        const kit = await this.get(name.slice(0, -5));
        out.push({
          id: kit.id,
          name: kit.name,
          bpm: kit.bpm,
          updated_at: kit.updated_at,
          pads_used: kit.pads.filter((p) => p.layers.some(Boolean)).length
        });
      } catch {
        // Corrupt or newer-version kits are left out of the list, not fatal.
      }
    }
    return out.sort((a, b) => b.updated_at.localeCompare(a.updated_at) || a.id.localeCompare(b.id));
  }

  async remove(id: string): Promise<void> {
    await this.get(id).catch((error: unknown) => {
      if (error instanceof LibraryError && error.status === 404) throw error;
    });
    await rm(this.file(id), { force: true });
  }
}
