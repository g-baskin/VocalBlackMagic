import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';

for (const app of ['ttb-studio', 'vocal-fix']) {
  test(`${app} Node build serves pages and denies protected operations`, async () => {
    const { handler } = await import(`../apps/${app}/build/handler.js`);
    const server = createServer(handler);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const url = `http://127.0.0.1:${server.address().port}`;
      const page = await fetch(url);
      assert.equal(page.status, 200);
      assert.match(await page.text(), app === 'ttb-studio' ? /TTB Studio/ : /Vocal Fix/);
      const health = await fetch(`${url}/api/health`);
      assert.equal(health.status, 200);
      assert.equal((await health.json()).auth_ready, false);
      const paths = app === 'ttb-studio'
        ? [['POST', '/api/generations']]
        : [['POST', '/api/references'], ['GET', '/api/references/00000000-0000-0000-0000-000000000000'], ['DELETE', '/api/references/00000000-0000-0000-0000-000000000000']];
      // The Node adapter assumes HTTPS behind a TLS-terminating proxy.
      for (const [method, path] of paths) {
        const response = await fetch(url + path, { method, headers: { origin: url.replace('http:', 'https:') } });
        assert.equal(response.status, 403, `${method} ${path}`);
        assert.match((await response.json()).detail, /authentication|Authentication/);
      }
    } finally {
      server.closeAllConnections();
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
}
