<script lang="ts">
  import ArcanePanel from './ArcanePanel.svelte';
  import MermaidDiagram from './MermaidDiagram.svelte';
  import { extractMermaidDiagrams } from './mermaid-doc';

  let {
    markdown,
    title = 'How it works',
    eyebrow = 'Design diagrams',
    lede = 'How VBM Studio fits together: every app, processing step and data store, mapped.'
  }: {
    /** A markdown document containing ```mermaid blocks (docs/DESIGN.md). */
    markdown: string;
    title?: string;
    eyebrow?: string;
    lede?: string;
  } = $props();

  const diagrams = $derived(extractMermaidDiagrams(markdown));
  const glows = ['violet', 'teal', 'ember'] as const;
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  function anchor(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
</script>

<div class="codex">
  <header class="intro">
    <p class="eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    <p class="lede">{lede}</p>
    {#if diagrams.length > 0}
      <nav class="index" aria-label="Diagrams">
        {#each diagrams as d, i (i)}
          <a href={`#${anchor(d.title)}-${i}`}>
            <span class="num">{numerals[i] ?? i + 1}</span>
            {d.title}
          </a>
        {/each}
      </nav>
    {/if}
  </header>

  {#if diagrams.length === 0}
    <ArcanePanel title="No diagrams found" glow="ember">
      <p>The design document holds no Mermaid diagrams yet.</p>
    </ArcanePanel>
  {:else}
    {#each diagrams as d, i (i)}
      <div class="entry" id={`${anchor(d.title)}-${i}`}>
        <ArcanePanel
          eyebrow={`${numerals[i] ?? i + 1} · diagram`}
          title={d.title}
          glow={glows[i % glows.length]}
        >
          {#if d.intro}<p class="prose">{d.intro}</p>{/if}
          <MermaidDiagram source={d.source} label={d.title} />
          {#if d.outro}<p class="prose after">{d.outro}</p>{/if}
        </ArcanePanel>
      </div>
    {/each}
  {/if}
</div>

<style>
  .codex {
    display: grid;
    gap: 1.75rem;
    min-width: 0;
  }
  .intro {
    text-align: center;
    display: grid;
    justify-items: center;
    gap: 0.5rem;
  }
  .eyebrow {
    margin: 0;
    color: var(--vbm-ember);
    font-family: var(--vbm-font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  h1 {
    margin: 0;
    font-family: var(--vbm-font-display);
    font-size: clamp(2.2rem, 6vw, 4rem);
    font-weight: 400;
    letter-spacing: 0.08em;
    background: linear-gradient(90deg, var(--vbm-text), var(--vbm-violet), var(--vbm-teal));
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }
  .lede {
    margin: 0;
    max-width: 40rem;
    color: var(--vbm-muted);
    font-style: italic;
    font-size: 1.1rem;
  }
  .index {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem 1.25rem;
    margin-top: 0.75rem;
    max-width: 56rem;
  }
  .index a {
    color: var(--vbm-teal);
    text-decoration: none;
    font-family: var(--vbm-font-display);
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border-bottom: 1px solid transparent;
  }
  .index a:hover,
  .index a:focus-visible {
    border-color: var(--vbm-violet);
  }
  .num {
    color: var(--vbm-gold);
    margin-right: 0.3rem;
  }
  .entry {
    scroll-margin-top: 5rem;
    min-width: 0;
  }
  .prose {
    margin: 0 0 1rem;
    color: var(--vbm-muted);
    font-size: 1.05rem;
    line-height: 1.5;
  }
  .prose.after {
    margin: 1rem 0 0;
  }
</style>
