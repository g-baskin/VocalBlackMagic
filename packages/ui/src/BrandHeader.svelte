<script lang="ts">
  let {
    product,
    sisterUrl,
    sisterName
  }: { product: string; sisterUrl: string; sisterName: string } = $props();
</script>

<header class="brandbar">
  <div class="brandname">
    <span class="accent">VBM</span><span>Vocal Black Magic</span><span class="slash">/</span><strong
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
    padding: 1rem clamp(1.2rem, 5vw, 4.5rem);
    border-bottom: 1px solid var(--border);
    font-size: 0.88rem;
  }
  .brandname {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }
  .accent {
    background: var(--text);
    color: var(--bg);
    padding: 0.28rem 0.35rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    font-size: 0.74rem;
  }
  .slash {
    color: var(--muted);
  }
  a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 700;
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
