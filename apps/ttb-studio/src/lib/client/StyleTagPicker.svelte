<script lang="ts">
  import {
    MAX_STYLE_TAGS,
    hasTag,
    parseTags,
    searchTags,
    styleCategories,
    toggleTag
  } from './style-tags';

  /** Comma-separated style tags; the picker and the text box edit the same value. */
  let { value = $bindable('') }: { value?: string } = $props();

  let open = $state(false);
  let tab = $state(styleCategories[0].id);
  let query = $state('');
  let custom = $state('');

  const selected = $derived(parseTags(value));
  const full = $derived(selected.length >= MAX_STYLE_TAGS);
  const results = $derived(searchTags(query));
  const current = $derived(styleCategories.find((c) => c.id === tab) ?? styleCategories[0]);

  function toggle(tag: string) {
    value = toggleTag(value, tag);
  }

  function addCustom(event: SubmitEvent) {
    event.preventDefault();
    for (const tag of custom.split(',')) {
      if (tag.trim() && !hasTag(value, tag)) value = toggleTag(value, tag);
    }
    custom = '';
  }
</script>

<div class="picker">
  <div class="head">
    <span class="label" id="style-tags-label">Style tags</span>
    <span class="count" class:full aria-live="polite">{selected.length}/{MAX_STYLE_TAGS}</span>
  </div>

  {#if selected.length}
    <ul class="selected" aria-labelledby="style-tags-label">
      {#each selected as tag (tag)}
        <li>
          <button
            type="button"
            class="chip on"
            onclick={() => toggle(tag)}
            aria-label="Remove {tag}"
          >
            {tag}<span aria-hidden="true">×</span>
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="hint">No style tags yet. Browse below or type your own.</p>
  {/if}

  <form class="own" onsubmit={addCustom}>
    <input
      type="text"
      bind:value={custom}
      maxlength={200}
      placeholder="Type your own, e.g. dreamy guitar"
      aria-label="Add your own style tag"
      disabled={full}
    />
    <button type="submit" class="add" disabled={full || !custom.trim()}>Add</button>
  </form>

  <button
    type="button"
    class="browse"
    aria-expanded={open}
    aria-controls="style-browser"
    onclick={() => (open = !open)}
  >
    {open ? 'Hide styles' : 'Browse styles'}
    <span aria-hidden="true" class="caret" class:up={open}>▾</span>
  </button>

  {#if open}
    <div class="browser" id="style-browser">
      <input
        type="search"
        class="search"
        bind:value={query}
        placeholder="Search styles"
        aria-label="Search styles"
      />
      {#if full}
        <p class="hint warn">You have {MAX_STYLE_TAGS} tags. Remove one to add another.</p>
      {/if}

      {#if query.trim()}
        {#if results.length === 0}
          <p class="hint">No match. Use “Add” above to keep it as your own tag.</p>
        {/if}
        {#each results as group (group.category.id)}
          <p class="group">{group.category.label}</p>
          {@render grid(group.tags)}
        {/each}
      {:else}
        <div class="tabs" role="tablist" aria-label="Style categories">
          {#each styleCategories as category (category.id)}
            {@const count = category.tags.filter((t) => hasTag(value, t)).length}
            <button
              type="button"
              role="tab"
              aria-selected={tab === category.id}
              class:active={tab === category.id}
              onclick={() => (tab = category.id)}
            >
              {category.label}{#if count}<span class="badge">{count}</span>{/if}
            </button>
          {/each}
        </div>
        <div role="tabpanel" aria-label={current.label}>
          {@render grid(current.tags)}
        </div>
      {/if}
    </div>
  {/if}
</div>

{#snippet grid(tags: readonly string[])}
  <div class="grid">
    {#each tags as tag (tag)}
      {@const on = hasTag(value, tag)}
      <button
        type="button"
        class="chip"
        class:on
        aria-pressed={on}
        disabled={!on && full}
        onclick={() => toggle(tag)}>{tag}</button
      >
    {/each}
  </div>
{/snippet}

<style>
  .picker {
    display: grid;
    gap: 0.6rem;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .label {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--vbm-text);
  }
  .count {
    font-family: var(--vbm-font-mono);
    font-size: 0.8rem;
    color: var(--vbm-muted);
  }
  .count.full {
    color: var(--vbm-warning);
  }
  .hint {
    margin: 0;
    color: var(--vbm-muted);
    font-size: 0.85rem;
  }
  .hint.warn {
    color: var(--vbm-warning);
  }
  .selected {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .own {
    display: flex;
    gap: 0.5rem;
  }
  input {
    flex: 1;
    min-width: 0;
    min-height: var(--vbm-tap);
    padding: 0.5rem 0.85rem;
    background: var(--vbm-surface-2);
    color: var(--vbm-text);
    border: 1px solid var(--vbm-border-strong);
    border-radius: var(--vbm-radius);
    font: inherit;
    font-size: 1rem;
  }
  input:focus-visible,
  button:focus-visible {
    outline: none;
    box-shadow: var(--vbm-focus);
  }
  .add,
  .browse {
    min-height: var(--vbm-tap);
    padding: 0 1rem;
    background: var(--vbm-surface-3);
    color: var(--vbm-text);
    border: 1px solid var(--vbm-border-strong);
    border-radius: var(--vbm-radius-pill);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .browse {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .caret {
    transition: transform 0.15s ease;
  }
  .caret.up {
    transform: rotate(180deg);
  }
  .add:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .browser {
    display: grid;
    gap: 0.7rem;
    padding: 0.85rem;
    background: var(--vbm-surface-2);
    border: 1px solid var(--vbm-border);
    border-radius: var(--vbm-radius-lg);
  }
  .tabs {
    display: flex;
    gap: 0.4rem;
    overflow-x: auto;
    scrollbar-width: none;
    margin: 0 -0.2rem;
    padding: 0 0.2rem 0.1rem;
  }
  .tabs button {
    flex: none;
    min-height: 40px;
    padding: 0 0.9rem;
    background: transparent;
    color: var(--vbm-muted);
    border: 1px solid var(--vbm-border);
    border-radius: var(--vbm-radius-pill);
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .tabs button.active {
    background: var(--vbm-text);
    color: var(--vbm-bg);
    border-color: var(--vbm-text);
  }
  .badge {
    min-width: 1.3rem;
    padding: 0 0.3rem;
    border-radius: var(--vbm-radius-pill);
    background: var(--vbm-gradient);
    color: var(--vbm-on-accent);
    font-size: 0.75rem;
    line-height: 1.3rem;
    text-align: center;
  }
  .group {
    margin: 0.2rem 0 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--vbm-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    max-height: 18rem;
    overflow-y: auto;
  }
  .chip {
    min-height: 38px;
    padding: 0.3rem 0.85rem;
    background: var(--vbm-surface-3);
    color: var(--vbm-text);
    border: 1px solid var(--vbm-border-strong);
    border-radius: var(--vbm-radius-pill);
    font: inherit;
    font-size: 0.9rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .chip.on {
    background: var(--vbm-gradient);
    color: var(--vbm-on-accent);
    border-color: transparent;
    font-weight: 600;
  }
  .chip:disabled {
    opacity: 0.4;
    cursor: default;
  }
  @media (hover: hover) {
    .chip:not(:disabled):not(.on):hover,
    .tabs button:not(.active):hover {
      border-color: var(--vbm-accent);
      color: var(--vbm-text);
    }
  }
</style>
