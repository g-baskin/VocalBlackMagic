<script lang="ts">
  import { macroNames } from '@vbm/contracts';
  import Knob from './Knob.svelte';

  let { values = $bindable(), onbegin }: { values: number[]; onbegin: () => void } = $props();
  const pct = (v: number) => Math.round(v * 100) + '%';
</script>

<div class="macros">
  {#each macroNames as name, i (name)}
    <Knob
      bind:value={values[i]}
      min={0}
      max={1}
      step={0.01}
      label={name}
      format={pct}
      size={60}
      {onbegin}
    />
  {/each}
</div>

<style>
  .macros {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.6rem 0.5rem;
    align-content: center;
    height: 100%;
  }
</style>
