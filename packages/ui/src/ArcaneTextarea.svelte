<script lang="ts">
  let {
    label,
    value = $bindable(''),
    rows = 5,
    placeholder,
    maxlength,
    id
  }: {
    label: string;
    value: string;
    rows?: number;
    placeholder?: string;
    maxlength?: number;
    id?: string;
  } = $props();

  const uid = $props.id();
  const inputId = $derived(id ?? `vbm-ta-${uid}`);
</script>

<div class="field">
  <label for={inputId}>{label}</label>
  <div class="frame">
    <textarea id={inputId} {rows} {placeholder} {maxlength} bind:value></textarea>
  </div>
  {#if maxlength}<span class="count" aria-hidden="true">{value.length}/{maxlength}</span>{/if}
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
    background: var(--vbm-surface-2);
    border: 1px solid var(--vbm-border-strong);
    border-radius: var(--vbm-radius-sm);
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }
  .frame:focus-within {
    border-color: var(--vbm-accent);
    box-shadow: 0 0 0 3px rgb(255 79 139 / 22%);
  }
  textarea {
    display: block;
    width: 100%;
    border: 0;
    padding: 0.8rem 1rem;
    resize: vertical;
    background: transparent;
    color: var(--vbm-text);
    font: inherit;
    font-size: 1rem;
    line-height: 1.5;
    border-radius: inherit;
  }
  textarea::placeholder {
    color: var(--vbm-faint);
  }
  textarea:focus {
    outline: none;
  }
  .count {
    justify-self: end;
    font-family: var(--vbm-font-mono);
    font-size: 0.68rem;
    color: var(--vbm-faint);
  }
</style>
