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
    font-family: var(--vbm-font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--vbm-muted);
  }
  .frame {
    padding: 1px;
    background: linear-gradient(180deg, var(--vbm-line-bright), var(--vbm-line));
    clip-path: polygon(
      14px 0,
      100% 0,
      100% calc(100% - 14px),
      calc(100% - 14px) 100%,
      0 100%,
      0 14px
    );
  }
  .frame:focus-within {
    background: linear-gradient(180deg, var(--vbm-teal), var(--vbm-violet));
    padding: 2px;
  }
  textarea {
    display: block;
    width: 100%;
    border: 0;
    padding: 0.8rem 1rem;
    resize: vertical;
    background:
      repeating-linear-gradient(
        transparent 0 1.7rem,
        rgb(167 116 255 / 6%) 1.7rem calc(1.7rem + 1px)
      ),
      var(--vbm-void);
    color: var(--vbm-text);
    font: inherit;
    font-size: 1.05rem;
    line-height: 1.7rem;
    clip-path: inherit;
  }
  textarea::placeholder {
    color: var(--vbm-faint);
    font-style: italic;
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
