<script lang="ts">
  import Sigil from './Sigil.svelte';
  let { message = 'awaiting sound' }: { message?: string } = $props();
</script>

<div class="empty">
  <Sigil size={44} dim />
  <span>{message}</span>
</div>

<style>
  .empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    color: var(--vbm-faint);
    font-family: var(--vbm-font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    pointer-events: none;
  }
</style>
