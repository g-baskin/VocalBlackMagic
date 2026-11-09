<script lang="ts">
  let {
    stages,
    detail
  }: {
    stages: { id: string; label: string; state: 'pending' | 'active' | 'done' | 'failed' }[];
    detail?: string;
  } = $props();

  const STATE_TEXT = {
    pending: 'waiting',
    active: 'in progress',
    done: 'complete',
    failed: 'failed'
  };
  const doneCount = $derived(stages.filter((s) => s.state === 'done').length);
</script>

<div class="steps">
  <ol aria-label="Progress: {doneCount} of {stages.length} stages complete">
    {#each stages as stage, i (stage.id)}
      <li class={stage.state} aria-current={stage.state === 'active' ? 'step' : undefined}>
        <span class="node" aria-hidden="true">
          <span class="rune"
            >{stage.state === 'failed' ? '✕' : stage.state === 'done' ? '✓' : i + 1}</span
          >
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
    background: var(--vbm-gradient);
  }
  .done {
    --c: var(--vbm-accent);
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
    border-radius: 50%;
    background: var(--c);
    padding: 1px;
  }
  .rune {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    border-radius: inherit;
    background: var(--vbm-void);
    color: var(--c);
    font-size: 0.95rem;
    font-weight: 700;
  }
  .done .rune {
    background: var(--vbm-gradient);
    color: #1a0b12;
  }
  .active .node {
    animation: throb 1.6s ease-in-out infinite;
  }
  .active .rune {
    background: color-mix(in srgb, var(--vbm-accent) 18%, var(--vbm-bg));
  }
  .label {
    font-size: 0.8rem;
    font-weight: 500;
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
    color: var(--vbm-muted);
  }
  @keyframes throb {
    50% {
      box-shadow: 0 0 0 6px rgb(255 79 139 / 18%);
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
