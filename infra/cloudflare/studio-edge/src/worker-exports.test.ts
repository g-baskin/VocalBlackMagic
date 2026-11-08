import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The Workers runtime cannot be loaded under bun test, so check the entrypoint source instead.
// Without this export, @cloudflare/containers fails at container start with
// "ctx.exports.ContainerProxy is undefined" whenever outboundByHost interception is used.
test('worker entrypoint exports ContainerProxy, the container class and a default handler', () => {
  const source = readFileSync(join(import.meta.dir, 'worker.ts'), 'utf8');
  expect(source).toMatch(/^export \{ ContainerProxy \} from '@cloudflare\/containers';$/m);
  expect(source).toMatch(/^export class StudioContainer extends Container/m);
  expect(source).toMatch(/^export default \{/m);
  if (source.includes('outboundByHost')) expect(source).toContain('ContainerProxy');
});

test('worker entrypoint pins the container port per app', () => {
  const source = readFileSync(join(import.meta.dir, 'worker.ts'), 'utf8');
  expect(source).toContain('switchPort(forwarded, port)');
  expect(source).toMatch(/requiredPorts = \[STUDIO_PORT, VOCAL_FIX_PORT\]/);
});
