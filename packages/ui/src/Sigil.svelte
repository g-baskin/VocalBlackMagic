<script lang="ts">
  /** VBM Studio logo mark: a rounded gradient tile with equaliser bars. Purely presentational. */
  let {
    size = 48,
    spin = false,
    dim = false,
    class: className = ''
  }: { size?: number; spin?: boolean; dim?: boolean; class?: string } = $props();
  const uid = $props.id();
  const gid = `vbm-logo-${uid}`;
</script>

<svg
  class="logo {className}"
  class:live={spin}
  class:dim
  width={size}
  height={size}
  viewBox="0 0 48 48"
  aria-hidden="true"
  focusable="false"
>
  <defs>
    <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff4f8b" />
      <stop offset="1" stop-color="#ff8a3d" />
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="13" fill="url(#{gid})" />
  <g fill="#ffffff">
    <rect class="b b1" x="10" y="19" width="4" height="10" rx="2" />
    <rect class="b b2" x="17" y="13" width="4" height="22" rx="2" />
    <rect class="b b3" x="24" y="9" width="4" height="30" rx="2" />
    <rect class="b b4" x="31" y="15" width="4" height="18" rx="2" />
    <rect class="b b5" x="38" y="20" width="2.5" height="8" rx="1.25" />
  </g>
</svg>

<style>
  .logo {
    flex: none;
    display: block;
  }
  .dim {
    opacity: 0.35;
    filter: grayscale(1);
  }
  .b {
    transform-box: fill-box;
    transform-origin: center;
  }
  .live .b {
    animation: eq 1.4s ease-in-out infinite;
  }
  .live .b2 {
    animation-delay: -0.3s;
  }
  .live .b3 {
    animation-delay: -0.6s;
  }
  .live .b4 {
    animation-delay: -0.9s;
  }
  .live .b5 {
    animation-delay: -1.1s;
  }
  @keyframes eq {
    50% {
      transform: scaleY(0.6);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .live .b {
      animation: none;
    }
  }
</style>
