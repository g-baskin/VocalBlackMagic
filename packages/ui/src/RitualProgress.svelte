<script lang="ts">
  let {
    stages,
    detail
  }: {
    stages: { id: string; label: string; state: 'pending' | 'active' | 'done' | 'failed' }[];
    detail?: string;
  } = $props();

  const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ'];
  const STATE_TEXT = {
    pending: 'waiting',
    active: 'in progress',
    done: 'complete',
    failed: 'failed'
  };
  const doneCount = $derived(stages.filter((s) => s.state === 'done').length);
</script>

<div class="ritual">
  <ol aria-label="Progress: {doneCount} of {stages.length} stages complete">
    {#each stages as stage, i (stage.id)}
      <li class={stage.state} aria-current={stage.state === 'active' ? 'step' : undefined}>
        <span class="node" aria-hidden="true">
          <span class="rune">{stage.state === 'failed' ? '✕' : RUNES[i % RUNES.length]}</span>
        </span>
        <span class="label">{stage.label}</span>
        <span class="vbm-sr-only">({STATE_TEXT[stage.state]})</span>
      </li>
    {/each}
  </ol>
  {#if detail}<p class="detail" aria-live="polite">{detail}</p>{/if}
</div>

<style>
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0;
  }
  li {
    --c: var(--vbm-faint);
    flex: 1 1 6rem;
    position: relative;
    display: grid;
    justify-items: center;
    gap: 0.5rem;
    padding: 0 0.25rem 0.5rem;
    text-align: center;
  }
  li:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 1.4rem;
    left: calc(50% + 1.6rem);
    right: calc(-50% + 1.6rem);
    height: 1px;
    background: var(--vbm-line-bright);
  }
  li.done:not(:last-child)::after {
    background: linear-gradient(90deg, var(--vbm-teal), var(--vbm-violet));
    box-shadow: var(--vbm-glow-teal);
  }
  .done {
    --c: var(--vbm-teal);
  }
  .active {
    --c: var(--vbm-ember);
  }
  .failed {
    --c: var(--vbm-blood);
  }
  .node {
    width: 2.8rem;
    height: 2.8rem;
    display: grid;
    place-items: center;
    clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
    background: var(--c);
    padding: 1px;
  }
  .rune {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    clip-path: inherit;
    background: var(--vbm-void);
    color: var(--c);
    font-size: 1.1rem;
  }
  .done .rune {
    background: color-mix(in srgb, var(--vbm-teal) 20%, var(--vbm-void));
    text-shadow: var(--vbm-glow-teal);
  }
  .active .node {
    animation: throb 1.6s ease-in-out infinite;
  }
  .active .rune {
    text-shadow: var(--vbm-glow-ember);
  }
  .label {
    font-family: var(--vbm-font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--vbm-muted);
  }
  .active .label,
  .done .label {
    color: var(--vbm-text);
  }
  .failed .label {
    color: var(--vbm-blood);
  }
  .detail {
    margin: 0.75rem 0 0;
    text-align: center;
    font-style: italic;
    color: var(--vbm-muted);
  }
  @keyframes throb {
    50% {
      filter: drop-shadow(0 0 10px var(--vbm-ember)) brightness(1.3);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .active .node {
      animation: none;
      filter: brightness(1.3);
    }
  }
  @media (max-width: 520px) {
    ol {
      flex-direction: column;
      align-items: stretch;
    }
    li {
      grid-template-columns: auto 1fr;
      justify-items: start;
      align-items: center;
      text-align: left;
    }
    li:not(:last-child)::after {
      display: none;
    }
  }
</style>
