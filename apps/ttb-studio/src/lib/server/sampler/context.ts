import { SongLibrary } from '../studio/library';
import { dataDir } from '../studio/paths';
import { KitStore } from './kits';
import { SoundLibrary } from './sounds';

export function samplerContext() {
  const root = dataDir();
  return { songs: new SongLibrary(root), sounds: new SoundLibrary(root), kits: new KitStore(root) };
}
