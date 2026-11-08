<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import '@vbm/ui/theme.css';
  import '../app.css';
  import ArcaneShell from '@vbm/ui/ArcaneShell.svelte';
  let { children } = $props();
  const vocalFixUrl = import.meta.env.VITE_VOCAL_FIX_URL || 'http://localhost:5173';

  type Tab = { href: string; label: string; icon: string };
  // Icon paths are 24×24 strokes (Lucide-style shapes drawn here, no icon dependency).
  const tabs: Tab[] = [
    { href: resolve('/'), label: 'Create', icon: 'M12 5v14M5 12h14' },
    {
      href: resolve('/library'),
      label: 'Library',
      icon: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
    },
    {
      href: '/upload',
      label: 'Upload',
      icon: 'M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3'
    },
    { href: resolve('/lyrics'), label: 'Lyrics', icon: 'M4 6h16M4 12h16M4 18h10' },
    { href: resolve('/seance'), label: 'Compare', icon: 'M8 4v16M16 4v16M4 8h8M12 16h8' }
  ];
  const more: Tab[] = [
    { href: resolve('/arcana'), label: 'How it works', icon: '' },
    { href: resolve('/grimoire'), label: 'Analyzer', icon: '' }
  ];
  const current = (href: string) =>
    href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<svelte:head>
  <title>VBM Studio</title>
  <meta
    name="description"
    content="Create full songs from a prompt, write lyrics, split stems, remix and master them in VBM Studio."
  />
</svelte:head>
<ArcaneShell app="studio" studioUrl="/" {vocalFixUrl}>
  <nav class="topnav" aria-label="Studio">
    {#each [...tabs, ...more] as tab (tab.href)}
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- /upload is built by a sibling route -->
      <a href={tab.href} aria-current={current(tab.href) ? 'page' : undefined}>{tab.label}</a>
    {/each}
  </nav>
  <nav class="morenav" aria-label="More">
    {#each more as tab (tab.href)}
      <a href={tab.href} aria-current={current(tab.href) ? 'page' : undefined}>{tab.label}</a>
    {/each}
  </nav>
  {@render children()}
</ArcaneShell>
<nav class="tabbar" aria-label="Studio sections">
  {#each tabs as tab (tab.href)}
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- /upload is built by a sibling route -->
    <a href={tab.href} aria-current={current(tab.href) ? 'page' : undefined}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d={tab.icon} />
      </svg>
      <span>{tab.label}</span>
    </a>
  {/each}
</nav>

<style>
  .topnav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    justify-content: center;
    margin: 0 auto 1.5rem;
  }
  .topnav a,
  .morenav a {
    display: inline-flex;
    align-items: center;
    min-height: var(--vbm-tap);
    padding: 0.4rem 1rem;
    border-radius: var(--vbm-radius-pill);
    color: var(--vbm-muted);
    font-weight: 600;
    font-size: 0.95rem;
    text-decoration: none;
    transition:
      color 0.15s,
      background 0.15s;
  }
  .topnav a:hover {
    color: var(--vbm-text);
    background: var(--vbm-surface-2);
  }
  .topnav a[aria-current='page'] {
    color: var(--vbm-text);
    background: var(--vbm-surface-3);
  }
  .morenav,
  .tabbar {
    display: none;
  }
  @media (max-width: 760px) {
    .topnav {
      display: none;
    }
    .morenav {
      display: flex;
      justify-content: flex-end;
      gap: 0.25rem;
      margin: -0.5rem 0 0.5rem;
    }
    .morenav a {
      padding: 0.3rem 0.75rem;
      font-size: 0.85rem;
    }
    .morenav a[aria-current='page'] {
      color: var(--vbm-text);
      background: var(--vbm-surface-2);
    }
    :global(#vbm-main) {
      padding-bottom: calc(var(--vbm-tabbar-h) + 1.5rem + var(--vbm-safe-bottom)) !important;
    }
    .tabbar {
      position: fixed;
      inset: auto 0 0 0;
      z-index: 40;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      padding: 0.25rem calc(0.25rem + var(--vbm-safe-right)) calc(0.25rem + var(--vbm-safe-bottom))
        calc(0.25rem + var(--vbm-safe-left));
      background: rgb(26 26 32 / 92%);
      border-top: 1px solid var(--vbm-border);
      backdrop-filter: saturate(140%) blur(14px);
      -webkit-backdrop-filter: saturate(140%) blur(14px);
    }
    .tabbar a {
      display: grid;
      justify-items: center;
      align-content: center;
      gap: 0.15rem;
      min-height: 56px;
      border-radius: var(--vbm-radius-sm);
      color: var(--vbm-faint);
      font-size: 0.7rem;
      font-weight: 600;
      text-decoration: none;
    }
    .tabbar svg {
      width: 24px;
      height: 24px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .tabbar a[aria-current='page'] {
      color: var(--vbm-text);
    }
    .tabbar a[aria-current='page'] svg {
      stroke: var(--vbm-accent);
    }
  }
</style>
