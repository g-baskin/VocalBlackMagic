<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import Sigil from '@vbm/ui/Sigil.svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';

  const status = $derived(page.status);
  const heading = $derived(status === 404 ? 'Page not found' : 'Something went wrong');
</script>

<svelte:head><title>{status} · VBM Studio</title></svelte:head>

<section class="broken" aria-labelledby="err-title">
  <div class="sigil"><Sigil size={72} dim /></div>
  <p class="code vbm-mono">Error {status}</p>
  <h1 id="err-title">{heading}</h1>
  <p class="msg">{page.error?.message ?? 'Something went wrong.'}</p>
  <div class="row">
    <RuneButton href={resolve('/')}>Back to Create</RuneButton>
    <RuneButton variant="ghost" onclick={() => history.back()}>Go back</RuneButton>
  </div>
</section>

<style>
  .broken {
    display: grid;
    justify-items: center;
    text-align: center;
    gap: 0.75rem;
    padding: 4rem 1rem;
    max-width: 40rem;
    margin: 0 auto;
  }
  .sigil {
    border-radius: var(--vbm-radius-sm);
  }
  .code {
    margin: 0;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--vbm-blood);
  }
  h1 {
    margin: 0;
    font-size: clamp(1.8rem, 5vw, 3rem);
  }
  .msg {
    margin: 0 0 1rem;
    color: var(--vbm-muted);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
  }
</style>
