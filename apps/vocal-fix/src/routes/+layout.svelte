<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import '@vbm/ui/theme.css';
  import '../app.css';
  import ArcaneShell from '@vbm/ui/ArcaneShell.svelte';
  let { children } = $props();
  const studioUrl = import.meta.env.VITE_TTB_STUDIO_URL || 'http://localhost:5174';

  const tabs = [
    { href: resolve('/'), label: 'New session', icon: 'M12 5v14M5 12h14' },
    {
      href: resolve('/voices'),
      label: 'My voices',
      icon: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM19 11a7 7 0 0 1-14 0M12 18v3'
    },
    {
      href: resolve('/arcana'),
      label: 'How it works',
      icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16v-4M12 8h.01'
    }
  ];
  const current = (href: string) =>
    href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<svelte:head>
  <title>Vocal Fix · VBM Studio</title>
  <meta
    name="description"
    content="Repair your vocal takes and build a Gold Vocal from your own voice with Vocal Fix, part of VBM Studio."
  />
</svelte:head>
<ArcaneShell app="vocal-fix" {studioUrl} vocalFixUrl="/">
  <nav class="vf-nav" aria-label="Vocal Fix">
    {#each tabs as tab (tab.href)}
      <a href={tab.href} aria-current={current(tab.href) ? 'page' : undefined}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={tab.icon} /></svg>
        <span>{tab.label}</span>
      </a>
    {/each}
  </nav>
  {@render children()}
</ArcaneShell>

<style>
  .vf-nav {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
    justify-content: center;
    margin: 0 auto 1.5rem;
  }
  .vf-nav a {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: var(--vbm-tap);
    padding: 0.4rem 1rem;
    border-radius: var(--vbm-radius-pill);
    color: var(--vbm-muted);
    font-weight: 600;
    font-size: 0.95rem;
    text-decoration: none;
  }
  .vf-nav svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .vf-nav a:hover {
    color: var(--vbm-text);
    background: var(--vbm-surface-2);
  }
  .vf-nav a[aria-current='page'] {
    color: var(--vbm-text);
    background: var(--vbm-surface-3);
  }
  @media (max-width: 760px) {
    :global(#vbm-main) {
      padding-bottom: calc(var(--vbm-tabbar-h) + 1.5rem + var(--vbm-safe-bottom)) !important;
    }
    .vf-nav {
      position: fixed;
      inset: auto 0 0 0;
      z-index: 40;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
      padding: 0.25rem calc(0.25rem + var(--vbm-safe-right)) calc(0.25rem + var(--vbm-safe-bottom))
        calc(0.25rem + var(--vbm-safe-left));
      background: rgb(26 26 32 / 92%);
      border-top: 1px solid var(--vbm-border);
      backdrop-filter: saturate(140%) blur(14px);
      -webkit-backdrop-filter: saturate(140%) blur(14px);
    }
    .vf-nav a {
      display: grid;
      justify-items: center;
      align-content: center;
      gap: 0.15rem;
      min-height: 56px;
      padding: 0.25rem;
      border-radius: var(--vbm-radius-sm);
      font-size: 0.7rem;
      color: var(--vbm-faint);
    }
    .vf-nav a:hover,
    .vf-nav a[aria-current='page'] {
      background: transparent;
    }
    .vf-nav svg {
      width: 24px;
      height: 24px;
    }
    .vf-nav a[aria-current='page'] svg {
      stroke: var(--vbm-accent);
    }
  }
</style>
