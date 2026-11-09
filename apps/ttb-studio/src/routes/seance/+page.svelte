<script lang="ts">
  import { cannotCompare, positionIn, takeDuration } from '../../lib/client/seance-time';
  import { onDestroy, onMount } from 'svelte';
  import ArcanePanel from '@vbm/ui/ArcanePanel.svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import ArcaneInput from '@vbm/ui/ArcaneInput.svelte';
  import ArcaneTextarea from '@vbm/ui/ArcaneTextarea.svelte';
  import RuneToggle from '@vbm/ui/RuneToggle.svelte';
  import RitualProgress from '@vbm/ui/RitualProgress.svelte';
  import Waveform from '@vbm/ui/Waveform.svelte';
  import { decodeAudioFromUrl, formatTime } from '@vbm/ui/audio';
  import {
    validateSeanceRequest,
    type Seance,
    type SeanceLabel,
    type SeanceLeaderRow,
    type StudioModel,
    type StudioModelInfo
  } from '@vbm/contracts';
  import { api, audioUrl, sleep } from '../../lib/client/api';

  let models = $state<StudioModelInfo[]>([]);
  let allowed = $state(false);
  let capsError = $state<string | null>(null);
  let picked = $state<string[]>([]);
  let prompt = $state('A warm acoustic ballad about a lighthouse keeper watching the sunrise');
  let lyrics = $state('');
  let title = $state('');
  let instrumental = $state(false);
  let busy = $state(false);
  let error = $state<string | null>(null);
  let seance = $state<Seance | null>(null);
  let board = $state<SeanceLeaderRow[]>([]);
  let alive = true;

  // One transport over every finished take.
  let buffers = $state<Partial<Record<SeanceLabel, AudioBuffer>>>({});
  let active = $state<SeanceLabel | null>(null);
  let playing = $state(false);
  let position = $state(0);
  let ctx: AudioContext | null = null;
  let source: AudioBufferSourceNode | null = null;
  let startedAt = 0;
  let raf = 0;
  let order = $state<SeanceLabel[]>([]);
  let dragging = $state<SeanceLabel | null>(null);

  const ready = $derived(models.filter((m) => m.active_runner));
  const fits = (m: StudioModelInfo) => (instrumental ? m.instrumental : m.vocals);
  const finished = $derived(seance?.entries.filter((e) => e.song_id) ?? []);
  const pending = $derived(
    seance?.entries.some((e) => e.status === 'running' || e.status === 'queued') ?? false
  );
  // The transport shows the active take's own length (not the longest take's).
  const duration = $derived(takeDuration(buffers, active));
  const nameOf = (id: string | undefined) => models.find((m) => m.id === id)?.name ?? id ?? '';

  onMount(async () => {
    try {
      const caps = await api<{ allowed: boolean; models?: StudioModelInfo[] }>(
        '/api/studio/capabilities'
      );
      allowed = caps.allowed;
      models = caps.models ?? [];
    } catch (e) {
      capsError = e instanceof Error ? e.message : 'Could not read the studio.';
    }
    const id = new URL(location.href).searchParams.get('id');
    if (id) await follow(id);
    await loadBoard();
  });

  onDestroy(() => {
    alive = false;
    // onDestroy also runs during server rendering, where there is no audio or animation frame.
    if (typeof window === 'undefined') return;
    stop();
    void ctx?.close();
  });

  async function loadBoard() {
    try {
      board = (await api<{ leaderboard: SeanceLeaderRow[] }>('/api/studio/seances/leaderboard'))
        .leaderboard;
    } catch {
      board = [];
    }
  }

  function toggle(id: string) {
    picked = picked.includes(id)
      ? picked.filter((m) => m !== id)
      : picked.length < 4
        ? [...picked, id]
        : picked;
  }

  async function summon() {
    const body = {
      prompt,
      lyrics: instrumental ? null : lyrics.trim() || null,
      title,
      instrumental,
      models: picked as StudioModel[]
    };
    const invalid = validateSeanceRequest(body);
    if (invalid) {
      error = invalid;
      return;
    }
    busy = true;
    error = null;
    try {
      const res = await api<{ seance: Seance }>('/api/studio/seances', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      history.replaceState(history.state, '', '?id=' + encodeURIComponent(res.seance.id));
      await follow(res.seance.id, res.seance);
    } catch (e) {
      error = e instanceof Error ? e.message : 'The comparison could not start.';
    } finally {
      busy = false;
    }
  }

  async function follow(id: string, first?: Seance) {
    seance = first ?? null;
    let misses = 0;
    while (alive) {
      try {
        seance = (await api<{ seance: Seance }>('/api/studio/seances/' + encodeURIComponent(id)))
          .seance;
        misses = 0;
        error = null;
      } catch (e) {
        // A dev-server restart or a dropped connection should not end the séance: retry a few times.
        misses += 1;
        if (misses >= 4) {
          error = e instanceof Error ? e.message : 'Lost contact with the comparison.';
          return;
        }
        await sleep(2000 * misses);
        continue;
      }
      await loadTakes();
      if (!pending) return;
      await sleep(4000);
    }
  }

  async function loadTakes() {
    if (!seance) return;
    for (const e of seance.entries)
      if (e.song_id && !buffers[e.label]) {
        try {
          buffers = { ...buffers, [e.label]: await decodeAudioFromUrl(audioUrl(e.song_id)) };
        } catch {
          // an undecodable take stays silent; it can still be ranked
        }
      }
    if (!order.length || order.length !== finished.length) order = finished.map((e) => e.label);
    if (!active && finished.length) active = finished[0].label;
  }

  function now(): number {
    return ctx && playing ? position + (ctx.currentTime - startedAt) : position;
  }

  function stop() {
    if (source) {
      source.onended = null;
      source.stop();
      source.disconnect();
      source = null;
    }
    cancelAnimationFrame(raf);
  }

  function start(at: number) {
    const buffer = active ? buffers[active] : undefined;
    if (!buffer) return;
    ctx ??= new AudioContext();
    stop();
    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    position = positionIn(at, buffer.duration);
    startedAt = ctx.currentTime;
    source.start(0, position);
    playing = true;
    source.onended = () => {
      playing = false;
      position = 0;
      cancelAnimationFrame(raf);
    };
    const tick = () => {
      if (!playing || !ctx) return;
      const t = now();
      startedAt = ctx.currentTime;
      position = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function playPause() {
    if (playing) {
      position = now();
      playing = false;
      stop();
    } else start(position);
  }

  /** Switch takes at the same moment in the song. */
  function choose(label: SeanceLabel) {
    const at = now();
    active = label;
    if (playing) start(at);
    else position = at;
  }

  function seek(seconds: number) {
    if (playing) start(seconds);
    else position = seconds;
  }

  function move(label: SeanceLabel, delta: number) {
    const i = order.indexOf(label);
    const j = i + delta;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    order = next;
  }

  function drop(target: SeanceLabel) {
    if (!dragging || dragging === target) return;
    const next = order.filter((l) => l !== dragging);
    next.splice(next.indexOf(target), 0, dragging);
    order = next;
    dragging = null;
  }

  async function reveal() {
    if (!seance) return;
    busy = true;
    error = null;
    try {
      seance = (
        await api<{ seance: Seance }>(
          '/api/studio/seances/' + encodeURIComponent(seance.id) + '/rank',
          { method: 'POST', body: JSON.stringify({ order }) }
        )
      ).seance;
      await loadBoard();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not reveal the models.';
    } finally {
      busy = false;
    }
  }

  function again() {
    stop();
    playing = false;
    position = 0;
    buffers = {};
    active = null;
    order = [];
    seance = null;
    history.replaceState(history.state, '', location.pathname);
  }
</script>

<svelte:head><title>Compare · VBM Studio</title></svelte:head>

<div class="seance">
  <header class="intro">
    <h1>Compare models</h1>
    <p>
      Create one take from each of 2 to 4 models on the same prompt and lyrics. You hear them as A
      to D in a shuffled order, rank them blind, and only then learn who made what.
    </p>
  </header>

  {#if error}<p class="error" role="alert">{error}</p>{/if}

  {#if !seance}
    <ArcanePanel title="Pick models" eyebrow="Blind comparison">
      {#if capsError}<p class="error">{capsError}</p>{/if}
      {#if !allowed && !capsError}
        <p class="note">Generation is disabled outside development.</p>
      {/if}
      <fieldset class="models">
        <legend>Models <span class="count">{picked.length} of 2 to 4</span></legend>
        {#each models as m (m.id)}
          {@const usable = !!m.active_runner && fits(m)}
          <label class="model" class:off={!usable}>
            <input
              type="checkbox"
              checked={picked.includes(m.id)}
              disabled={!usable || (!picked.includes(m.id) && picked.length >= 4)}
              onchange={() => toggle(m.id)}
            />
            <span class="name">{m.name}</span>
            <span class="why">
              {usable
                ? 'ready'
                : !m.active_runner
                  ? (m.runners[0]?.status ?? 'no runner')
                  : instrumental
                    ? 'no instrumentals'
                    : 'instrumental only'}
            </span>
          </label>
        {:else}
          <p class="note">No models reported yet.</p>
        {/each}
      </fieldset>
      <p class="note">{ready.length} of {models.length} models have a ready runner.</p>
      <ArcaneTextarea label="Prompt" bind:value={prompt} rows={3} maxlength={2000} />
      <ArcaneInput label="Title (optional)" bind:value={title} maxlength={120} />
      <RuneToggle
        label="Instrumental"
        bind:checked={instrumental}
        hint="No vocals; models that only sing are unavailable."
      />
      {#if !instrumental}
        <ArcaneTextarea
          label="Lyrics (optional: left empty, they are written once and shared)"
          bind:value={lyrics}
          rows={6}
          maxlength={6000}
        />
      {/if}
      <div class="actions">
        <RuneButton onclick={summon} {busy} disabled={busy || picked.length < 2 || !prompt.trim()}>
          Create {picked.length || ''} takes
        </RuneButton>
      </div>
    </ArcanePanel>
  {:else}
    <ArcanePanel title={seance.revealed ? 'Revealed' : 'Listen blind'} eyebrow="Compare">
      <p class="prompt">“{seance.prompt}”</p>
      <div class="takes">
        {#each seance.entries as e (e.label)}
          <section class="take" class:current={active === e.label}>
            <header>
              <button
                class="label"
                disabled={!buffers[e.label]}
                aria-pressed={active === e.label}
                onclick={() => choose(e.label)}>{e.label}</button
              >
              {#if seance.revealed && e.model}
                <span class="unveiled">
                  {nameOf(e.model)}<small>{e.runner ?? ''}</small>
                  {#if e.rank}<em>#{e.rank}</em>{/if}
                </span>
              {/if}
            </header>
            {#if e.status === 'failed'}
              <p class="error">{e.detail ?? 'This take failed.'}</p>
            {:else if !e.song_id}
              <RitualProgress stages={e.stages} detail={e.detail} />
            {:else}
              <Waveform
                buffer={buffers[e.label] ?? null}
                currentTime={active === e.label ? position : 0}
                duration={takeDuration(buffers, e.label)}
                onseek={(s) => {
                  choose(e.label);
                  seek(s);
                }}
                height={64}
                color={active === e.label ? 'teal' : 'violet'}
                label={'Take ' + e.label}
              />
            {/if}
          </section>
        {/each}
      </div>

      {#if finished.length}
        <div class="transport">
          <RuneButton variant="ghost" onclick={playPause} disabled={!active}>
            {playing ? 'Pause' : 'Play'}
            {active ?? ''}
          </RuneButton>
          <span class="time">{formatTime(position)} / {formatTime(duration)}</span>
          <span class="note">Switching takes keeps the time position.</span>
        </div>
      {/if}

      {#if !seance.revealed && !pending && finished.length >= 2}
        <h2>Rank, best first</h2>
        <ol class="rank">
          {#each order as label, i (label)}
            <li
              draggable="true"
              class:dragging={dragging === label}
              ondragstart={() => (dragging = label)}
              ondragover={(ev) => ev.preventDefault()}
              ondrop={() => drop(label)}
            >
              <span class="grip" aria-hidden="true">⠿</span>
              <strong>{label}</strong>
              <button
                aria-label={'Move ' + label + ' up'}
                disabled={i === 0}
                onclick={() => move(label, -1)}>▲</button
              >
              <button
                aria-label={'Move ' + label + ' down'}
                disabled={i === order.length - 1}
                onclick={() => move(label, 1)}>▼</button
              >
            </li>
          {/each}
        </ol>
        <RuneButton onclick={reveal} {busy} disabled={busy}>Reveal the models</RuneButton>
      {:else if pending}
        <p class="note">Takes are still generating. Ranking opens when every take is in.</p>
      {:else if !seance.revealed && cannotCompare(seance.entries)}
        <p class="note">
          Only {finished.length} of {seance.entries.length} takes arrived, so there is nothing to rank.
          Start another comparison with the models that answered.
        </p>
      {/if}
      {#if seance.revealed || cannotCompare(seance.entries)}
        <RuneButton variant="ghost" onclick={again}>Start another comparison</RuneButton>
      {/if}
    </ArcanePanel>
  {/if}

  <ArcanePanel title="Leaderboard" eyebrow="Every revealed comparison">
    {#if board.length}
      <table>
        <thead>
          <tr
            ><th>Model</th><th>Runner</th><th>Wins</th><th>Rounds</th><th>Win rate</th><th
              >Mean rank</th
            ></tr
          >
        </thead>
        <tbody>
          {#each board as row (row.model + row.runner)}
            <tr>
              <td>{nameOf(row.model)}</td><td>{row.runner}</td><td>{row.wins}</td><td
                >{row.appearances}</td
              ><td>{Math.round(row.win_rate * 100)}%</td><td>{row.mean_rank.toFixed(2)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p class="note">No comparison has been revealed yet.</p>
    {/if}
  </ArcanePanel>
</div>

<style>
  .seance {
    display: grid;
    gap: 1.5rem;
    max-width: 1100px;
    margin: 0 auto;
  }
  .intro h1 {
    font-family: var(--vbm-font-display);
    letter-spacing: 0.04em;
    text-align: center;
    margin: 0;
  }
  .intro p {
    text-align: center;
    color: var(--vbm-muted, #a8a8b6);
    max-width: 60ch;
    margin: 0.5rem auto 0;
  }
  .error {
    color: var(--vbm-crimson, #ff5a6e);
  }
  .note {
    color: var(--vbm-muted, #a8a8b6);
    font-size: 0.9rem;
  }
  .models {
    border: 0;
    padding: 0;
    margin: 0 0 1rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
    gap: 0.5rem;
  }
  .models legend {
    font-family: var(--vbm-font-display);
    letter-spacing: 0.04em;
    margin-bottom: 0.5rem;
  }
  .count {
    font-size: 0.8rem;
    color: var(--vbm-teal);
    margin-left: 0.5rem;
  }
  .model {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.1rem 0.6rem;
    align-items: center;
    padding: 0.6rem 0.8rem;
    border: 1px solid rgba(160, 120, 255, 0.3);
    border-radius: 0.5rem;
    cursor: pointer;
  }
  .model.off {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .model .why {
    grid-column: 2;
    font-size: 0.75rem;
    color: var(--vbm-muted, #a8a8b6);
  }
  .actions {
    margin-top: 1rem;
  }
  .prompt {
    font-style: italic;
  }
  .takes {
    display: grid;
    gap: 0.8rem;
  }
  .take {
    border: 1px solid rgba(160, 120, 255, 0.25);
    border-radius: 0.6rem;
    padding: 0.6rem 0.8rem;
  }
  .take.current {
    border-color: var(--vbm-teal);
  }
  .take header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.4rem;
  }
  .label {
    font-family: var(--vbm-font-display);
    font-size: 1.4rem;
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 50%;
    border: 1px solid var(--vbm-violet);
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .label[aria-pressed='true'] {
    background: rgba(80, 230, 210, 0.15);
    border-color: var(--vbm-teal);
  }
  .unveiled {
    display: inline-flex;
    gap: 0.6rem;
    align-items: baseline;
    font-family: var(--vbm-font-display);
    letter-spacing: 0.08em;
    animation: unveil 1.4s ease-out both;
  }
  .unveiled small {
    font-family: inherit;
    opacity: 0.7;
    font-size: 0.75rem;
  }
  .unveiled em {
    color: var(--vbm-teal);
    font-style: normal;
  }
  @keyframes unveil {
    from {
      opacity: 0;
      filter: blur(8px);
      letter-spacing: 0.04em;
    }
    to {
      opacity: 1;
      filter: blur(0);
      letter-spacing: 0.08em;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .unveiled {
      animation: none;
    }
  }
  .transport {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    margin: 1rem 0;
  }
  .time {
    font-variant-numeric: tabular-nums;
  }
  .rank {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 0.4rem;
    max-width: 320px;
  }
  .rank li {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    padding: 0.4rem 0.6rem;
    border: 1px solid rgba(160, 120, 255, 0.3);
    border-radius: 0.4rem;
    cursor: grab;
  }
  .rank li.dragging {
    opacity: 0.5;
  }
  .rank li strong {
    flex: 1;
    font-family: var(--vbm-font-display);
  }
  .rank button {
    background: transparent;
    border: 1px solid rgba(160, 120, 255, 0.4);
    color: inherit;
    border-radius: 0.3rem;
    cursor: pointer;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  th,
  td {
    text-align: left;
    padding: 0.4rem;
    border-bottom: 1px solid rgba(160, 120, 255, 0.2);
  }
  @media (max-width: 600px) {
    th:nth-child(2),
    td:nth-child(2) {
      display: none;
    }
  }
</style>
