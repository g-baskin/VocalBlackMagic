<script lang="ts">
  import { resolve } from '$app/paths';
  import '@vbm/ui/theme.css';
  import ArcaneShell from '@vbm/ui/ArcaneShell.svelte';
  let { children } = $props();
  const studioUrl = import.meta.env.VITE_TTB_STUDIO_URL || 'http://localhost:5174';
</script>

<svelte:head>
  <title>Vocal Fix | Vocal Black Magic</title>
  <meta
    name="description"
    content="Repair your vocal takes and forge a Gold Vocal from your own voice."
  />
</svelte:head>
<ArcaneShell app="vocal-fix" {studioUrl} vocalFixUrl="/">
  <nav class="vf-nav" aria-label="Vocal Fix">
    <a href={resolve('/')}>New rite</a>
    <a href={resolve('/voices')}>Codex of voices</a>
    <a href={resolve('/arcana')}>Arcana</a>
  </nav>
  {@render children()}
</ArcaneShell>

<style>
  .vf-nav {
    display: flex;
    gap: 1.2rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
    font-family: var(--vbm-font-mono);
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .vf-nav a {
    color: var(--vbm-muted);
    text-decoration: none;
  }
  .vf-nav a:hover,
  .vf-nav a:focus-visible {
    color: var(--vbm-gold);
  }
</style>
