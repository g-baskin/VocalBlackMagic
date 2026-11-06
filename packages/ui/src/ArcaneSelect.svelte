<script lang="ts">
  let {
    label,
    value = $bindable(''),
    options,
    id
  }: {
    label: string;
    value: string;
    options: { value: string; label: string; hint?: string; disabled?: boolean }[];
    id?: string;
  } = $props();

  const uid = $props.id();
  const selectId = $derived(id ?? `vbm-sel-${uid}`);
  const hint = $derived(options.find((o) => o.value === value)?.hint);
</script>

<div class="field">
  <label for={selectId}>{label}</label>
  <div class="frame">
    <select id={selectId} bind:value aria-describedby={hint ? `${selectId}-hint` : undefined}>
      {#each options as option (option.value)}
        <option value={option.value} disabled={option.disabled}>{option.label}</option>
      {/each}
    </select>
    <span class="glyph" aria-hidden="true">▽</span>
  </div>
  {#if hint}<p class="hint" id="{selectId}-hint">{hint}</p>{/if}
</div>

<style>
  .field {
    display: grid;
    gap: 0.35rem;
  }
  label {
    font-family: var(--vbm-font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--vbm-muted);
  }
  .frame {
    position: relative;
    padding: 1px;
    background: linear-gradient(90deg, var(--vbm-line-bright), var(--vbm-line));
    clip-path: polygon(
      10px 0,
      100% 0,
      100% calc(100% - 10px),
      calc(100% - 10px) 100%,
      0 100%,
      0 10px
    );
  }
  .frame:focus-within {
    background: linear-gradient(90deg, var(--vbm-teal), var(--vbm-violet));
    padding: 2px;
  }
  select {
    width: 100%;
    appearance: none;
    border: 0;
    padding: 0.7rem 2.4rem 0.7rem 0.9rem;
    background: var(--vbm-void);
    color: var(--vbm-text);
    font-family: var(--vbm-font-display);
    font-size: 0.9rem;
    letter-spacing: 0.08em;
    cursor: pointer;
    clip-path: inherit;
  }
  select:focus {
    outline: none;
  }
  option {
    background: var(--vbm-obsidian);
    color: var(--vbm-text);
  }
  .glyph {
    position: absolute;
    right: 0.9rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--vbm-violet);
    pointer-events: none;
    font-size: 0.8rem;
  }
  .hint {
    margin: 0;
    font-style: italic;
    color: var(--vbm-muted);
    font-size: 0.95rem;
  }
</style>
