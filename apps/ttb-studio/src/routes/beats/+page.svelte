<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import {
    barTicks,
    beatLimits,
    defaultInstrument,
    newBeatProject,
    newChannel,
    newPattern,
    padNoteName,
    patternTicks,
    ppq,
    stepTicks,
    type BeatNote,
    type BeatProject,
    type BeatProjectSummary,
    type InstrumentKind,
    type PatternSteps,
    type SoundMeta
  } from '@vbm/contracts';
  import { api } from '../../lib/client/api';
  import { BeatEngine } from '../../lib/client/beats/engine';
  import type { BeatVoice } from '../../lib/client/beats/instruments';
  import { exportMidi, importMidi } from '../../lib/client/beats/midi-file';
  import { Recorder } from '../../lib/client/beats/record';
  import type { PlayMode } from '../../lib/client/beats/schedule';
  import { renderBeat, saveFile } from '../../lib/client/beats/render';
  import { Transport } from '../../lib/client/beats/transport';
  import ChannelRack from '../../lib/client/beats/ui/ChannelRack.svelte';
  import ChannelSettings from '../../lib/client/beats/ui/ChannelSettings.svelte';
  import Mixer from '../../lib/client/beats/ui/Mixer.svelte';
  import Playlist from '../../lib/client/beats/ui/Playlist.svelte';
  import PianoRoll from '../../lib/client/beats/ui/PianoRoll.svelte';
  import TransportBar from '../../lib/client/beats/ui/TransportBar.svelte';
  import { History } from '../../lib/client/sampler/history';
  import { isTypingTarget, octaveShift, pianoOffset } from '../../lib/client/sampler/keys';
  import { connectMidi, type MidiConnection } from '../../lib/client/sampler/midi';

  const lastProjectKey = 'vbm.beats.project';
  const blank = () =>
    newBeatProject(crypto.randomUUID(), 'Untitled beat', new Date().toISOString());

  let project = $state<BeatProject>(blank());
  let stored = $state(false);
  let savedJson = $state('');
  let projects = $state<BeatProjectSummary[]>([]);
  let sounds = $state<SoundMeta[]>([]);
  let soundsError = $state<string | null>(null);
  let patternId = $state('p1');
  let channelId = $state('kick');
  let playing = $state(false);
  let playTick = $state<number | null>(null);
  let metronome = $state(false);
  let mode = $state<PlayMode>('pattern');
  let recording = $state(false);
  let recQuantise = $state(1);
  let showPlaylist = $state(true);
  let showMixer = $state(false);
  let levels = $state<Record<string, number>>({});
  let masterLevel = $state(0);
  let meterFrame = 0;
  let octave = $state(5);
  let showRack = $state(true);
  let showRoll = $state(true);
  let busy = $state(false);
  let error = $state<string | null>(null);
  let status = $state<string | null>(null);
  let midi = $state<MidiConnection | null>(null);
  let midiLabel = $state<string | null>(null);
  let historyVersion = $state(0);
  let lit = $state<string | null>(null);
  const history = new History<BeatProject>();
  let engine: BeatEngine | null = null;
  let transport: Transport | null = null;
  // Plain copy the audio thread reads every 25 ms; refreshed by an effect on each edit.
  let latest: BeatProject | null = null;
  const current = () => latest ?? ($state.snapshot(project) as BeatProject);
  let frame = 0;
  let rollEl = $state<HTMLDivElement | null>(null);

  const patternIndex = $derived(
    Math.max(
      0,
      project.patterns.findIndex((p) => p.id === patternId)
    )
  );
  const pattern = $derived(project.patterns[patternIndex]);
  const channelIndex = $derived(project.channels.findIndex((c) => c.id === channelId));
  const channel = $derived(channelIndex >= 0 ? project.channels[channelIndex] : null);
  const dirty = $derived(JSON.stringify(project) !== savedJson);
  const canUndo = $derived.by(() => {
    void historyVersion;
    return history.canUndo;
  });
  const canRedo = $derived.by(() => {
    void historyVersion;
    return history.canRedo;
  });
  const playStep = $derived(playTick === null ? null : Math.floor(playTick / stepTicks));
  const position = $derived.by(() => {
    const t = playTick ?? 0;
    return (
      Math.floor(t / barTicks) +
      1 +
      ':' +
      (Math.floor((t % barTicks) / ppq) + 1) +
      ':' +
      (Math.floor((t % ppq) / stepTicks) + 1)
    );
  });

  function fail(e: unknown, fallback: string) {
    error = e instanceof Error ? e.message : fallback;
  }
  function say(message: string) {
    status = message;
    error = null;
  }

  function remember() {
    history.push($state.snapshot(project) as BeatProject);
    historyVersion += 1;
  }
  function undo() {
    const prev = history.undo($state.snapshot(project) as BeatProject);
    if (prev) {
      project = prev;
      historyVersion += 1;
    }
  }
  function redo() {
    const next = history.redo($state.snapshot(project) as BeatProject);
    if (next) {
      project = next;
      historyVersion += 1;
    }
  }

  $effect(() => {
    latest = $state.snapshot(project) as BeatProject;
    engine?.setProject(latest);
  });
  $effect(() => {
    // Keep the chosen pattern and channel pointing at something that exists.
    if (!project.patterns.some((p) => p.id === patternId)) patternId = project.patterns[0].id;
    if (!project.channels.some((c) => c.id === channelId))
      channelId = project.channels[0]?.id ?? '';
  });
  $effect(() => {
    if (transport) transport.patternId = patternId;
  });
  $effect(() => {
    if (transport) transport.metronome = metronome;
  });
  $effect(() => {
    // Switching Pattern/Song while playing restarts in the new mode.
    const next = mode;
    untrack(() => {
      if (transport?.playing && transport.mode !== next) {
        closeTake();
        transport.play(next, patternId);
      }
    });
  });
  $effect(() => {
    // Meters run only while the mixer is open and the audio has started.
    if (!showMixer) return;
    const tick = () => {
      if (engine) {
        const next: Record<string, number> = {};
        for (const c of latest?.channels ?? []) next[c.id] = engine.mixer.level(c.id);
        levels = next;
        masterLevel = engine.mixer.masterLevel();
      }
      meterFrame = requestAnimationFrame(tick);
    };
    meterFrame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(meterFrame);
      meterFrame = 0;
      levels = {};
      masterLevel = 0;
    };
  });
  $effect(() => {
    // Decode sampler sounds as they are chosen.
    void project.channels.map((c) => (c.instrument.kind === 'sampler' ? c.instrument.sound_id : 0));
    if (engine) void loadSounds();
  });

  function ensureEngine(): BeatEngine {
    if (!engine) {
      engine = new BeatEngine(current());
      transport = new Transport(engine, current);
      transport.metronome = metronome;
      void loadSounds();
    }
    return engine;
  }

  async function loadSounds() {
    if (!engine) return;
    const failed = await engine.loadAll(current());
    if (failed.length)
      error =
        failed.length === 1
          ? 'One sampler sound could not be loaded from the library.'
          : failed.length + ' sampler sounds could not be loaded from the library.';
  }

  async function play() {
    const e = ensureEngine();
    await e.resume();
    await loadSounds();
    if (mode === 'song' && !project.playlist.clips.length) {
      error = 'The playlist is empty. Place a pattern on it, or switch to Pattern mode.';
      return;
    }
    transport!.play(mode, patternId);
    playing = true;
    follow();
  }
  function stop() {
    closeTake();
    transport?.stop();
    playing = false;
    playTick = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  function follow() {
    const tick = () => {
      const pos = transport?.position();
      playTick = pos ? pos.loop : null;
      frame = pos ? requestAnimationFrame(tick) : 0;
    };
    frame = requestAnimationFrame(tick);
  }

  /* ---- Recording live notes into the current pattern ---- */
  let recorder: Recorder | null = null;
  let takeStarted = false;
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const recTargets = new Map<string, { channel: string; pattern: string }>();
  const recTick = () => transport?.position()?.loop ?? 0;
  function recordOn(id: string, key: number, velocity: number) {
    if (!recording || !playing || mode !== 'pattern' || !channelId) return;
    recorder ??= new Recorder(patternTicks(pattern), recQuantise);
    recorder.noteOn(id, key, velocity, recTick());
    recTargets.set(id, { channel: channelId, pattern: pattern.id });
  }
  function recordOff(id: string) {
    const target = recTargets.get(id);
    recTargets.delete(id);
    const note = recorder?.noteOff(id, recTick());
    if (note && target) commit(note, target);
  }
  function commit(note: BeatNote, target: { channel: string; pattern: string }) {
    const p = project.patterns.find((x) => x.id === target.pattern);
    if (!p || !project.channels.some((c) => c.id === target.channel)) return;
    if (note.start >= patternTicks(p)) return;
    // One undo step per take.
    if (!takeStarted) {
      remember();
      takeStarted = true;
    }
    p.notes[target.channel] = [...(p.notes[target.channel] ?? []), note];
  }
  function closeTake() {
    if (recorder) {
      for (const { id, note } of recorder.flush(recTick())) {
        const target = recTargets.get(id);
        if (target) commit(note, target);
      }
    }
    recorder = null;
    recTargets.clear();
    takeStarted = false;
  }
  $effect(() => {
    // A new pattern, grid or arming starts a fresh take.
    void patternId;
    void recQuantise;
    void recording;
    untrack(closeTake);
  });

  /* ---- Live notes from the keyboard and MIDI ---- */
  // Plain collections: held voices are never rendered.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const held = new Map<string, BeatVoice>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const down = new Set<string>();
  async function liveOn(id: string, key: number, velocity: number) {
    const e = ensureEngine();
    liveOff(id);
    down.add(id);
    if (e.ctx.state !== 'running') await e.resume();
    // Let go while the audio was starting: do not start a stuck note.
    if (!down.has(id) || !channelId) return;
    const voice = e.noteOn(channelId, key, velocity);
    if (voice) held.set(id, voice);
    recordOn(id, key, velocity);
    lit = channelId;
  }
  function liveOff(id: string) {
    down.delete(id);
    recordOff(id);
    const voice = held.get(id);
    if (voice && engine) engine.noteOff(voice);
    held.delete(id);
    if (!held.size) lit = null;
  }
  function releaseAll() {
    for (const id of [...held.keys()]) liveOff(id);
    down.clear();
  }
  async function audition(key: number, velocity: number) {
    const e = ensureEngine();
    await e.resume();
    if (channelId) e.note(channelId, key, velocity, e.ctx.currentTime, 0.25);
  }

  async function toggleMidi() {
    if (midi) {
      midi.stop();
      midi = null;
      midiLabel = null;
      releaseAll();
      return;
    }
    const label = () => {
      const names = midi?.inputs() ?? [];
      midiLabel = names.length ? names.join(', ') : 'No MIDI device connected';
    };
    try {
      midi = await connectMidi((event) => {
        if (event.type === 'on') void liveOn('m' + event.note, event.note, event.velocity);
        else if (event.type === 'off') liveOff('m' + event.note);
        else if (channel && event.controller === 7) {
          const gain = (event.value / 127) * 2;
          channel.mixer.volume_db =
            gain <= 0.001 ? -60 : Math.min(6, Math.round(20 * Math.log10(gain) * 2) / 2);
        } else if (channel && event.controller === 10)
          channel.mixer.pan =
            Math.round(Math.max(-1, Math.min(1, (event.value - 64) / 63)) * 100) / 100;
      }, label);
      label();
      say('MIDI on: notes play ' + (channel?.name ?? 'the selected channel') + '.');
    } catch (e) {
      fail(e, 'MIDI is not available.');
    }
  }

  function interactive(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return !!el?.closest?.(
      'button, a, select, input, textarea, [role="slider"], [role="spinbutton"]'
    );
  }

  function keydown(e: KeyboardEvent) {
    if (isTypingTarget(e.target)) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.code === 'KeyZ') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }
    if (mod && e.code === 'KeyY') {
      e.preventDefault();
      redo();
      return;
    }
    if (mod && e.code === 'KeyS') {
      e.preventDefault();
      void save();
      return;
    }
    if (mod || e.altKey) return;
    if (e.code === 'Space') {
      if (interactive(e.target)) return;
      e.preventDefault();
      if (!e.repeat) void (playing ? stop() : play());
      return;
    }
    const shift = octaveShift(e.code);
    if (shift) {
      octave = Math.min(9, Math.max(0, octave + shift));
      return;
    }
    const offset = pianoOffset(e.code);
    if (offset === null) return;
    e.preventDefault();
    if (!e.repeat) void liveOn('k' + e.code, Math.min(127, octave * 12 + offset), 100);
  }
  function keyup(e: KeyboardEvent) {
    liveOff('k' + e.code);
  }

  /* ---- Editing ---- */
  const nextId = (prefix: string, taken: string[]) => {
    let n = taken.length + 1;
    while (taken.includes(prefix + n)) n += 1;
    return prefix + n;
  };

  function addChannel(kind: InstrumentKind) {
    if (project.channels.length >= beatLimits.channels) return;
    remember();
    const ids = project.channels.map((c) => c.id);
    const id = nextId('ch', ids);
    const names: Record<InstrumentKind, string> = {
      drum: 'Drum',
      synth: 'Synth',
      sampler: 'Sampler'
    };
    const count = project.channels.filter((c) => c.instrument.kind === kind).length + 1;
    project.channels.push(
      newChannel(id, names[kind] + ' ' + count, defaultInstrument(kind), project.channels.length)
    );
    channelId = id;
  }

  function removeChannel() {
    if (!channel) return;
    const notes = project.patterns.reduce((n, p) => n + (p.notes[channel.id]?.length ?? 0), 0);
    if (notes && !confirm('Remove ' + channel.name + ' and its ' + notes + ' notes?')) return;
    remember();
    const id = channel.id;
    for (const p of project.patterns) delete p.notes[id];
    project.channels = project.channels.filter((c) => c.id !== id);
  }

  function addPattern(clone: boolean) {
    if (project.patterns.length >= beatLimits.patterns) return;
    remember();
    const id = nextId(
      'p',
      project.patterns.map((p) => p.id)
    );
    const name = 'Pattern ' + id.slice(1);
    const p = clone
      ? { ...($state.snapshot(pattern) as typeof pattern), id, name }
      : newPattern(id, name, pattern.steps);
    project.patterns.push(p);
    patternId = id;
  }

  function deletePattern() {
    if (project.patterns.length < 2) return;
    const clips = project.playlist.clips.filter((c) => c.pattern_id === pattern.id).length;
    if (
      !confirm(
        'Delete ' + pattern.name + (clips ? ' and its ' + clips + ' playlist clips' : '') + '?'
      )
    )
      return;
    remember();
    const id = pattern.id;
    project.patterns = project.patterns.filter((p) => p.id !== id);
    project.playlist.clips = project.playlist.clips.filter((c) => c.pattern_id !== id);
  }

  function setSteps(steps: PatternSteps) {
    const ticks = steps * stepTicks;
    const lost = Object.values(pattern.notes).reduce(
      (n, list) => n + list.filter((x) => x.start >= ticks).length,
      0
    );
    if (lost && !confirm('Shortening the pattern removes ' + lost + ' notes past the end.')) return;
    remember();
    pattern.steps = steps;
    for (const [id, list] of Object.entries(pattern.notes))
      pattern.notes[id] = list
        .filter((x) => x.start < ticks)
        .map((x) => ({ ...x, length: Math.min(x.length, ticks) }));
  }

  function openRoll(id: string) {
    channelId = id;
    showRoll = true;
    requestAnimationFrame(() => rollEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }

  /* ---- Projects ---- */
  async function refreshProjects() {
    projects = (await api<{ projects: BeatProjectSummary[] }>('/api/studio/beats')).projects;
  }

  function adopt(p: BeatProject) {
    project = p;
    stored = true;
    savedJson = JSON.stringify(p);
    localStorage.setItem(lastProjectKey, p.id);
  }

  async function save() {
    busy = true;
    try {
      let id = project.id;
      if (!stored)
        id = (
          await api<{ project: BeatProject }>('/api/studio/beats', {
            method: 'POST',
            body: JSON.stringify({ name: project.name.slice(0, 80) })
          })
        ).project.id;
      const out = await api<{ project: BeatProject }>(
        '/api/studio/beats/' + encodeURIComponent(id),
        {
          method: 'PUT',
          body: JSON.stringify({ project: { ...$state.snapshot(project), id } })
        }
      );
      adopt(out.project);
      await refreshProjects();
      say('Saved ' + out.project.name + '.');
    } catch (e) {
      fail(e, 'Could not save the project.');
    } finally {
      busy = false;
    }
  }

  async function open(id: string) {
    if (dirty && !confirm('Discard unsaved changes to ' + project.name + '?')) return;
    stop();
    busy = true;
    try {
      const out = await api<{ project: BeatProject }>(
        '/api/studio/beats/' + encodeURIComponent(id)
      );
      adopt(out.project);
      history.clear();
      historyVersion += 1;
      patternId = out.project.patterns[0].id;
      channelId = out.project.channels[0]?.id ?? '';
      say('Opened ' + out.project.name + '.');
    } catch (e) {
      fail(e, 'Could not open the project.');
    } finally {
      busy = false;
    }
  }

  function newProject() {
    if (dirty && !confirm('Start a new project? Unsaved changes will be lost.')) return;
    stop();
    project = blank();
    stored = false;
    savedJson = JSON.stringify(project);
    history.clear();
    historyVersion += 1;
    patternId = 'p1';
    channelId = 'kick';
  }

  async function deleteProject(id: string) {
    const p = projects.find((x) => x.id === id);
    if (!confirm('Delete the project "' + (p?.name ?? id) + '"? This cannot be undone.')) return;
    try {
      await api('/api/studio/beats/' + encodeURIComponent(id), { method: 'DELETE' });
      if (id === project.id) {
        stored = false;
        savedJson = '';
        localStorage.removeItem(lastProjectKey);
      }
      await refreshProjects();
      say('Deleted ' + (p?.name ?? 'the project') + '.');
    } catch (e) {
      fail(e, 'Could not delete the project.');
    }
  }

  async function exportWav() {
    busy = true;
    try {
      const e = ensureEngine();
      await loadSounds();
      const blob = await renderBeat(current(), mode, patternId, e.buffers);
      const what = mode === 'song' ? 'Song' : pattern.name;
      saveFile(blob, project.name + ' - ' + what + '.wav');
      say('Exported ' + what + ' as WAV.');
    } catch (e) {
      fail(e, 'Export failed.');
    } finally {
      busy = false;
    }
  }

  async function exportMidiFile() {
    busy = true;
    try {
      const bytes = await exportMidi(current(), mode, patternId);
      const what = mode === 'song' ? 'Song' : pattern.name;
      saveFile(new Blob([bytes], { type: 'audio/midi' }), project.name + ' - ' + what + '.mid');
      say('Exported ' + what + ' as MIDI.');
    } catch (e) {
      fail(e, 'MIDI export failed.');
    } finally {
      busy = false;
    }
  }

  const maxMidiBytes = 4 * 1024 * 1024;
  async function importMidiFile(file: File) {
    if (file.size > maxMidiBytes) {
      error = 'That file is over 4 MB, too large for a MIDI file this studio can open.';
      return;
    }
    if (dirty && !confirm('Open ' + file.name + ' as a new project? Unsaved changes will be lost.'))
      return;
    busy = true;
    try {
      const out = await importMidi(await file.arrayBuffer(), {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.midi?$/i, ''),
        now: new Date().toISOString()
      });
      stop();
      project = out.project;
      stored = false;
      savedJson = '';
      history.clear();
      historyVersion += 1;
      patternId = out.project.patterns[0].id;
      channelId = out.project.channels[0]?.id ?? '';
      mode = out.project.patterns.length > 1 ? 'song' : 'pattern';
      if (mode === 'song') showPlaylist = true;
      say(
        'Imported ' +
          out.notes.toLocaleString('en') +
          ' notes into ' +
          out.project.channels.length +
          ' channels and ' +
          out.project.patterns.length +
          (out.project.patterns.length === 1 ? ' pattern' : ' patterns') +
          (out.dropped
            ? '. ' + out.dropped + ' notes did not fit the project limits and were left out'
            : '') +
          '. Save to keep it.'
      );
    } catch (e) {
      fail(e, 'Could not import that MIDI file.');
    } finally {
      busy = false;
    }
  }

  onMount(async () => {
    savedJson = JSON.stringify(project);
    try {
      await refreshProjects();
      const last = localStorage.getItem(lastProjectKey);
      if (last && projects.some((p) => p.id === last)) await open(last);
    } catch (e) {
      fail(e, 'Could not load saved projects.');
    }
    try {
      sounds = (await api<{ sounds: SoundMeta[] }>('/api/studio/sounds')).sounds;
    } catch {
      soundsError = 'The Pads sound library could not be loaded.';
    }
  });

  onDestroy(() => {
    if (typeof window === 'undefined') return;
    transport?.stop();
    midi?.stop();
    if (frame) cancelAnimationFrame(frame);
    void engine?.close();
  });

  function beforeUnload(e: BeforeUnloadEvent) {
    if (dirty) e.preventDefault();
  }
</script>

<svelte:window
  onkeydown={keydown}
  onkeyup={keyup}
  onblur={releaseAll}
  onbeforeunload={beforeUnload}
/>

<svelte:head><title>Beats · VBM Studio</title></svelte:head>

<div class="beats">
  <h1 class="sr">Beats</h1>
  <TransportBar
    bind:name={project.name}
    bind:swing={project.swing}
    bind:masterDb={project.master_db}
    bind:metronome
    bind:mode
    bind:recording
    bind:recQuantise
    bpm={project.bpm}
    {playing}
    {position}
    {projects}
    projectId={stored ? project.id : null}
    {dirty}
    {busy}
    {canUndo}
    {canRedo}
    midiOn={!!midi}
    {midiLabel}
    onplay={play}
    onstop={stop}
    onbpm={(v) => (project.bpm = v)}
    onbegin={remember}
    onundo={undo}
    onredo={redo}
    onnew={newProject}
    onopen={open}
    onsave={save}
    ondelete={deleteProject}
    onexport={exportWav}
    onmidi={toggleMidi}
    onexportmidi={exportMidiFile}
    onimportmidi={importMidiFile}
  />

  {#if error}<p class="msg error" role="alert">
      {error} <button onclick={() => (error = null)} aria-label="Dismiss">✕</button>
    </p>{/if}
  {#if status && !error}<p class="msg" role="status">{status}</p>{/if}

  <div class="views" role="group" aria-label="Windows">
    <button class:on={showRack} aria-pressed={showRack} onclick={() => (showRack = !showRack)}
      >Channel rack</button
    >
    <button class:on={showRoll} aria-pressed={showRoll} onclick={() => (showRoll = !showRoll)}
      >Piano roll</button
    >
    <button
      class:on={showPlaylist}
      aria-pressed={showPlaylist}
      onclick={() => (showPlaylist = !showPlaylist)}>Playlist</button
    >
    <button class:on={showMixer} aria-pressed={showMixer} onclick={() => (showMixer = !showMixer)}
      >Mixer</button
    >
    <span class="hint">
      {#if channel}Keys A–; and MIDI play <strong style:color={channel.colour}
          >{channel.name}</strong
        >
        from {padNoteName(octave * 12)} (Z/X octave){/if}
      {#if lit}<span class="lit" style:background={channel?.colour} aria-hidden="true"></span>{/if}
    </span>
  </div>

  <div class="top" class:solo={!showRack}>
    {#if showRack}
      <ChannelRack
        bind:channels={project.channels}
        bind:pattern={project.patterns[patternIndex]}
        bind:patternId
        patterns={project.patterns.map((p) => ({ id: p.id, name: p.name }))}
        selectedId={channelId}
        playStep={playing && mode === 'pattern' ? playStep : null}
        canAddChannel={project.channels.length < beatLimits.channels}
        canAddPattern={project.patterns.length < beatLimits.patterns}
        onbegin={remember}
        onselect={(id) => (channelId = id)}
        onopenroll={openRoll}
        onaddchannel={addChannel}
        onnewpattern={() => addPattern(false)}
        onclonepattern={() => addPattern(true)}
        ondeletepattern={deletePattern}
        onsteps={setSteps}
      />
    {/if}
    {#if channel && channelIndex >= 0}
      <ChannelSettings
        bind:channel={project.channels[channelIndex]}
        {sounds}
        {soundsError}
        onbegin={remember}
        onremove={removeChannel}
        onaudition={() => audition(channel.root_key, 100)}
      />
    {/if}
  </div>

  {#if showRoll && channel}
    <div bind:this={rollEl}>
      <PianoRoll
        bind:notes={
          () => pattern.notes[channelId] ?? [],
          (v) => {
            pattern.notes[channelId] = v;
          }
        }
        ticks={patternTicks(pattern)}
        colour={channel.colour}
        rootKey={channel.root_key}
        channelName={channel.name + ' · ' + pattern.name}
        playTick={playing && mode === 'pattern' ? playTick : null}
        resetKey={channelId + '/' + pattern.id + '/' + project.id}
        onbegin={remember}
        onaudition={audition}
      />
    </div>
  {/if}

  {#if showPlaylist}
    <Playlist
      bind:clips={project.playlist.clips}
      bind:patternId
      patterns={project.patterns}
      playTick={playing && mode === 'song' ? playTick : null}
      onbegin={remember}
    />
  {/if}

  {#if showMixer}
    <Mixer
      bind:channels={project.channels}
      bind:masterDb={project.master_db}
      {levels}
      {masterLevel}
      selectedId={channelId}
      onselect={(id) => (channelId = id)}
      onbegin={remember}
    />
  {/if}

  <details class="help">
    <summary>Shortcuts</summary>
    <ul>
      <li>
        <kbd>Space</kbd> play or stop · <kbd>Ctrl/Cmd+Z</kbd> undo · <kbd>Shift</kbd> to redo ·
        <kbd>Ctrl/Cmd+S</kbd> save
      </li>
      <li>
        Keys <kbd>A W S E D F T G Y H U J K O L P ;</kbd> play the selected channel;
        <kbd>Z</kbd>/<kbd>X</kbd> change octave.
      </li>
      <li>
        Steps: click or drag to paint, right-click to clear, <kbd>Alt</kbd>+drag up or down (or
        arrow keys) for velocity.
      </li>
      <li>
        LED: click to mute, right-click to solo. Double-click a channel name for its piano roll.
      </li>
      <li>
        Piano roll: draw, drag to move, drag a note's end to resize, right-click to erase. Arrow
        keys move the selection (Shift for bars or octaves), Delete removes it.
      </li>
      <li>
        MIDI plays the selected channel; CC 7 sets its volume and CC 10 its pan. Chrome, Edge and
        Firefox only.
      </li>
      <li>
        Record: arm ●, play in Pattern mode, and keys or MIDI are written into the current pattern
        (one undo step per take).
      </li>
      <li>
        Playlist: click to place the current pattern, drag to move, right-click to erase. Song mode
        plays it from bar 1.
      </li>
      <li>
        Import .mid opens a MIDI file as a new project: drums on channel 10 become drum channels,
        and long songs are split into 16-bar patterns.
      </li>
    </ul>
  </details>
</div>

<style>
  .beats {
    display: grid;
    gap: 0.7rem;
    width: min(1440px, 100%);
    margin: -1rem auto 0;
    font-family: var(--vbm-font-sans);
    color: var(--vbm-text);
  }
  .beats :global(h2) {
    font-family: var(--vbm-font-sans);
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .msg {
    margin: 0;
    padding: 0.5rem 0.8rem;
    border-radius: 9px;
    font-size: 0.82rem;
    background: rgb(79 139 255 / 10%);
    color: var(--vbm-blue-text);
  }
  .msg.error {
    background: rgb(255 90 110 / 10%);
    color: #ffb0b8;
  }
  .msg button {
    float: right;
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
  }
  .views {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
  }
  .views button {
    min-height: 2rem;
    padding: 0 0.8rem;
    border: 1px solid var(--vbm-border);
    border-radius: 999px;
    background: var(--vbm-surface);
    color: var(--vbm-muted);
    font: inherit;
    font-size: 0.78rem;
    cursor: pointer;
  }
  .views button.on {
    background: var(--vbm-surface-3);
    color: var(--vbm-text);
    border-color: var(--vbm-border-strong);
  }
  .hint {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-left: auto;
    font-size: 0.76rem;
    color: var(--vbm-muted);
  }
  .lit {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
  .top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 330px;
    gap: 0.7rem;
    align-items: start;
  }
  .top.solo {
    grid-template-columns: minmax(0, 1fr);
  }
  .help {
    font-size: 0.8rem;
    color: var(--vbm-muted);
  }
  .help summary {
    cursor: pointer;
  }
  .help ul {
    margin: 0.4rem 0 0;
    padding-left: 1.2rem;
    display: grid;
    gap: 0.25rem;
  }
  kbd {
    padding: 0 0.3rem;
    border: 1px solid var(--vbm-border-strong);
    border-radius: 4px;
    font-family: var(--vbm-font-mono);
    font-size: 0.72rem;
  }
  button:focus-visible {
    outline: 2px solid var(--vbm-blue);
    outline-offset: 2px;
  }
  @media (max-width: 1100px) {
    .top {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 760px) {
    .beats {
      margin-top: 0;
    }
    .hint {
      margin-left: 0;
    }
  }
</style>
