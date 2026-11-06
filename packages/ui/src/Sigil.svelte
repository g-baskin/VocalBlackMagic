<script lang="ts">
  /** Decorative summoning sigil (SVG). Purely presentational. */
  let {
    size = 48,
    spin = false,
    dim = false,
    class: className = ''
  }: { size?: number; spin?: boolean; dim?: boolean; class?: string } = $props();
</script>

<svg
  class="sigil {className}"
  class:spin
  class:dim
  width={size}
  height={size}
  viewBox="0 0 100 100"
  aria-hidden="true"
  focusable="false"
>
  <circle cx="50" cy="50" r="46" />
  <circle cx="50" cy="50" r="38" class="thin" />
  <polygon points="50,6 88,72 12,72" />
  <polygon points="50,94 12,28 88,28" />
  <circle cx="50" cy="50" r="12" />
  <path d="M50 4 V16 M50 84 V96 M4 50 H16 M84 50 H96" class="thin" />
</svg>

<style>
  .sigil {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    color: var(--vbm-violet);
    filter: drop-shadow(0 0 6px rgb(167 116 255 / 55%));
    flex: none;
  }
  .thin {
    stroke-width: 0.8;
    stroke-dasharray: 3 4;
  }
  .dim {
    opacity: 0.35;
    filter: none;
  }
  .spin {
    animation: rot 24s linear infinite;
  }
  @keyframes rot {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spin {
      animation: none;
    }
  }
</style>
