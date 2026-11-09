<script lang="ts">
  let { message = 'No audio yet' }: { message?: string } = $props();
</script>

<div class="empty">
  <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
  <span>{message}</span>
</div>

<style>
  .empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    color: var(--vbm-faint);
    font-size: 0.9rem;
    font-weight: 500;
    pointer-events: none;
  }
</style>
