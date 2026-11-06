<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import Sigil from './Sigil.svelte';
  import { prefersReducedMotion } from './canvas';

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

  let canvas: HTMLCanvasElement | undefined = $state();

  onMount(() => {
    const el = canvas;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // Size the backing store from the canvas's own box (fixed, inset 0 = the viewport),
    // so it follows any viewport change, including ones that fire no window resize.
    const resize = () => {
      const rect = el.getBoundingClientRect();
      w = Math.max(1, rect.width || window.innerWidth);
      h = Math.max(1, rect.height || window.innerHeight);
      el.width = Math.round(w * dpr * 0.5);
      el.height = Math.round(h * dpr * 0.5);
      ctx.setTransform(dpr * 0.5, 0, 0, dpr * 0.5, 0, 0);
    };
    const motes = Array.from({ length: 7 }, (_, i) => ({
      phase: i * 1.7,
      speed: 0.00004 + i * 0.000009,
      hue: ['167,116,255', '255,138,61', '63,240,210'][i % 3],
      r: 0.35 + (i % 3) * 0.12
    }));
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        const a = m.phase + t * m.speed;
        const x = w * (0.5 + 0.42 * Math.cos(a * 1.3));
        const y = h * (0.5 + 0.38 * Math.sin(a));
        const r = Math.max(w, h) * m.r;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${m.hue},0.10)`);
        g.addColorStop(1, `rgba(${m.hue},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    };
    const reduced = prefersReducedMotion();
    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    const onResize = () => {
      resize();
      if (reduced) draw(0);
    };
    resize();
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    window.addEventListener('resize', onResize);
    if (reduced) draw(0);
    else raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  });
</script>

<div class="shell vbm-grain">
  <div class="void" aria-hidden="true"></div>
  <canvas class="smoke" bind:this={canvas} aria-hidden="true"></canvas>
  <a class="skip" href="#vbm-main">Skip to content</a>
  <header class="chrome">
    <a class="mark" href={app === 'studio' ? studioUrl : vocalFixUrl}>
      <Sigil size={40} spin />
      <span class="word">
        <span class="vbm">VBM</span>
        <span class="full">Vocal Black Magic</span>
      </span>
    </a>
    <nav aria-label="Vocal Black Magic apps">
      <a href={studioUrl} aria-current={app === 'studio' ? 'page' : undefined}>The Studio</a>
      <span class="rune" aria-hidden="true">ᛟ</span>
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
    isolation: isolate;
    background: transparent;
  }
  /* Both layers are pinned to the viewport, so the page never runs past them at any height. */
  .void,
  .smoke {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .void {
    z-index: -2;
    background:
      radial-gradient(ellipse at 50% -10%, rgb(91 43 196 / 28%), transparent 60%),
      radial-gradient(ellipse at 0% 100%, rgb(255 138 61 / 8%), transparent 55%),
      radial-gradient(ellipse at 100% 60%, rgb(63 240 210 / 7%), transparent 55%), var(--vbm-void);
  }
  .smoke {
    z-index: -1;
    pointer-events: none;
    filter: blur(30px);
  }
  .skip {
    position: absolute;
    left: 1rem;
    top: -4rem;
    background: var(--vbm-teal);
    color: var(--vbm-void);
    padding: 0.5rem 1rem;
    z-index: 10;
  }
  .skip:focus {
    top: 1rem;
  }
  .chrome {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 1rem clamp(1rem, 5vw, 4rem);
    border-bottom: 1px solid var(--vbm-line);
    background: linear-gradient(180deg, rgb(5 4 10 / 85%), rgb(5 4 10 / 40%));
    backdrop-filter: blur(6px);
  }
  .mark {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: var(--vbm-text);
  }
  .word {
    display: flex;
    flex-direction: column;
    line-height: 1.05;
  }
  .vbm {
    font-family: var(--vbm-font-display);
    font-weight: 700;
    font-size: 1.4rem;
    letter-spacing: 0.35em;
    background: linear-gradient(90deg, var(--vbm-violet), var(--vbm-ember));
    background-clip: text;
    color: transparent;
  }
  .full {
    font-family: var(--vbm-font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--vbm-muted);
  }
  nav {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  nav a {
    font-family: var(--vbm-font-display);
    font-size: 0.85rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--vbm-muted);
    text-decoration: none;
    padding: 0.45rem 0.9rem;
    clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
    transition:
      color 0.2s,
      background 0.2s;
  }
  nav a:hover {
    color: var(--vbm-text);
    background: var(--vbm-obsidian-2);
  }
  nav a[aria-current='page'] {
    color: var(--vbm-void);
    background: linear-gradient(90deg, var(--vbm-violet), var(--vbm-teal));
  }
  nav a:focus-visible {
    outline-offset: 4px;
  }
  .rune {
    color: var(--vbm-faint);
  }
  main {
    min-width: 0;
    padding: clamp(1rem, 4vw, 3rem) clamp(1rem, 5vw, 4rem) 4rem;
  }
  @media (max-width: 640px) {
    main,
    .chrome {
      padding-inline: 1rem;
    }
  }
</style>
