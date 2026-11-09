import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  cleanBeatProject,
  isBeatId,
  newBeatProject,
  validateBeatProject,
  type BeatProject,
  type BeatProjectSummary
} from '@vbm/contracts';
import { LibraryError } from '../studio/library';
import { dataDir } from '../studio/paths';

/** File-backed beat projects: <root>/studio/beats/<id>.json, written atomically. */
export class BeatStore {
  readonly dir: string;
  constructor(
    readonly root: string,
    private readonly now: () => Date = () => new Date()
  ) {
    this.dir = path.join(root, 'studio', 'beats');
  }

  private file(id: string): string {
    if (!isBeatId(id)) throw new LibraryError(404, 'Project not found.');
    return path.join(this.dir, id + '.json');
  }

  private async write(project: BeatProject): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const tmp = this.file(project.id) + '.' + crypto.randomUUID() + '.tmp';
    await writeFile(tmp, JSON.stringify(project));
    await rename(tmp, this.file(project.id));
  }

  async create(name: string): Promise<BeatProject> {
    const project = newBeatProject(
      crypto.randomUUID(),
      name.trim() || 'Untitled beat',
      this.now().toISOString()
    );
    const invalid = validateBeatProject(project);
    if (invalid) throw new LibraryError(422, invalid);
    await this.write(project);
    return project;
  }

  async get(id: string): Promise<BeatProject> {
    let raw: string;
    try {
      raw = await readFile(this.file(id), 'utf8');
    } catch {
      throw new LibraryError(404, 'Project not found.');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new LibraryError(500, 'Project file is corrupt.');
    }
    const invalid = validateBeatProject(parsed);
    // Unknown versions are refused rather than guessed at.
    if (invalid) throw new LibraryError(422, 'This project cannot be opened: ' + invalid);
    if ((parsed as BeatProject).id !== id) throw new LibraryError(500, 'Project file is corrupt.');
    return parsed as BeatProject;
  }

  /** Replaces a stored project; the id and created_at stay the server's, updated_at is set here. */
  async save(id: string, value: unknown): Promise<BeatProject> {
    const existing = await this.get(id);
    const invalid = validateBeatProject(value);
    if (invalid) throw new LibraryError(422, invalid);
    const project = cleanBeatProject(value as BeatProject);
    if (project.id !== id)
      throw new LibraryError(422, 'The project id does not match the address.');
    const saved: BeatProject = {
      ...project,
      name: project.name.trim(),
      created_at: existing.created_at,
      updated_at: this.now().toISOString()
    };
    await this.write(saved);
    return saved;
  }

  async list(): Promise<BeatProjectSummary[]> {
    let names: string[];
    try {
      names = await readdir(this.dir);
    } catch {
      return [];
    }
    const out: BeatProjectSummary[] = [];
    for (const name of names) {
      if (!name.endsWith('.json') || !isBeatId(name.slice(0, -5))) continue;
      try {
        const p = await this.get(name.slice(0, -5));
        out.push({
          id: p.id,
          name: p.name,
          bpm: p.bpm,
          updated_at: p.updated_at,
          channels: p.channels.length,
          patterns: p.patterns.length
        });
      } catch {
        // Corrupt or newer-version projects are left out of the list, not fatal.
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

export const beatStore = () => new BeatStore(dataDir());
