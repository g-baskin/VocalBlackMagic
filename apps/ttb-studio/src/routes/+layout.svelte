<script lang="ts">
  import { resolve } from '$app/paths';
  import '@vbm/ui/theme.css';
  import '../app.css';
  import ArcaneShell from '@vbm/ui/ArcaneShell.svelte';
  let { children } = $props();
  const vocalFixUrl = import.meta.env.VITE_VOCAL_FIX_URL || 'http://localhost:5173';
</script>

<svelte:head>
  <title>TTB Studio | Vocal Black Magic</title>
  <meta
    name="description"
    content="Summon full songs, split stems, reimagine and master them in the Vocal Black Magic studio."
  />
</svelte:head>
<ArcaneShell app="studio" studioUrl="/" {vocalFixUrl}>
  <nav class="studio-nav" aria-label="Studio">
    <a href={resolve('/')}>ᛟ Summon</a>
    <a href={resolve('/library')}>ᚱ Library</a>
    <a href={resolve('/lyrics')}>ᛚ Lyrics</a>
    <a href={resolve('/arcana')}>ᛉ Arcana</a>
  </nav>
  {@render children()}
</ArcaneShell>

<style>
  .studio-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem 1.5rem;
    justify-content: center;
    margin: 0 0 1.5rem;
    font-family: var(--vbm-font-display);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-size: 0.8rem;
  }
  .studio-nav a {
    color: var(--vbm-teal);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    padding-bottom: 0.2rem;
  }
  .studio-nav a:hover {
    border-color: var(--vbm-violet);
  }
</style>
