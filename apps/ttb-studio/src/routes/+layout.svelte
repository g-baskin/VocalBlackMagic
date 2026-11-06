<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>
<svelte:head>
  <title>TTB Studio | Vocal Black Magic</title>
  <meta name="description" content="Create music with character. Text to beat, full songs, and optional Premium Studio finishing." />
</svelte:head>
{@render children()}
