<script lang="ts">
  let {
    label,
    checked = $bindable(false),
    hint,
    disabled = false,
    id
  }: { label: string; checked: boolean; hint?: string; disabled?: boolean; id?: string } = $props();

  const uid = $props.id();
  const toggleId = $derived(id ?? `vbm-tg-${uid}`);
</script>

<div class="toggle" class:disabled>
  <input
    type="checkbox"
    role="switch"
    id={toggleId}
    bind:checked
    {disabled}
    aria-describedby={hint ? `${toggleId}-hint` : undefined}
  />
  <label for={toggleId}>
    <span class="track" aria-hidden="true">
      <span class="gem"></span>
    </span>
    <span class="text">
      <span class="name">{label}</span>
      {#if hint}<span class="hint" id="{toggleId}-hint">{hint}</span>{/if}
    </span>
  </label>
</div>

<style>
  .toggle {
    position: relative;
  }
  input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }
  label {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    min-height: var(--vbm-tap);
    cursor: pointer;
  }
  .disabled label {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .track {
    position: relative;
    flex: none;
    width: 3rem;
    height: 1.75rem;
    background: var(--vbm-surface-3);
    border-radius: var(--vbm-radius-pill);
    box-shadow: inset 0 0 0 1px var(--vbm-border-strong);
    transition: background 0.2s;
  }
  .gem {
    position: absolute;
    top: 0.2rem;
    left: 0.2rem;
    width: 1.35rem;
    height: 1.35rem;
    border-radius: 50%;
    background: #fff;
    box-shadow: var(--vbm-shadow-sm);
    transition: transform 0.2s;
  }
  input:checked + label .track {
    background: var(--vbm-gradient);
    box-shadow: none;
  }
  input:checked + label .gem {
    transform: translateX(1.25rem);
  }
  input:focus-visible + label .track {
    outline: 2px solid var(--vbm-blue);
    outline-offset: 2px;
  }
  .text {
    display: grid;
  }
  .name {
    font-weight: 600;
    font-size: 0.95rem;
  }
  .hint {
    color: var(--vbm-muted);
    font-size: 0.875rem;
  }
</style>
