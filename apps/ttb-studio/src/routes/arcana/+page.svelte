<script lang="ts">
  import DesignCodex from '@vbm/ui/DesignCodex.svelte';
  import design from '../../../../../docs/DESIGN.md?raw';
</script>

<svelte:head><title>The Arcana · The Studio · Vocal Black Magic</title></svelte:head>

<div class="page">
  <DesignCodex markdown={design} />
</div>

<style>
  .page {
    width: min(72rem, 100%);
    margin: 0 auto;
    padding: 0 1rem 4rem;
  }
</style>
