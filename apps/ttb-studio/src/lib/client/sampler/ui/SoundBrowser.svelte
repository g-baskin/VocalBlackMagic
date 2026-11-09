<script lang="ts">
  import {
    soundCategories,
    type KitSummary,
    type SoundCategory,
    type SoundMeta
  } from '@vbm/contracts';
  import { moreLike } from '../similar';

  let {
    sounds,
    kits,
    view = $bindable(),
    selectedId = $bindable(),
    padName,
    kitName = $bindable(),
    kitId,
    dirty,
    busy,
    onassign,
    onpreview,
    onfavourite,
    ondelete,
    onopenkit,
    onsavekit,
    onnewkit,
    ondeletekit,
    onexportkit
  }: {
    sounds: SoundMeta[];
    kits: KitSummary[];
    view: 'kits' | 'sounds';
    selectedId: string | null;
    padName: string;
    kitName: string;
    kitId: string | null;
    dirty: boolean;
    busy: boolean;
    onassign: (layer: number) => void;
    onpreview: (sound: SoundMeta) => void;
    onfavourite: (sound: SoundMeta) => void;
    ondelete: (sound: SoundMeta) => void;
    onopenkit: (id: string) => void;
    onsavekit: () => void;
    onnewkit: () => void;
    ondeletekit: (id: string) => void;
    onexportkit: () => void;
  } = $props();

  let query = $state('');
  let category = $state<SoundCategory | 'all'>('all');
  let favourites = $state(false);
  let like = $state<SoundMeta | null>(null);

  const selected = $derived(sounds.find((s) => s.id === selectedId) ?? null);
  const shown = $derived.by(() => {
    const q = query.trim().toLowerCase();
    const base = like ? moreLike(like, sounds, 60) : sounds;
    return base.filter(
      (s) =>
        (category === 'all' || s.category === category) &&
        (!favourites || s.favourite) &&
        (!q || (s.name + ' ' + s.category + ' ' + s.tags.join(' ')).toLowerCase().includes(q))
    );
  });
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
  const badge = (s: SoundMeta) => {
    if (s.source.kind === 'slice' && s.source.commercial === false) return 'Non-commercial';
    if (s.source.kind === 'slice' && s.source.commercial === null) return 'Licence unknown';
    if (s.source.kind === 'ai') return 'AI';
    return null;
  };
  const thumbPath = (t: number[]) => {
    const h = 28;
    return t
      .filter((_, i) => i % 2 === 0)
      .map((v, i) => {
        const y = Math.max(0.6, v * (h / 2 - 2));
        return `M${2 + i} ${h / 2 - y}V${h / 2 + y}`;
      })
      .join('');
  };
  function dragStart(e: DragEvent, s: SoundMeta) {
    e.dataTransfer?.setData('application/x-vbm-sound', s.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
  }
</script>

<div class="browser">
  <label class="search">
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"
      ><circle
        cx="8.5"
        cy="8.5"
        r="5.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
      /><path d="M13 13l4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg
    >
    <span class="sr">Search sounds</span>
    <input type="search" placeholder="Search sounds, moods" bind:value={query} />
  </label>

  <div class="switch">
    <div class="seg" role="tablist" aria-label="Browse">
      <button role="tab" aria-selected={view === 'kits'} onclick={() => (view = 'kits')}
        >Kits</button
      >
      <button role="tab" aria-selected={view === 'sounds'} onclick={() => (view = 'sounds')}
        >Sounds</button
      >
    </div>
    <button
      class="star-filter"
      class:on={favourites}
      aria-pressed={favourites}
      aria-label="Show favourites only"
      onclick={() => (favourites = !favourites)}>★</button
    >
  </div>

  {#if view === 'sounds'}
    <div class="chips" role="group" aria-label="Category">
      <button
        class:on={category === 'all'}
        aria-pressed={category === 'all'}
        onclick={() => (category = 'all')}>All</button
      >
      {#each soundCategories as c (c)}
        <button
          class:on={category === c}
          aria-pressed={category === c}
          onclick={() => (category = c)}>{cap(c)}</button
        >
      {/each}
    </div>
    {#if like}
      <div class="like">
        Like <strong>{like.name}</strong>
        <button aria-label="Stop showing similar sounds" onclick={() => (like = null)}>✕</button>
      </div>
    {/if}

    <ul class="list" aria-label="Sounds">
      {#each shown as s (s.id)}
        {@const b = badge(s)}
        <li class:sel={s.id === selectedId}>
          <button
            class="item"
            draggable="true"
            ondragstart={(e) => dragStart(e, s)}
            onclick={() => (selectedId = s.id)}
            ondblclick={() => onpreview(s)}
            aria-pressed={s.id === selectedId}
          >
            <svg class="thumb" viewBox="0 0 28 28" aria-hidden="true"
              ><path d={thumbPath(s.features.thumb)} stroke="currentColor" stroke-width="1" /></svg
            >
            <span class="meta">
              <span class="name">{s.name}</span>
              <span class="tags"
                ><span class="words">{cap(s.category)}&nbsp; {s.tags.slice(0, 3).join(', ')}</span>
                {#if b}<em class="badge" class:warn={b !== 'AI'}>{b}</em>{/if}</span
              >
            </span>
          </button>
          <button
            class="fav"
            class:on={s.favourite}
            aria-pressed={s.favourite}
            aria-label={(s.favourite ? 'Unfavourite ' : 'Favourite ') + s.name}
            onclick={() => onfavourite(s)}>{s.favourite ? '★' : '☆'}</button
          >
        </li>
      {:else}
        <li class="empty">
          {sounds.length
            ? 'No sounds match.'
            : 'No sounds yet. Use Add sounds to slice, upload or make some.'}
        </li>
      {/each}
    </ul>

    <div class="actions">
      <button disabled={!selected} onclick={() => selected && onpreview(selected)}>▷ Preview</button
      >
      <button disabled={!selected} onclick={() => (like = selected)}>∞ More like this</button>
    </div>
    <div class="assign">
      <span class="caps">To pad {padName}</span>
      <div class="layers">
        {#each [0, 1, 2] as l (l)}
          <button
            disabled={!selected}
            onclick={() => onassign(l)}
            aria-label="Send to layer {l + 1}">L{l + 1}</button
          >
        {/each}
      </div>
      {#if selected}
        <button class="delete" onclick={() => ondelete(selected)}>Delete sound</button>
      {/if}
    </div>
  {:else}
    <div class="kitform">
      <label>
        <span class="caps">Kit name</span>
        <input type="text" maxlength="80" bind:value={kitName} />
      </label>
      <div class="actions">
        <button class="primary" disabled={busy} onclick={onsavekit}
          >{kitId ? (dirty ? 'Save changes' : 'Saved') : 'Save kit'}</button
        >
        <button disabled={busy} onclick={onnewkit}>New kit</button>
      </div>
      <button disabled={busy} onclick={onexportkit}>Export kit reel (WAV)</button>
    </div>
    <ul class="list" aria-label="Saved kits">
      {#each kits as k (k.id)}
        <li class:sel={k.id === kitId}>
          <button class="item" onclick={() => onopenkit(k.id)} disabled={busy}>
            <span class="meta">
              <span class="name">{k.name}</span>
              <span class="tags">{k.pads_used} pads · {k.bpm} BPM</span>
            </span>
          </button>
          <button class="fav" aria-label="Delete kit {k.name}" onclick={() => ondeletekit(k.id)}
            >✕</button
          >
        </li>
      {:else}
        <li class="empty">No saved kits yet.</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .browser {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    min-height: 0;
    height: 100%;
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.8rem;
    border: 1px solid var(--pads-line);
    border-radius: 10px;
    background: var(--pads-field);
    color: var(--pads-muted);
  }
  .search input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: var(--pads-text);
    padding: 0.65rem 0;
    font: inherit;
    font-size: 0.85rem;
  }
  .search input:focus {
    outline: none;
  }
  .search:focus-within {
    outline: 2px solid var(--pads-focus);
  }
  .switch {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.25rem;
    border: 1px solid var(--pads-line);
    border-radius: 10px;
  }
  .seg {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .seg button,
  .star-filter {
    border: 0;
    background: transparent;
    color: var(--pads-muted);
    padding: 0.4rem;
    border-radius: 7px;
    font: inherit;
    font-size: 0.78rem;
    cursor: pointer;
  }
  .seg button[aria-selected='true'] {
    background: #eceaf5;
    color: #15131f;
  }
  .star-filter {
    font-size: 1rem;
    padding: 0.2rem 0.5rem;
  }
  .star-filter.on {
    color: #ffc75a;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .chips button {
    border: 1px solid var(--pads-line);
    background: rgb(255 255 255 / 3%);
    color: var(--pads-text);
    border-radius: 999px;
    padding: 0.28rem 0.7rem;
    font: inherit;
    font-size: 0.72rem;
    cursor: pointer;
  }
  .chips button.on {
    border-color: #ff5a3c;
    background: rgb(255 90 60 / 12%);
  }
  .like {
    font-size: 0.75rem;
    color: var(--pads-muted);
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }
  .like button {
    border: 0;
    background: none;
    color: var(--pads-text);
    cursor: pointer;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    flex: 1;
    min-height: 8rem;
    scrollbar-width: thin;
  }
  .list li {
    display: flex;
    align-items: center;
    border-radius: 9px;
  }
  .list li.sel {
    background: rgb(255 255 255 / 6%);
  }
  .item {
    flex: 1;
    min-width: 0;
    display: flex;
    gap: 0.65rem;
    align-items: center;
    border: 0;
    background: none;
    color: inherit;
    text-align: left;
    padding: 0.45rem 0.4rem;
    font: inherit;
    cursor: pointer;
    border-radius: 9px;
  }
  .item:focus-visible,
  .list button:focus-visible,
  .actions button:focus-visible,
  .layers button:focus-visible,
  .chips button:focus-visible,
  .seg button:focus-visible {
    outline: 2px solid var(--pads-focus);
    outline-offset: 1px;
  }
  .thumb {
    flex: none;
    width: 30px;
    height: 30px;
    padding: 1px;
    border-radius: 6px;
    background: rgb(255 255 255 / 5%);
    color: #e7a0a8;
  }
  .meta {
    display: grid;
    min-width: 0;
  }
  .name {
    font-size: 0.8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tags {
    font-size: 0.66rem;
    color: var(--pads-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .meta .tags {
    display: flex;
    gap: 0.3rem;
    align-items: baseline;
  }
  .words {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .badge {
    flex: none;
    font-style: normal;
    margin-left: 0.3rem;
    padding: 0 0.3rem;
    border-radius: 4px;
    background: rgb(95 212 230 / 15%);
    color: #8fe6f2;
  }
  .badge.warn {
    background: rgb(255 199 90 / 14%);
    color: #ffd27a;
  }
  .fav {
    border: 0;
    background: none;
    color: var(--pads-muted);
    font-size: 1rem;
    padding: 0.3rem 0.5rem;
    cursor: pointer;
  }
  .fav.on {
    color: #ffc75a;
  }
  .empty {
    padding: 1rem 0.4rem;
    font-size: 0.8rem;
    color: var(--pads-muted);
  }
  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .actions button,
  .layers button,
  .kitform > button,
  .delete {
    border: 1px solid var(--pads-line);
    background: rgb(255 255 255 / 3%);
    color: var(--pads-text);
    border-radius: 9px;
    padding: 0.55rem;
    font: inherit;
    font-size: 0.78rem;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .primary {
    background: linear-gradient(90deg, #ffb15a, #ff4f6a) !important;
    color: #1a0f14 !important;
    border: 0 !important;
  }
  .assign {
    display: grid;
    gap: 0.4rem;
  }
  .caps {
    font-family: var(--vbm-font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--pads-muted);
  }
  .layers {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border: 1px solid var(--pads-line);
    border-radius: 9px;
  }
  .layers button {
    border: 0;
    background: none;
  }
  .delete {
    font-size: 0.7rem;
    padding: 0.35rem;
    color: #ff8a8a;
  }
  .kitform {
    display: grid;
    gap: 0.6rem;
  }
  .kitform label {
    display: grid;
    gap: 0.3rem;
  }
  .kitform input {
    border: 1px solid var(--pads-line);
    background: var(--pads-field);
    color: var(--pads-text);
    border-radius: 9px;
    padding: 0.55rem 0.7rem;
    font: inherit;
    font-size: 0.85rem;
  }
</style>
