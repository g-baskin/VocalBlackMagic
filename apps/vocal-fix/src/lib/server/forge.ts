import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { isVoiceModel, voiceIdPattern, type VoiceModel } from '@vbm/contracts';
import { VocalFixError } from './errors';

export const CONSENT_STATEMENT = 'This is my own voice and I hold the rights to these recordings.';

export interface ConsentInput {
  attested_name: unknown;
  own_voice: unknown;
  statement?: unknown;
}

const normalizeName = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

/** Own-voice gate: typed full name must equal the session performer and the box must be ticked. */
export function validateConsent(
  input: ConsentInput,
  performer: string
): { attested_name: string; statement: string } {
  if (input.own_voice !== true)
    throw new VocalFixError('Confirm this is your own voice and you hold the rights.', 403);
  if (typeof input.attested_name !== 'string' || input.attested_name.trim().length < 2)
    throw new VocalFixError('Type your full name to sign.', 403);
  if (normalizeName(input.attested_name) !== normalizeName(performer))
    throw new VocalFixError('The typed name must match the performer on this session.', 403);
  if (input.statement !== undefined && input.statement !== CONSENT_STATEMENT)
    throw new VocalFixError('Unexpected consent statement.', 403);
  return { attested_name: input.attested_name.trim(), statement: CONSENT_STATEMENT };
}

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Minimal stored (uncompressed) ZIP; WAV barely compresses anyway. */
export function buildZip(entries: { name: string; data: Uint8Array }[]): Uint8Array {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const e of entries) {
    if (!/^[A-Za-z0-9._/-]+$/.test(e.name) || e.name.includes('..'))
      throw new Error('Bad zip entry name');
    const name = new TextEncoder().encode(e.name);
    const crc = crc32(e.data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, e.data.length, true);
    local.setUint32(22, e.data.length, true);
    local.setUint16(26, name.length, true);
    chunks.push(new Uint8Array(local.buffer), name, e.data);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, e.data.length, true);
    cd.setUint32(24, e.data.length, true);
    cd.setUint16(28, name.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), name);
    offset += 30 + name.length + e.data.length;
  }
  const cdSize = central.reduce((t, c) => t + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((t, c) => t + c.length, 0));
  let p = 0;
  for (const c of all) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

/** Shared voice registry at <data>/shared/voices/<id>.json (read by TTB Studio). */
export class VoiceRegistry {
  readonly dir: string;
  constructor(dataDir: string) {
    this.dir = resolve(dataDir, 'shared', 'voices');
  }

  static newId(): string {
    return 'voice-' + randomUUID();
  }

  path(id: string): string {
    if (!voiceIdPattern.test(id)) throw new VocalFixError('Unknown voice.', 404);
    const p = resolve(this.dir, id + '.json');
    if (!p.startsWith(this.dir + sep)) throw new VocalFixError('Unknown voice.', 404);
    return p;
  }

  async write(voice: VoiceModel): Promise<void> {
    if (!isVoiceModel(voice)) throw new VocalFixError('Invalid voice record.', 500);
    await mkdir(this.dir, { recursive: true });
    const target = this.path(voice.id);
    const tmp = target + '.' + randomUUID() + '.tmp';
    await writeFile(tmp, JSON.stringify(voice, null, 2));
    await rename(tmp, target);
  }

  async read(id: string): Promise<VoiceModel> {
    try {
      const v: unknown = JSON.parse(await readFile(this.path(id), 'utf8'));
      if (isVoiceModel(v)) return v;
    } catch {
      /* fall through */
    }
    throw new VocalFixError('Unknown voice.', 404);
  }

  async list(): Promise<VoiceModel[]> {
    let names: string[];
    try {
      names = await readdir(this.dir);
    } catch {
      return [];
    }
    const out: VoiceModel[] = [];
    for (const n of names.sort()) {
      const id = n.replace(/\.json$/, '');
      if (!n.endsWith('.json') || !voiceIdPattern.test(id)) continue;
      try {
        out.push(await this.read(id));
      } catch {
        /* skip unreadable entries */
      }
    }
    return out;
  }

  async remove(id: string): Promise<void> {
    await this.read(id);
    // Only this voice's own archive: '<id>.model.zip' in the registry dir.
    await rm(this.path(id).replace(/\.json$/, '.model.zip'), { force: true });
    await rm(this.path(id), { force: true });
  }
}

export function datasetEntryName(i: number): string {
  return 'dataset/vocal/' + String(i + 1).padStart(3, '0') + '.wav';
}
