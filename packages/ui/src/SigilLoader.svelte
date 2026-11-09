<script lang="ts">
  let { label = 'Loading…', size = 64 }: { label?: string; size?: number } = $props();
</script>

<div class="loader" role="status" aria-live="polite">
  <span
    class="spinner"
    style:width="{Math.round(size * 0.5)}px"
    style:height="{Math.round(size * 0.5)}px"
    aria-hidden="true"
  ></span>
  {#if label}<span class="label">{label}</span>{/if}
</div>

<style>
  .loader {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
  }
  .spinner {
    flex: none;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      transparent 0 15%,
      var(--vbm-accent-2),
      var(--vbm-accent)
    );
    -webkit-mask: radial-gradient(
      farthest-side,
      transparent calc(100% - 4px),
      #000 calc(100% - 3px)
    );
    mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px));
    animation: spin 0.9s linear infinite;
  }
  .label {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--vbm-muted);
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation: none;
    }
  }
</style>
