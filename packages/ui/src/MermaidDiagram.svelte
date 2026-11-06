<script lang="ts">
  import Sigil from './Sigil.svelte';

  let {
    source,
    label = 'Diagram'
  }: {
    /** Mermaid source text. */
    source: string;
    /** Accessible name for the drawn diagram. */
    label?: string;
  } = $props();

  let host: HTMLDivElement | undefined = $state();
  let phase = $state<'loading' | 'ready' | 'error'>('loading');
  let message = $state('');

  type MermaidApi = (typeof import('mermaid'))['default'];
  let loader: Promise<MermaidApi> | null = null;
  let counter = 0;

  /** Mermaid cannot render several diagrams at once, so every instance on the page shares one queue. */
  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const g = globalThis as { __vbmMermaidQueue?: Promise<unknown> };
    const run = (g.__vbmMermaidQueue ?? Promise.resolve()).then(task, task);
    g.__vbmMermaidQueue = run.catch(() => undefined);
    return run;
  }

  function loadMermaid(): Promise<MermaidApi> {
    const g = globalThis as { __vbmMermaid?: Promise<MermaidApi> };
    if (g.__vbmMermaid) return g.__vbmMermaid;
    loader ??= import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        darkMode: true,
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        flowchart: { curve: 'basis', htmlLabels: false, padding: 14 },
        sequence: { mirrorActors: false, showSequenceNumbers: true },
        themeVariables: {
          background: '#05040a',
          fontSize: '17px',
          primaryColor: '#151026',
          primaryTextColor: '#ece6f7',
          primaryBorderColor: '#a774ff',
          secondaryColor: '#1d1430',
          secondaryTextColor: '#ece6f7',
          secondaryBorderColor: '#ff8a3d',
          tertiaryColor: '#0d0b16',
          tertiaryTextColor: '#ece6f7',
          tertiaryBorderColor: '#3ff0d2',
          lineColor: '#3ff0d2',
          textColor: '#ece6f7',
          mainBkg: '#151026',
          nodeBorder: '#a774ff',
          clusterBkg: '#0d0b16',
          clusterBorder: '#4a3d6e',
          titleColor: '#f0c96a',
          edgeLabelBackground: '#0d0b16',
          actorBkg: '#151026',
          actorBorder: '#a774ff',
          actorTextColor: '#ece6f7',
          actorLineColor: '#4a3d6e',
          signalColor: '#3ff0d2',
          signalTextColor: '#ece6f7',
          labelBoxBkgColor: '#1d1430',
          labelBoxBorderColor: '#ff8a3d',
          labelTextColor: '#ece6f7',
          loopTextColor: '#f0c96a',
          noteBkgColor: '#1d1430',
          noteBorderColor: '#ff8a3d',
          noteTextColor: '#ece6f7',
          activationBkgColor: '#2a1d47',
          activationBorderColor: '#a774ff',
          sequenceNumberColor: '#05040a',
          stateBkg: '#151026',
          stateLabelColor: '#ece6f7',
          compositeBackground: '#0d0b16',
          altBackground: '#120d20',
          specialStateColor: '#f0c96a',
          innerEndBackground: '#f0c96a'
        }
      });
      return mermaid;
    });
    g.__vbmMermaid = loader;
    return loader;
  }

  $effect(() => {
    const text = source;
    const el = host;
    if (!el) return;
    let cancelled = false;
    phase = 'loading';
    loadMermaid()
      .then((mermaid) =>
        enqueue(async () => {
          if (cancelled) return null;
          const id = `vbm-mermaid-${Date.now().toString(36)}-${counter++}`;
          return (await mermaid.render(id, text)).svg;
        })
      )
      .then((svg) => {
        if (cancelled || svg === null) return;
        el.innerHTML = svg;
        const drawn = el.querySelector('svg');
        drawn?.setAttribute('role', 'img');
        drawn?.setAttribute('aria-label', label);
        drawn?.removeAttribute('height');
        phase = 'ready';
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        message = err instanceof Error ? err.message : String(err);
        phase = 'error';
      });
    return () => {
      cancelled = true;
    };
  });
</script>

<div class="mermaid-frame" data-state={phase}>
  <div class="scroller">
    <div class="drawing" bind:this={host}></div>
  </div>
  {#if phase === 'loading'}
    <div class="veil" aria-live="polite">
      <Sigil size={44} />
      <span>Inscribing the diagram</span>
    </div>
  {:else if phase === 'error'}
    <div class="broken" role="alert">
      <p>The diagram could not be drawn: {message}</p>
      <pre>{source}</pre>
    </div>
  {/if}
</div>

<style>
  .mermaid-frame {
    position: relative;
    min-height: 8rem;
    border: 1px solid var(--vbm-line);
    background:
      radial-gradient(ellipse at 50% 0%, rgb(167 116 255 / 10%), transparent 70%), rgb(5 4 10 / 70%);
    clip-path: var(--vbm-clip);
  }
  .scroller {
    overflow-x: auto;
    padding: 1.25rem;
  }
  .drawing :global(svg) {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    min-width: 34rem;
    height: auto;
    filter: drop-shadow(0 0 6px rgb(167 116 255 / 25%));
  }
  .drawing :global(.flowchart-link),
  .drawing :global(.transition),
  .drawing :global([class^='messageLine']) {
    stroke-dasharray: 7 5;
    animation: vbm-mermaid-flow 1.4s linear infinite;
  }
  .drawing :global(.node rect),
  .drawing :global(.node polygon),
  .drawing :global(.actor) {
    filter: drop-shadow(0 0 4px rgb(167 116 255 / 45%));
  }
  .drawing :global(.cluster rect) {
    stroke-dasharray: 3 4;
  }
  .drawing :global(.edgeLabel),
  .drawing :global(.edgeLabel rect) {
    font-family: var(--vbm-font-mono);
    font-size: 0.8rem;
  }
  .veil {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 0.6rem;
    color: var(--vbm-faint);
    font-family: var(--vbm-font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
  }
  .broken {
    padding: 1rem 1.25rem;
    color: var(--vbm-blood);
  }
  .broken pre {
    overflow-x: auto;
    color: var(--vbm-muted);
    font-size: 0.8rem;
  }
  @keyframes vbm-mermaid-flow {
    to {
      stroke-dashoffset: -24;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .drawing :global(.flowchart-link),
    .drawing :global(.transition),
    .drawing :global([class^='messageLine']) {
      animation: none;
    }
  }
  @media (max-width: 40rem) {
    .scroller {
      padding: 0.75rem;
    }
  }
</style>
