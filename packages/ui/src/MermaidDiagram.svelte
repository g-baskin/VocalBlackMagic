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
          background: '#121216',
          fontSize: '17px',
          primaryColor: '#232329',
          primaryTextColor: '#f4f4f6',
          primaryBorderColor: '#ff4f8b',
          secondaryColor: '#2c2c34',
          secondaryTextColor: '#f4f4f6',
          secondaryBorderColor: '#ff8a3d',
          tertiaryColor: '#1a1a20',
          tertiaryTextColor: '#f4f4f6',
          tertiaryBorderColor: '#4f8bff',
          lineColor: '#4f8bff',
          textColor: '#f4f4f6',
          mainBkg: '#232329',
          nodeBorder: '#ff4f8b',
          clusterBkg: '#1a1a20',
          clusterBorder: '#45454f',
          titleColor: '#ffc04d',
          edgeLabelBackground: '#1a1a20',
          actorBkg: '#232329',
          actorBorder: '#ff4f8b',
          actorTextColor: '#f4f4f6',
          actorLineColor: '#45454f',
          signalColor: '#4f8bff',
          signalTextColor: '#f4f4f6',
          labelBoxBkgColor: '#2c2c34',
          labelBoxBorderColor: '#ff8a3d',
          labelTextColor: '#f4f4f6',
          loopTextColor: '#ffc04d',
          noteBkgColor: '#2c2c34',
          noteBorderColor: '#ff8a3d',
          noteTextColor: '#f4f4f6',
          activationBkgColor: '#34343e',
          activationBorderColor: '#ff4f8b',
          sequenceNumberColor: '#121216',
          stateBkg: '#232329',
          stateLabelColor: '#f4f4f6',
          compositeBackground: '#1a1a20',
          altBackground: '#1e1e24',
          specialStateColor: '#ffc04d',
          innerEndBackground: '#ffc04d'
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
      radial-gradient(ellipse at 50% 0%, rgb(255 79 139 / 10%), transparent 70%),
      rgb(18 18 22 / 70%);
    border-radius: var(--vbm-radius-sm);
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
  }
  .drawing :global(.flowchart-link),
  .drawing :global(.transition),
  .drawing :global([class^='messageLine']) {
    stroke-dasharray: 7 5;
    animation: vbm-mermaid-flow 1.4s linear infinite;
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
    letter-spacing: 0.04em;
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
