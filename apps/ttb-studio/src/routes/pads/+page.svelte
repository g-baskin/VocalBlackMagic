<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import {
    launchGrids,
    launchModes,
    newKit,
    padNoteName,
    type Kit,
    type KitSummary,
    type LaunchGrid,
    type SoundMeta
  } from '@vbm/contracts';
  import { api } from '../../lib/client/api';
  import { launchRate, PadEngine } from '../../lib/client/sampler/engine';
  import { History } from '../../lib/client/sampler/history';
  import { inspire } from '../../lib/client/sampler/inspire';
  import { isTypingTarget, maxOctave, octaveShift, padForKey } from '../../lib/client/sampler/keys';
  import { connectMidi, macroForCc, type MidiConnection } from '../../lib/client/sampler/midi';
  import { download, renderKitReel, renderPad } from '../../lib/client/sampler/render';
  import HitWave from '../../lib/client/sampler/ui/HitWave.svelte';
  import MacroPanel from '../../lib/client/sampler/ui/MacroPanel.svelte';
  import PadGrid from '../../lib/client/sampler/ui/PadGrid.svelte';
  import SoundBrowser from '../../lib/client/sampler/ui/SoundBrowser.svelte';
  import SourcesDialog from '../../lib/client/sampler/ui/SourcesDialog.svelte';

  const lastKitKey = 'vbm.pads.kit';
  const blankKit = () => newKit(crypto.randomUUID(), 'Untitled kit', new Date().toISOString());

  let kit = $state<Kit>(blankKit());
  let stored = $state(false);
  let savedJson = $state('');
  let sounds = $state<SoundMeta[]>([]);
  let kits = $state<KitSummary[]>([]);
  let selectedPad = $state(0);
  let selectedSoundId = $state<string | null>(null);
  let view = $state<'kits' | 'sounds'>('sounds');
  let octave = $state(0);
  const active = new SvelteSet<number>();
  let loadedVersion = $state(0);
  let lastTrigger = $state<{ startAt: number; rate: number } | null>(null);
  let sourcesOpen = $state(false);
  let guide: HTMLDialogElement;
  let busy = $state(false);
  let error = $state<string | null>(null);
  let status = $state<string | null>(null);
  let midi = $state<MidiConnection | null>(null);
  let midiNote = $state<string | null>(null);
  let historyVersion = $state(0);
  const history = new History<Kit>();
  let engine: PadEngine | null = null;

  const byId = $derived(new Map(sounds.map((s) => [s.id, s])));
  const pad = $derived(kit.pads[selectedPad]);
  const padName = $derived(padNoteName(pad.note));
  const firstLayer = $derived(pad.layers.findIndex(Boolean));
  const firstSound = $derived(
    firstLayer >= 0 ? byId.get(pad.layers[firstLayer] as string) : undefined
  );
  const used = $derived([
    ...new Set(kit.pads.flatMap((p) => p.layers).filter(Boolean))
  ] as string[]);
  const loadedCount = $derived.by(() => {
    void loadedVersion;
    return engine ? used.filter((id) => engine!.sounds.has(id)).length : 0;
  });
  const shownBuffer = $derived.by(() => {
    void loadedVersion;
    const loaded = firstSound ? engine?.sounds.get(firstSound.id) : undefined;
    if (!loaded) return null;
    return pad.launch.reverse ? loaded.reversed : loaded.forward;
  });
  const shownHit = $derived(
    firstSound
      ? pad.launch.reverse
        ? Math.max(0, firstSound.duration_seconds - firstSound.hit_seconds)
        : firstSound.hit_seconds
      : 0
  );
  const shownRate = $derived(launchRate(kit, selectedPad, shownHit).total);
  const dirty = $derived(JSON.stringify(kit) !== savedJson);
  const canUndo = $derived.by(() => {
    void historyVersion;
    return history.canUndo;
  });
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
  const gridLabel = (g: LaunchGrid) => (g === 'natural' ? 'Natural' : g);

  function fail(e: unknown, fallback: string) {
    error = e instanceof Error ? e.message : fallback;
  }
  function say(message: string) {
    status = message;
    error = null;
  }

  function remember() {
    history.push($state.snapshot(kit) as Kit);
    historyVersion += 1;
  }
  function undo() {
    const prev = history.undo($state.snapshot(kit) as Kit);
    if (prev) {
      kit = prev;
      historyVersion += 1;
    }
  }

  function ensureEngine(): PadEngine {
    if (!engine) {
      engine = new PadEngine($state.snapshot(kit) as Kit);
      void loadUsed();
    }
    return engine;
  }

  async function loadSound(id: string) {
    const meta = byId.get(id);
    if (!meta) return;
    const e = ensureEngine();
    try {
      if (await e.load(meta)) loadedVersion += 1;
    } catch {
      error = 'Could not decode ' + meta.name + '.';
    }
  }
  async function loadUsed() {
    await Promise.all(used.map(loadSound));
  }

  $effect(() => {
    const snapshot = $state.snapshot(kit) as Kit;
    engine?.setKit(snapshot);
  });
  $effect(() => {
    // Decode newly assigned sounds in the background.
    void used;
    void sounds;
    if (engine) void loadUsed();
  });

  async function press(index: number, velocity: number) {
    selectedPad = index;
    active.add(index);
    const e = ensureEngine();
    await e.resume();
    const ids = kit.pads[index].layers.filter(Boolean) as string[];
    const missing = ids.filter((id) => !e.sounds.has(id));
    if (missing.length) await Promise.all(missing.map(loadSound));
    const started = e.trigger(index, velocity);
    if (started && index === selectedPad) {
      const sound = firstSound;
      const hit = sound ? shownHit : 0;
      lastTrigger = { startAt: started.startAt, rate: launchRate(kit, index, hit).total };
    }
  }
  function release(index: number) {
    engine?.release(index);
    setTimeout(() => active.delete(index), 90);
  }

  function assign(layer: number, soundId = selectedSoundId, index = selectedPad) {
    if (!soundId) return;
    remember();
    kit.pads[index].layers[layer] = soundId;
    void loadSound(soundId);
  }
  function clearLayer(layer: number) {
    remember();
    kit.pads[selectedPad].layers[layer] = null;
  }

  async function preview(sound: SoundMeta) {
    selectedSoundId = sound.id;
    const e = ensureEngine();
    await e.resume();
    await loadSound(sound.id);
    e.preview(sound.id);
  }

  async function favourite(sound: SoundMeta) {
    try {
      const out = await api<{ sound: SoundMeta }>(
        '/api/studio/sounds/' + encodeURIComponent(sound.id),
        {
          method: 'PATCH',
          body: JSON.stringify({ favourite: !sound.favourite })
        }
      );
      sounds = sounds.map((s) => (s.id === sound.id ? out.sound : s));
    } catch (e) {
      fail(e, 'Could not update the sound.');
    }
  }

  async function deleteSound(sound: SoundMeta) {
    if (!confirm('Delete "' + sound.name + '" from the library? Pads using it will be cleared.'))
      return;
    try {
      await api('/api/studio/sounds/' + encodeURIComponent(sound.id), { method: 'DELETE' });
      sounds = sounds.filter((s) => s.id !== sound.id);
      if (kit.pads.some((p) => p.layers.includes(sound.id))) {
        remember();
        for (const p of kit.pads) p.layers = p.layers.map((id) => (id === sound.id ? null : id));
      }
      selectedSoundId = null;
      say('Deleted ' + sound.name + '.');
    } catch (e) {
      fail(e, 'Could not delete the sound.');
    }
  }

  async function refreshKits() {
    kits = (await api<{ kits: KitSummary[] }>('/api/studio/kits')).kits;
  }

  async function saveKit() {
    busy = true;
    try {
      let id = kit.id;
      if (!stored)
        id = (
          await api<{ kit: Kit }>('/api/studio/kits', {
            method: 'POST',
            body: JSON.stringify({ name: kit.name.slice(0, 80) })
          })
        ).kit.id;
      const out = await api<{ kit: Kit }>('/api/studio/kits/' + encodeURIComponent(id), {
        method: 'PUT',
        body: JSON.stringify({ kit: { ...$state.snapshot(kit), id } })
      });
      kit = out.kit;
      stored = true;
      savedJson = JSON.stringify(out.kit);
      localStorage.setItem(lastKitKey, out.kit.id);
      await refreshKits();
      say('Saved ' + out.kit.name + '.');
    } catch (e) {
      fail(e, 'Could not save the kit.');
    } finally {
      busy = false;
    }
  }

  async function openKit(id: string) {
    if (dirty && stored && !confirm('Discard unsaved changes to ' + kit.name + '?')) return;
    busy = true;
    try {
      const out = await api<{ kit: Kit }>('/api/studio/kits/' + encodeURIComponent(id));
      kit = out.kit;
      stored = true;
      savedJson = JSON.stringify(out.kit);
      history.clear();
      historyVersion += 1;
      selectedPad = 0;
      localStorage.setItem(lastKitKey, id);
    } catch (e) {
      fail(e, 'Could not open the kit.');
    } finally {
      busy = false;
    }
  }

  function newKitClick() {
    if (dirty && !confirm('Start a new kit? Unsaved changes will be lost.')) return;
    kit = blankKit();
    stored = false;
    savedJson = JSON.stringify(kit);
    history.clear();
    historyVersion += 1;
  }

  async function deleteKit(id: string) {
    const k = kits.find((x) => x.id === id);
    if (!confirm('Delete the kit "' + (k?.name ?? id) + '"? Its sounds stay in the library.'))
      return;
    try {
      await api('/api/studio/kits/' + encodeURIComponent(id), { method: 'DELETE' });
      if (id === kit.id) stored = false;
      await refreshKits();
    } catch (e) {
      fail(e, 'Could not delete the kit.');
    }
  }

  function inspireClick() {
    remember();
    const seed = Math.floor(Math.random() * 2 ** 31);
    kit = inspire($state.snapshot(kit) as Kit, sounds, seed);
    say(
      sounds.length
        ? 'Inspired: a fresh layout and macro settings. Undo to go back.'
        : 'Inspired the macros. Add sounds to fill the pads.'
    );
  }

  async function exportPad() {
    busy = true;
    try {
      await Promise.all((pad.layers.filter(Boolean) as string[]).map(loadSound));
      const blob = await renderPad($state.snapshot(kit) as Kit, selectedPad, ensureEngine().sounds);
      download(blob, kit.name + ' - ' + padName);
    } catch (e) {
      fail(e, 'Export failed.');
    } finally {
      busy = false;
    }
  }
  async function exportKit() {
    busy = true;
    try {
      await loadUsed();
      download(
        await renderKitReel($state.snapshot(kit) as Kit, ensureEngine().sounds),
        kit.name + ' - reel'
      );
    } catch (e) {
      fail(e, 'Export failed.');
    } finally {
      busy = false;
    }
  }

  async function toggleMidi() {
    if (midi) {
      midi.stop();
      midi = null;
      midiNote = null;
      return;
    }
    try {
      midi = await connectMidi(
        (event) => {
          if (event.type === 'cc') {
            const m = macroForCc(event.controller);
            if (m !== null) kit.macros[m] = Math.round((event.value / 127) * 100) / 100;
            return;
          }
          const index = event.note - 36;
          if (index < 0 || index > 35) return;
          if (event.type === 'on') void press(index, event.velocity);
          else release(index);
        },
        () => {
          const names = midi?.inputs() ?? [];
          midiNote = names.length ? names.join(', ') : 'No MIDI device connected';
        }
      );
      const names = midi.inputs();
      midiNote = names.length ? names.join(', ') : 'No MIDI device connected';
    } catch (e) {
      fail(e, 'MIDI is not available.');
    }
  }

  function keydown(e: KeyboardEvent) {
    if (sourcesOpen || guide?.open || isTypingTarget(e.target)) return;
    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ' && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const shift = octaveShift(e.code);
    if (shift) {
      octave = Math.min(maxOctave, Math.max(0, octave + shift));
      return;
    }
    const index = padForKey(e.code, octave);
    if (index === null) return;
    e.preventDefault();
    if (!e.repeat) void press(index, 100);
  }
  function keyup(e: KeyboardEvent) {
    const index = padForKey(e.code, octave);
    if (index !== null) release(index);
  }

  onMount(async () => {
    savedJson = JSON.stringify(kit);
    try {
      const [s] = await Promise.all([
        api<{ sounds: SoundMeta[] }>('/api/studio/sounds'),
        refreshKits()
      ]);
      sounds = s.sounds;
      const last = localStorage.getItem(lastKitKey);
      if (last && kits.some((k) => k.id === last)) await openKit(last);
    } catch (e) {
      fail(e, 'Could not load the sound library.');
    }
  });

  onDestroy(() => {
    if (typeof window === 'undefined') return;
    midi?.stop();
    void engine?.close();
  });

  function beforeUnload(e: BeforeUnloadEvent) {
    if (dirty && stored) e.preventDefault();
  }
</script>

<svelte:window onkeydown={keydown} onkeyup={keyup} onbeforeunload={beforeUnload} />

<div class="pads">
  <header class="top">
    <div class="brand">
      <span class="logo" aria-hidden="true"></span>
      <h1>{kit.name}</h1>
    </div>
    <div class="tabs" role="tablist" aria-label="Pads view">
      <button role="tab" aria-selected="true">Play</button>
      <button
        role="tab"
        aria-selected="false"
        aria-disabled="true"
        disabled
        title="Arrives in the next update">Shape</button
      >
      <button
        role="tab"
        aria-selected="false"
        aria-disabled="true"
        disabled
        title="Arrives in the next update">Deep</button
      >
    </div>
    <div class="tools">
      <div class="count" title="{loadedCount} of {used.length} kit sounds decoded">
        <span>{sounds.length} {sounds.length === 1 ? 'sound' : 'sounds'}</span>
        <span class="bar" aria-hidden="true"
          ><i style:width={(used.length ? (loadedCount / used.length) * 100 : 0) + '%'}></i></span
        >
      </div>
      <button class="tool text" onclick={() => (sourcesOpen = true)}>+ Add sounds</button>
      <button
        class="tool text"
        class:on={!!midi}
        aria-pressed={!!midi}
        onclick={toggleMidi}
        title={midiNote ?? 'Connect a MIDI controller'}>MIDI</button
      >
      <button class="tool" aria-label="Kits" title="Kits" onclick={() => (view = 'kits')}>
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"
          ><path
            d="M2.5 5.5h5l1.5 2h8.5v8h-15z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
          /></svg
        >
      </button>
      <button
        class="tool"
        aria-label="Undo"
        title="Undo (Ctrl/Cmd+Z)"
        disabled={!canUndo}
        onclick={undo}
      >
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"
          ><path
            d="M7 5L3.5 8.5 7 12M4 8.5h7.5a4.5 4.5 0 010 9H9"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          /></svg
        >
      </button>
      <button class="tool text" onclick={() => guide.showModal()}>Guide</button>
      <button class="inspire" onclick={inspireClick}
        ><span aria-hidden="true">✦</span> Inspire</button
      >
    </div>
  </header>

  {#if error}<p class="msg error" role="alert">
      {error} <button onclick={() => (error = null)} aria-label="Dismiss">✕</button>
    </p>{/if}
  {#if status && !error}<p class="msg" role="status">{status}</p>{/if}

  <div class="body">
    <aside class="panel side">
      <SoundBrowser
        {sounds}
        {kits}
        bind:view
        bind:selectedId={selectedSoundId}
        {padName}
        bind:kitName={kit.name}
        kitId={stored ? kit.id : null}
        {dirty}
        {busy}
        onassign={(l) => assign(l)}
        onpreview={preview}
        onfavourite={favourite}
        ondelete={deleteSound}
        onopenkit={openKit}
        onsavekit={saveKit}
        onnewkit={newKitClick}
        ondeletekit={deleteKit}
        onexportkit={exportKit}
      />
    </aside>

    <section class="panel wave" aria-label="Pad {padName}">
      <div class="wave-head">
        <h2>Pad {padName} <span>· {firstSound ? cap(firstSound.category) : 'Empty'}</span></h2>
        <div class="grids" role="group" aria-label="Lands on">
          {#each launchGrids as g (g)}
            <button
              class:on={pad.launch.lands_on === g}
              aria-pressed={pad.launch.lands_on === g}
              onclick={() => {
                remember();
                pad.launch.lands_on = g;
              }}>{gridLabel(g)}</button
            >
          {/each}
        </div>
      </div>
      <div class="layers-line">
        {#each pad.layers as id, l (l)}
          {#if id}
            <span class="layer-tag"
              >L{l + 1}&nbsp; {byId.get(id)?.name ?? 'Missing sound'}
              <button aria-label="Clear layer {l + 1}" onclick={() => clearLayer(l)}>✕</button
              ></span
            >
          {/if}
        {/each}
        {#if firstSound?.source.kind === 'slice' && firstSound.source.commercial === false}
          <span class="nc">Non-commercial source</span>
        {/if}
      </div>
      <div class="canvas">
        <HitWave
          buffer={shownBuffer}
          hit={shownHit}
          bpm={kit.bpm}
          rate={shownRate}
          playing={lastTrigger}
          clock={() => engine?.ctx.currentTime ?? 0}
        />
      </div>
      <div class="launch">
        <label class="inline"
          ><span class="caps">Lands on</span>
          <select
            value={pad.launch.lands_on}
            onchange={(e) => {
              remember();
              pad.launch.lands_on = (e.currentTarget as HTMLSelectElement).value as LaunchGrid;
            }}
          >
            {#each launchGrids as g (g)}<option value={g}>{gridLabel(g)}</option>{/each}
          </select></label
        >
        <label class="inline"
          ><span class="caps">Mode</span>
          <select
            value={pad.launch.mode}
            onchange={(e) => {
              remember();
              pad.launch.mode = (e.currentTarget as HTMLSelectElement)
                .value as (typeof launchModes)[number];
            }}
          >
            {#each launchModes as m (m)}<option value={m}>{cap(m)}</option>{/each}
          </select></label
        >
        <label class="toggle"
          ><input
            type="checkbox"
            role="switch"
            checked={pad.launch.sync}
            onchange={(e) => {
              remember();
              pad.launch.sync = (e.currentTarget as HTMLInputElement).checked;
            }}
          /><span></span>Sync</label
        >
        <label class="toggle"
          ><input
            type="checkbox"
            role="switch"
            checked={pad.launch.reverse}
            onchange={(e) => {
              remember();
              pad.launch.reverse = (e.currentTarget as HTMLInputElement).checked;
            }}
          /><span></span>Reverse</label
        >
        <button class="small" disabled={busy || firstLayer < 0} onclick={exportPad}
          >Export pad WAV</button
        >
        <label class="bpm"
          ><input
            type="number"
            min="40"
            max="240"
            step="1"
            value={kit.bpm}
            onchange={(e) => {
              const v = Math.round(Number((e.currentTarget as HTMLInputElement).value));
              if (v >= 40 && v <= 240) {
                remember();
                kit.bpm = v;
              } else (e.currentTarget as HTMLInputElement).value = String(kit.bpm);
            }}
          /> BPM</label
        >
      </div>
    </section>

    <section class="panel pads-panel" aria-labelledby="pads-title">
      <div class="panel-head">
        <h2 id="pads-title" class="caps">Pads</h2>
        <span class="caps">C1 to B3 · keys octave {octave + 1}</span>
      </div>
      <PadGrid
        {kit}
        sounds={byId}
        selected={selectedPad}
        {active}
        {octave}
        onpress={press}
        onrelease={release}
        ondropsound={(index, id) => {
          selectedPad = index;
          assign(0, id, index);
        }}
      />
    </section>

    <section class="panel macros" aria-labelledby="macros-title">
      <h2 id="macros-title" class="caps">Macros</h2>
      <MacroPanel bind:values={kit.macros} onbegin={remember} />
    </section>
  </div>
</div>

<SourcesDialog
  bind:open={sourcesOpen}
  onadded={(added) => {
    sounds = [...sounds, ...added].sort((a, b) => a.name.localeCompare(b.name));
    selectedSoundId = added[0]?.id ?? selectedSoundId;
    view = 'sounds';
  }}
/>

<dialog bind:this={guide} class="guide" aria-labelledby="guide-title">
  <h2 id="guide-title">Pads guide</h2>
  <ul>
    <li>
      <strong>Play:</strong> click a pad, or use the keys A W S E D F T G Y H U J K O L P ; as a piano.
      Z and X move the octave.
    </li>
    <li>
      <strong>MIDI:</strong> notes 36–71 (C1–B3) play the pads; CC 21–28 or 70–77 turn macros 1–8. Works
      in Chrome, Edge and Firefox, not Safari.
    </li>
    <li>
      <strong>Lands on:</strong> the sound starts early so its HIT lands on the next beat or bar at the
      kit BPM. Sync stretches the build-up to fit one step. Natural plays at once.
    </li>
    <li>
      <strong>Sounds:</strong> pick one in the browser and send it to L1, L2 or L3, or drag it onto a
      pad. Double-click a sound to preview it.
    </li>
    <li>
      <strong>Knobs:</strong> drag up or down (Shift for fine), use the arrow keys, or double-click to
      reset.
    </li>
    <li>
      <strong>Inspire</strong> lays your library across the pads by category and sets new macros. Undo
      puts things back.
    </li>
    <li>
      <strong>Rights:</strong> slices keep their song's licence; uploads need your rights statement; Gold
      Vocal slices need own-voice consent.
    </li>
  </ul>
  <form method="dialog"><button>Close</button></form>
</dialog>

<style>
  .pads {
    --pads-font: var(--vbm-font-sans);
    --pads-text: var(--vbm-text);
    --pads-muted: var(--vbm-muted);
    --pads-line: var(--vbm-border);
    --pads-field: rgb(255 255 255 / 3%);
    --pads-focus: var(--vbm-blue);
    --pads-panel: linear-gradient(
      135deg,
      rgb(34 30 50 / 92%),
      var(--vbm-surface) 55%,
      rgb(42 26 30 / 92%)
    );
    font-family: var(--pads-font);
    color: var(--pads-text);
    width: min(1440px, 100%);
    margin: -1rem auto 0;
    padding: 1rem;
    border-radius: 18px;
    background:
      radial-gradient(ellipse at 15% 0%, rgb(120 80 220 / 14%), transparent 55%),
      radial-gradient(ellipse at 100% 100%, rgb(255 110 70 / 9%), transparent 55%), var(--vbm-bg);
    border: 1px solid var(--pads-line);
  }
  .pads :global(h1),
  .pads :global(h2:not(.caps)) {
    font-family: var(--pads-font);
    letter-spacing: 0;
    text-transform: none;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    min-width: 10rem;
  }
  .logo {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background:
      linear-gradient(#fff, #fff) center / 2px 60% no-repeat,
      linear-gradient(135deg, #8f6bff, #ff4f6a 60%, #ff7a2e);
    box-shadow: 0 0 16px rgb(255 79 106 / 45%);
  }
  h1 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    max-width: 14rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tabs {
    display: flex;
    gap: 0.2rem;
    padding: 0.25rem;
    border: 1px solid var(--pads-line);
    border-radius: 11px;
    background: rgb(255 255 255 / 2%);
  }
  .tabs button {
    border: 0;
    background: none;
    color: var(--pads-muted);
    padding: 0.45rem 1.6rem;
    border-radius: 8px;
    font: inherit;
    font-size: 0.85rem;
  }
  .tabs button[aria-selected='true'] {
    background: rgb(255 255 255 / 9%);
    color: var(--pads-text);
  }
  .tabs button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .tools {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .count {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.72rem;
    color: var(--pads-muted);
    margin-right: 0.4rem;
  }
  .bar {
    width: 110px;
    height: 4px;
    border-radius: 2px;
    background: rgb(255 255 255 / 8%);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #8f6bff, #ff4f6a);
  }
  .tool {
    display: grid;
    place-items: center;
    min-width: 2.3rem;
    height: 2.3rem;
    padding: 0 0.7rem;
    border: 1px solid var(--pads-line);
    border-radius: 10px;
    background: rgb(255 255 255 / 3%);
    color: var(--pads-text);
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }
  .tool.on {
    border-color: #5fd4e6;
    color: #8fe6f2;
  }
  .tool:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .inspire {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 2.3rem;
    padding: 0 1.6rem;
    border: 0;
    border-radius: 10px;
    background: var(--vbm-gradient);
    color: var(--vbm-on-accent);
    box-shadow: var(--vbm-shadow-accent);
    font: inherit;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
  }
  button:focus-visible,
  select:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--pads-focus);
    outline-offset: 2px;
  }
  .msg {
    margin: 0 0 0.8rem;
    padding: 0.5rem 0.8rem;
    border-radius: 9px;
    font-size: 0.82rem;
    background: rgb(95 212 230 / 8%);
    color: #bfeff6;
  }
  .msg.error {
    background: rgb(255 90 90 / 10%);
    color: #ffb0b0;
  }
  .msg button {
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
    float: right;
  }
  .body {
    display: grid;
    grid-template-columns: 290px minmax(0, 1fr) 320px;
    grid-template-rows: auto auto;
    grid-template-areas:
      'side wave wave'
      'side pads macros';
    gap: 1rem;
  }
  .panel {
    border: 1px solid var(--pads-line);
    border-radius: 16px;
    background: var(--pads-panel);
    padding: 1rem;
    min-width: 0;
  }
  .side {
    grid-area: side;
    display: flex;
    max-height: 860px;
  }
  .wave {
    grid-area: wave;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.5rem;
  }
  .pads-panel {
    grid-area: pads;
  }
  .macros {
    grid-area: macros;
    display: grid;
    grid-template-rows: auto 1fr;
  }
  .wave-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .wave-head h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }
  .wave-head h2 span {
    color: var(--pads-muted);
    font-weight: 400;
  }
  .grids {
    max-width: 100%;
    display: flex;
    gap: 0.15rem;
    padding: 0.2rem;
    border: 1px solid var(--pads-line);
    border-radius: 10px;
    overflow-x: auto;
  }
  .grids button {
    border: 0;
    background: none;
    color: var(--pads-text);
    padding: 0.35rem 0.85rem;
    border-radius: 7px;
    font-family: var(--vbm-font-mono);
    font-size: 0.68rem;
    white-space: nowrap;
    cursor: pointer;
  }
  .grids button.on {
    background: #eceaf5;
    color: #15131f;
  }
  .layers-line {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    min-height: 1.2rem;
    font-family: var(--vbm-font-mono);
    font-size: 0.68rem;
    color: var(--pads-text);
  }
  .layer-tag button {
    border: 0;
    background: none;
    color: var(--pads-muted);
    cursor: pointer;
    font-size: 0.65rem;
  }
  .nc {
    color: #ffd27a;
  }
  .canvas {
    height: 210px;
  }
  .launch {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    flex-wrap: wrap;
  }
  .inline {
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  .launch select,
  .bpm input {
    border: 1px solid var(--pads-line);
    background: rgb(255 255 255 / 4%);
    color: var(--pads-text);
    border-radius: 8px;
    padding: 0.4rem 0.6rem;
    font: inherit;
    font-size: 0.82rem;
  }
  .launch option {
    background: #1a1830;
  }
  .toggle {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
    cursor: pointer;
  }
  .toggle input {
    position: absolute;
    opacity: 0;
    width: 30px;
    height: 16px;
    margin: 0;
    cursor: pointer;
  }
  .toggle span {
    width: 30px;
    height: 16px;
    border-radius: 999px;
    background: rgb(255 255 255 / 14%);
    position: relative;
    transition: background 0.15s;
  }
  .toggle span::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #cfcde0;
    transition: transform 0.15s;
  }
  .toggle input:checked + span {
    background: #ff4a3c;
  }
  .toggle input:checked + span::after {
    transform: translateX(14px);
    background: #fff;
  }
  .toggle input:focus-visible + span {
    outline: 2px solid var(--pads-focus);
    outline-offset: 2px;
  }
  .small {
    border: 1px solid var(--pads-line);
    background: rgb(255 255 255 / 3%);
    color: var(--pads-text);
    border-radius: 8px;
    padding: 0.4rem 0.7rem;
    font: inherit;
    font-size: 0.75rem;
    cursor: pointer;
  }
  .small:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .bpm {
    margin-left: auto;
    font-family: var(--vbm-font-mono);
    font-size: 0.72rem;
    color: var(--pads-muted);
  }
  .bpm input {
    width: 4.2rem;
    font-family: var(--vbm-font-mono);
    font-size: 0.72rem;
    text-align: right;
  }
  .panel-head {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.7rem;
  }
  .caps {
    margin: 0;
    font-family: var(--vbm-font-mono);
    font-size: 0.64rem;
    font-weight: 400;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--pads-muted);
  }
  .guide {
    width: min(620px, calc(100vw - 2rem));
    border: 1px solid rgb(255 255 255 / 9%);
    border-radius: 16px;
    background: var(--vbm-surface);
    color: var(--vbm-text);
    font-family: var(--vbm-font-sans);
    padding: 1.2rem 1.5rem;
  }
  .guide::backdrop {
    background: rgb(4 4 10 / 70%);
  }
  .guide h2 {
    margin: 0 0 0.6rem;
    font-family: inherit;
    letter-spacing: 0;
    font-size: 1.1rem;
  }
  .guide li {
    margin-bottom: 0.5rem;
    font-size: 0.86rem;
    line-height: 1.45;
  }
  .guide button {
    border: 1px solid rgb(255 255 255 / 12%);
    background: rgb(255 255 255 / 5%);
    color: inherit;
    border-radius: 9px;
    padding: 0.45rem 1rem;
    font: inherit;
    cursor: pointer;
  }
  @media (max-width: 1180px) {
    .body {
      grid-template-columns: 260px minmax(0, 1fr);
      grid-template-areas:
        'side wave'
        'side pads'
        'side macros';
    }
  }
  @media (max-width: 820px) {
    .body {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: 'wave' 'pads' 'macros' 'side';
    }
    .side {
      max-height: 640px;
    }
  }
</style>
