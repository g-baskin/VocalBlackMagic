<script lang="ts">
  import type { Snippet } from 'svelte';
  import Sigil from './Sigil.svelte';

  let {
    app,
    studioUrl,
    vocalFixUrl,
    children
  }: {
    app: 'studio' | 'vocal-fix';
    studioUrl: string;
    vocalFixUrl: string;
    children: Snippet;
  } = $props();
</script>

<div class="shell">
  <div class="backdrop" aria-hidden="true"></div>
  <a class="skip" href="#vbm-main">Skip to content</a>
  <header class="chrome">
    <a class="mark" href={app === 'studio' ? studioUrl : vocalFixUrl}>
      <Sigil size={34} />
      <span class="word">VBM <span class="vbm-gradient-text">Studio</span></span>
    </a>
    <nav aria-label="VBM Studio apps">
      <a href={studioUrl} aria-current={app === 'studio' ? 'page' : undefined}>Studio</a>
      <a href={vocalFixUrl} aria-current={app === 'vocal-fix' ? 'page' : undefined}>Vocal Fix</a>
    </nav>
  </header>
  <main id="vbm-main">
    {@render children()}
  </main>
</div>

<style>
  .shell {
    position: relative;
    display: flow-root;
    max-width: 100vw;
    min-height: 100vh;
    min-height: 100dvh;
    isolation: isolate;
    overflow-x: clip;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      radial-gradient(60rem 30rem at 85% -10%, rgb(255 79 139 / 10%), transparent 70%),
      radial-gradient(50rem 30rem at -10% 0%, rgb(79 139 255 / 8%), transparent 70%), var(--vbm-bg);
  }
  .skip {
    position: absolute;
    left: 1rem;
    top: -4rem;
    background: var(--vbm-blue);
    color: #0b1020;
    padding: 0.5rem 1rem;
    border-radius: var(--vbm-radius-sm);
    z-index: 50;
  }
  .skip:focus {
    top: calc(1rem + var(--vbm-safe-top));
  }
  .chrome {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: calc(0.6rem + var(--vbm-safe-top)) calc(clamp(1rem, 4vw, 3rem) + var(--vbm-safe-right))
      0.6rem calc(clamp(1rem, 4vw, 3rem) + var(--vbm-safe-left));
    background: rgb(18 18 22 / 82%);
    border-bottom: 1px solid var(--vbm-border);
    backdrop-filter: saturate(140%) blur(12px);
    -webkit-backdrop-filter: saturate(140%) blur(12px);
  }
  .mark {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-height: var(--vbm-tap);
    text-decoration: none;
    color: var(--vbm-text);
  }
  .word {
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    max-width: 100%;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem;
    background: var(--vbm-surface);
    border: 1px solid var(--vbm-border);
    border-radius: var(--vbm-radius-pill);
  }
  nav a {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0.35rem 0.9rem;
    border-radius: var(--vbm-radius-pill);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--vbm-muted);
    text-decoration: none;
    white-space: nowrap;
    transition:
      color 0.15s,
      background 0.15s;
  }
  nav a:hover {
    color: var(--vbm-text);
  }
  nav a[aria-current='page'] {
    color: var(--vbm-text);
    background: var(--vbm-surface-3);
  }
  main {
    min-width: 0;
    padding: clamp(1rem, 3vw, 2rem) calc(clamp(1rem, 4vw, 3rem) + var(--vbm-safe-right))
      calc(3rem + var(--vbm-safe-bottom)) calc(clamp(1rem, 4vw, 3rem) + var(--vbm-safe-left));
  }
  @media (max-width: 420px) {
    .word {
      font-size: 1.05rem;
    }
    nav a {
      padding: 0.35rem 0.7rem;
    }
  }
</style>
