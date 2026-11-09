import adapter from '@sveltejs/adapter-bun';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { normaliseBase } from './src/lib/base';

// '' locally; '/vocal-fix' in the Cloudflare container build (infra/cloudflare/studio-container).
const base = normaliseBase(process.env.VITE_VBM_BASE);

export default defineConfig({
  plugins: [sveltekit({ adapter: adapter(), paths: { base } })]
});
