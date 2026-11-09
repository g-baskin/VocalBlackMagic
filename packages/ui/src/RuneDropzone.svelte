<script lang="ts">
  let {
    label,
    accept,
    multiple = false,
    files = $bindable([]),
    hint,
    max,
    disabled = false,
    id
  }: {
    label: string;
    accept?: string;
    multiple?: boolean;
    files: File[];
    hint?: string;
    max?: number;
    disabled?: boolean;
    id?: string;
  } = $props();

  const uid = $props.id();
  const inputId = $derived(id ?? `vbm-drop-${uid}`);
  const limit = $derived(multiple ? (max ?? Infinity) : 1);
  let input: HTMLInputElement | undefined = $state();
  let over = $state(false);
  let notice = $state('');

  function matches(file: File): boolean {
    if (!accept) return true;
    const name = file.name.toLowerCase();
    return accept.split(',').some((raw) => {
      const rule = raw.trim().toLowerCase();
      if (!rule) return false;
      if (rule.startsWith('.')) return name.endsWith(rule);
      if (rule.endsWith('/*')) return file.type.startsWith(rule.slice(0, -1));
      return file.type === rule;
    });
  }

  function add(list: FileList | null | undefined) {
    if (!list || disabled) return;
    const incoming = [...list];
    const valid = incoming.filter(matches);
    const rejected = incoming.length - valid.length;
    const base = multiple ? files : [];
    const merged = [...base, ...valid].slice(0, limit);
    const dropped = base.length + valid.length - merged.length;
    files = merged;
    const parts: string[] = [];
    if (rejected) parts.push(`${rejected} file${rejected === 1 ? '' : 's'} refused (wrong type)`);
    if (dropped) parts.push(`limit of ${limit} reached`);
    notice = parts.join('; ');
  }

  function remove(index: number) {
    files = files.filter((_, i) => i !== index);
    notice = '';
  }

  function size(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  }

  function ondrop(e: DragEvent) {
    e.preventDefault();
    over = false;
    add(e.dataTransfer?.files);
  }

  function onchange(e: Event) {
    const el = e.currentTarget as HTMLInputElement;
    add(el.files);
    el.value = '';
  }
</script>

<div class="dropzone" class:disabled>
  <span class="label" id="{inputId}-label">{label}</span>
  <input
    bind:this={input}
    id={inputId}
    class="vbm-sr-only"
    type="file"
    {accept}
    {multiple}
    {disabled}
    aria-labelledby="{inputId}-label {inputId}-cta"
    aria-describedby={hint ? `${inputId}-hint` : undefined}
    {onchange}
  />
  <label
    for={inputId}
    class="zone"
    class:over
    ondragenter={(e) => {
      e.preventDefault();
      if (!disabled) over = true;
    }}
    ondragover={(e) => e.preventDefault()}
    ondragleave={() => (over = false)}
    {ondrop}
  >
    <svg class="circle" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="44" class="dash" />
      <path d="M50 30 V62 M38 50 L50 62 L62 50 M34 70 H66" />
    </svg>
    <span class="cta" id="{inputId}-cta">
      {over ? 'Release to upload' : 'Drop files here, or tap to choose'}
    </span>
    {#if hint}<span class="hint" id="{inputId}-hint">{hint}</span>{/if}
  </label>
  {#if files.length}
    <ul class="runes" aria-label="Chosen files">
      {#each files as file, i (`${file.name}-${file.size}-${file.lastModified}-${i}`)}
        <li>
          <span class="glyph" aria-hidden="true">♪</span>
          <span class="name" title={file.name}>{file.name}</span>
          <span class="size">{size(file.size)}</span>
          <button
            type="button"
            onclick={() => remove(i)}
            {disabled}
            aria-label="Remove {file.name}"
          >
            ✕
          </button>
        </li>
      {/each}
    </ul>
  {/if}
  <p class="notice" aria-live="polite">{notice}</p>
</div>

<style>
  .dropzone {
    display: grid;
    gap: 0.5rem;
    min-width: 0;
  }
  .label {
    font-family: var(--vbm-font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--vbm-muted);
  }
  .zone {
    display: grid;
    justify-items: center;
    gap: 0.4rem;
    padding: 1.2rem 1rem;
    text-align: center;
    cursor: pointer;
    background:
      radial-gradient(circle at 50% 40%, rgb(255 79 139 / 22%), transparent 60%), var(--vbm-void);
    box-shadow: inset 0 0 0 1px var(--vbm-line-bright);
    border-radius: var(--vbm-radius-sm);
    transition:
      box-shadow 0.2s,
      background 0.2s;
  }
  .zone:hover,
  .zone.over {
    box-shadow: inset 0 0 0 1px var(--vbm-ember);
    background:
      radial-gradient(circle at 50% 40%, rgb(255 138 61 / 22%), transparent 65%), var(--vbm-void);
  }
  input:focus-visible + .zone {
    box-shadow:
      inset 0 0 0 2px var(--vbm-teal),
      inset 0 0 0 4px var(--vbm-void);
  }
  .disabled .zone {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .circle {
    width: 4.2rem;
    height: 4.2rem;
    fill: none;
    stroke: var(--vbm-violet);
    stroke-width: 1.5;
  }
  .dash {
    stroke: var(--vbm-ember);
    stroke-dasharray: 3 5;
    transform-origin: 50px 50px;
    animation: spin 14s linear infinite;
  }
  .over .circle {
    stroke: var(--vbm-ember);
  }
  .cta {
    font-family: var(--vbm-font-display);
    letter-spacing: 0.04em;
    font-size: 0.85rem;
    color: var(--vbm-text);
  }
  .hint {
    font-style: italic;
    color: var(--vbm-muted);
    font-size: 0.92rem;
  }
  .runes {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.35rem;
  }
  li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 0.4rem 0.4rem 0.7rem;
    background: linear-gradient(90deg, rgb(79 139 255 / 10%), transparent 80%);
    border-left: 2px solid var(--vbm-teal);
  }
  .glyph {
    color: var(--vbm-teal);
  }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .size {
    font-family: var(--vbm-font-mono);
    font-size: 0.72rem;
    color: var(--vbm-muted);
  }
  li button {
    width: 2rem;
    height: 2rem;
    border: 0;
    cursor: pointer;
    color: var(--vbm-blood);
    background: var(--vbm-obsidian-3);
    border-radius: 50%;
  }
  li button:hover {
    background: rgb(255 90 110 / 25%);
  }
  li button:focus-visible {
    outline: none;
    background: var(--vbm-teal);
    color: var(--vbm-void);
  }
  .notice {
    margin: 0;
    min-height: 1em;
    font-size: 0.9rem;
    color: var(--vbm-gold);
  }
  .notice:empty {
    display: none;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dash {
      animation: none;
    }
  }
</style>
