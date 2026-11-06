<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import Sigil from '@vbm/ui/Sigil.svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';

  const status = $derived(page.status);
  const heading = $derived(status === 404 ? 'Nothing was summoned here' : 'The circle is broken');
</script>

<svelte:head><title>{status} · The Studio · Vocal Black Magic</title></svelte:head>

<section class="broken" aria-labelledby="err-title">
  <div class="sigil"><Sigil size={140} dim /></div>
  <p class="code vbm-mono">Error {status}</p>
  <h1 id="err-title">{heading}</h1>
  <p class="msg">{page.error?.message ?? 'Something went wrong.'}</p>
  <div class="row">
    <RuneButton href={resolve('/')}>Return to The Studio</RuneButton>
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
    transform: rotate(12deg);
    clip-path: polygon(
      0 0,
      100% 0,
      100% 46%,
      58% 52%,
      100% 58%,
      100% 100%,
      0 100%,
      0 54%,
      44% 49%,
      0 44%
    );
  }
  .code {
    margin: 0;
    font-size: 0.75rem;
    letter-spacing: 0.35em;
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
