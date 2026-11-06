import { dataDir } from './paths';
import { VocalFixService } from './service';

let instance: VocalFixService | null = null;

/** One service per server process; the token is read lazily so it is never captured in logs. */
export function service(token: () => string | null): VocalFixService {
  instance ??= new VocalFixService(dataDir(), token);
  return instance;
}
