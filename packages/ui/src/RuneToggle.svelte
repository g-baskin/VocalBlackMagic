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
      <span class="gem">◆</span>
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
    cursor: pointer;
  }
  .disabled label {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .track {
    position: relative;
    flex: none;
    width: 3.4rem;
    height: 1.6rem;
    background: var(--vbm-void);
    box-shadow: inset 0 0 0 1px var(--vbm-line-bright);
    clip-path: polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%);
    transition: background 0.25s;
  }
  .gem {
    position: absolute;
    top: 50%;
    left: 0.55rem;
    transform: translateY(-50%);
    color: var(--vbm-faint);
    font-size: 0.95rem;
    line-height: 1;
    transition:
      left 0.25s,
      color 0.25s,
      text-shadow 0.25s;
  }
  input:checked + label .track {
    background: linear-gradient(90deg, rgb(91 43 196 / 60%), rgb(63 240 210 / 30%));
  }
  input:checked + label .gem {
    left: calc(100% - 1.45rem);
    color: var(--vbm-teal);
    text-shadow: var(--vbm-glow-teal);
  }
  input:focus-visible + label .track {
    box-shadow:
      inset 0 0 0 2px var(--vbm-teal),
      inset 0 0 0 3px var(--vbm-void);
  }
  input:focus-visible + label .name {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .text {
    display: grid;
  }
  .name {
    font-family: var(--vbm-font-display);
    letter-spacing: 0.1em;
    font-size: 0.92rem;
  }
  .hint {
    color: var(--vbm-muted);
    font-style: italic;
    font-size: 0.92rem;
  }
</style>
