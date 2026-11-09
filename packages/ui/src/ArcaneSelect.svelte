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
    <span class="glyph" aria-hidden="true">▾</span>
  </div>
  {#if hint}<p class="hint" id="{selectId}-hint">{hint}</p>{/if}
</div>

<style>
  .field {
    display: grid;
    gap: 0.35rem;
  }
  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--vbm-muted);
  }
  .frame {
    position: relative;
    background: var(--vbm-surface-2);
    border: 1px solid var(--vbm-border-strong);
    border-radius: var(--vbm-radius-sm);
  }
  .frame:focus-within {
    border-color: var(--vbm-accent);
    box-shadow: 0 0 0 3px rgb(255 79 139 / 22%);
  }
  select {
    width: 100%;
    appearance: none;
    border: 0;
    padding: 0.7rem 2.4rem 0.7rem 0.9rem;
    background: transparent;
    color: var(--vbm-text);
    min-height: var(--vbm-tap);
    font-size: 1rem;
    cursor: pointer;
    border-radius: inherit;
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
    color: var(--vbm-muted);
    pointer-events: none;
    font-size: 0.8rem;
  }
  .hint {
    margin: 0;
    color: var(--vbm-muted);
    font-size: 0.95rem;
  }
</style>
