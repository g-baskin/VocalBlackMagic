<script lang="ts">
  let {
    label,
    value = $bindable(''),
    placeholder,
    type = 'text',
    maxlength,
    id
  }: {
    label: string;
    value: string;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'search' | 'url' | 'tel' | 'number';
    maxlength?: number;
    id?: string;
  } = $props();

  const uid = $props.id();
  const inputId = $derived(id ?? `vbm-in-${uid}`);
</script>

<div class="field">
  <label for={inputId}>{label}</label>
  <div class="frame">
    <input id={inputId} {type} {placeholder} {maxlength} bind:value />
  </div>
  {#if maxlength}<span class="count" aria-hidden="true">{value.length}/{maxlength}</span>{/if}
</div>

<style>
  .field {
    display: grid;
    gap: 0.35rem;
    position: relative;
  }
  label {
    font-family: var(--vbm-font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--vbm-muted);
  }
  .frame {
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
  input {
    width: 100%;
    border: 0;
    padding: 0.7rem 0.9rem;
    background: var(--vbm-void);
    color: var(--vbm-text);
    font: inherit;
    font-size: 1.05rem;
    clip-path: inherit;
  }
  input::placeholder {
    color: var(--vbm-faint);
    font-style: italic;
  }
  input:focus {
    outline: none;
  }
  .count {
    justify-self: end;
    font-family: var(--vbm-font-mono);
    font-size: 0.68rem;
    color: var(--vbm-faint);
  }
</style>
