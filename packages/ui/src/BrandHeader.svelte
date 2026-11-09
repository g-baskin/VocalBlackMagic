<script lang="ts">
  let {
    product,
    sisterUrl,
    sisterName
  }: { product: string; sisterUrl: string; sisterName: string } = $props();
</script>

<header class="brandbar">
  <div class="brandname">
    <span class="accent">VBM</span><span>VBM Studio</span><span class="slash">/</span><strong
      >{product}</strong
    >
  </div>
  <a href={sisterUrl}>Open {sisterName} ↗</a>
</header>

<style>
  .brandbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1rem clamp(1rem, 5vw, 4.5rem);
    border-bottom: 1px solid var(--border);
    font-size: 0.9rem;
  }
  .brandname {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .accent {
    background: var(--vbm-gradient);
    color: #1a0b12;
    padding: 0.2rem 0.45rem;
    border-radius: 6px;
    font-weight: 800;
    font-size: 0.75rem;
  }
  .slash {
    color: var(--muted);
  }
  a {
    color: var(--vbm-blue-text);
    text-decoration: none;
    font-weight: 600;
  }
  a:hover {
    text-decoration: underline;
  }
  @media (max-width: 640px) {
    .brandbar {
      align-items: flex-start;
      flex-direction: column;
    }
    .slash {
      display: none;
    }
  }
</style>
