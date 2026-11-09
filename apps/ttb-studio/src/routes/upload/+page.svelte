<script lang="ts">
  import { onDestroy } from 'svelte';
  import { resolve } from '$app/paths';
  import ArcanePanel from '@vbm/ui/ArcanePanel.svelte';
  import ArcaneInput from '@vbm/ui/ArcaneInput.svelte';
  import ArcaneTextarea from '@vbm/ui/ArcaneTextarea.svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import RuneDropzone from '@vbm/ui/RuneDropzone.svelte';
  import type { LyricSheet, SongMeta } from '@vbm/contracts';
  import { audioUrl } from '../../lib/client/api';
  import { renderMidi } from '../../lib/client/midi-render';

  type Choice = 'song' | 'beat' | 'acapella' | 'stems' | 'video' | 'midi' | 'lyrics' | 'recording';
  const audioAccept =
    '.mp3,.wav,.flac,.m4a,.aac,.alac,.ogg,.oga,.opus,.aif,.aiff,.aifc,.webm,.weba,.wma,.amr,audio/*';
  const choices: { id: Choice; label: string; hint: string; accept: string }[] = [
    { id: 'song', label: 'Song', hint: 'A finished track', accept: audioAccept },
    { id: 'beat', label: 'Beat', hint: 'Instrumental or loop', accept: audioAccept },
    { id: 'acapella', label: 'Vocals', hint: 'Acapella or vocal take', accept: audioAccept },
    {
      id: 'stems',
      label: 'Stems',
      hint: 'Several files or one ZIP',
      accept: audioAccept + ',.zip'
    },
    {
      id: 'video',
      label: 'Video',
      hint: 'We keep the sound',
      accept: '.mp4,.mov,.m4v,.webm,.mkv,video/*'
    },
    { id: 'midi', label: 'MIDI', hint: 'Notes with a synth preview', accept: '.mid,.midi' },
    {
      id: 'lyrics',
      label: 'Lyrics',
      hint: 'Text, subtitles, Word, PDF',
      accept: '.txt,.md,.lrc,.srt,.vtt,.docx,.pdf'
    },
    { id: 'recording', label: 'Record', hint: 'Use your microphone', accept: '' }
  ];

  let choice = $state<Choice>('song');
  let files = $state<File[]>([]);
  let title = $state('');
  let genre = $state('');
  let tags = $state('');
  let pasted = $state('');
  let rights = $state(false);
  let progress = $state<number | null>(null);
  let status = $state('');
  let error = $state<string | null>(null);
  let song = $state<SongMeta | null>(null);
  let sheet = $state<LyricSheet | null>(null);

  const current = $derived(choices.find((c) => c.id === choice)!);

  function pick(id: Choice) {
    choice = id;
    files = [];
    error = null;
    song = null;
    sheet = null;
    discardRecording();
  }

  // Default the title from the first file name (display only; the server never uses file names in paths).
  $effect(() => {
    if (!title && files[0]) title = files[0].name.replace(/\.[^.]+$/, '').slice(0, 120);
  });

  /* ---- microphone ---- */
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let audioCtx: AudioContext | null = null;
  let raf = 0;
  let chunks: Blob[] = [];
  let recording = $state(false);
  let level = $state(0);
  let seconds = $state(0);
  let take = $state<File | null>(null);
  let takeUrl = $state<string | null>(null);

  function recorderType(): string {
    for (const type of [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus'
    ])
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type;
    return '';
  }

  async function startRecording() {
    error = null;
    discardRecording();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      error = 'Microphone access was refused. Allow it in your browser settings and try again.';
      return;
    }
    const type = recorderType();
    recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const mime = recorder?.mimeType || type || 'audio/webm';
      const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
      take = new File(chunks, 'recording.' + ext, { type: mime.split(';')[0] });
      takeUrl = URL.createObjectURL(take);
      if (!title) title = 'Recording ' + new Date().toLocaleString();
    };
    audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    const data = new Float32Array(analyser.fftSize);
    const started = performance.now();
    const tick = () => {
      analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (const x of data) sum += x * x;
      level = Math.min(1, Math.sqrt(sum / data.length) * 4);
      seconds = (performance.now() - started) / 1000;
      if (seconds >= 900) stopRecording();
      else raf = requestAnimationFrame(tick);
    };
    recorder.start(1000);
    recording = true;
    tick();
  }

  function stopRecording() {
    // onDestroy also runs during server rendering, where animation frames do not exist.
    if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks().forEach((t) => t.stop());
    void audioCtx?.close();
    audioCtx = null;
    stream = null;
    recording = false;
    level = 0;
  }

  function discardRecording() {
    if (recording) stopRecording();
    if (takeUrl) URL.revokeObjectURL(takeUrl);
    take = null;
    takeUrl = null;
  }

  onDestroy(() => {
    stopRecording();
    if (takeUrl) URL.revokeObjectURL(takeUrl);
  });

  /* ---- upload ---- */
  // Cloudflare refuses request bodies over 100 MB before they reach the studio; leave room for the form.
  const MAX_UPLOAD_MB = 95;
  const tooBig = `That is over ${MAX_UPLOAD_MB} MB, the most one upload can carry. Trim or compress it (for example to MP3 or FLAC) and try again.`;

  function send<T>(url: string, body: FormData): Promise<T> {
    return new Promise((done, fail) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.setRequestHeader('x-vbm-intent', 'upload');
      xhr.setRequestHeader('accept', 'application/json');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) progress = e.loaded / e.total;
      };
      xhr.upload.onload = () => (status = 'Checking and converting your audio…');
      xhr.onerror = () =>
        fail(new Error('The upload did not reach the studio. Check your connection.'));
      xhr.onload = () => {
        let reply: { detail?: string } = {};
        try {
          reply = JSON.parse(xhr.responseText);
        } catch {
          // non-JSON error page
        }
        if (xhr.status >= 200 && xhr.status < 300) done(reply as T);
        else if (xhr.status === 413) fail(new Error(tooBig));
        else fail(new Error(reply.detail || 'Upload failed (' + xhr.status + ').'));
      };
      let size = 0;
      for (const [, value] of body) if (value instanceof File) size += value.size;
      if (size > MAX_UPLOAD_MB * 1024 * 1024) return fail(new Error(tooBig));
      xhr.send(body);
    });
  }

  const canSend = $derived(
    rights &&
      title.trim().length > 0 &&
      progress === null &&
      (choice === 'recording'
        ? !!take
        : choice === 'lyrics'
          ? files.length > 0 || pasted.trim().length > 0
          : choice === 'stems'
            ? files.length > 1 || (files.length === 1 && /\.zip$/i.test(files[0].name))
            : files.length === 1)
  );

  async function upload() {
    if (!rights) {
      error = 'Please confirm you made this or have the rights to use it.';
      return;
    }
    error = null;
    progress = 0;
    status = 'Uploading…';
    try {
      if (choice === 'lyrics') {
        if (files.length) {
          const form = new FormData();
          form.set('title', title);
          form.set('rights', 'true');
          form.append('file', files[0]);
          sheet = (await send<{ sheet: LyricSheet }>('/api/studio/uploads/lyrics', form)).sheet;
        } else {
          const response = await fetch('/api/studio/uploads/lyrics', {
            method: 'POST',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ title, text: pasted, rights: true })
          });
          const reply = (await response.json().catch(() => ({}))) as {
            sheet?: LyricSheet;
            detail?: string;
          };
          if (!response.ok || !reply.sheet)
            throw new Error(reply.detail || 'Saving the lyrics failed.');
          sheet = reply.sheet;
        }
        return;
      }
      const form = new FormData();
      form.set('type', choice);
      form.set('title', title);
      form.set('genre', genre);
      form.set('tags', tags);
      form.set('rights', 'true');
      if (choice === 'recording') form.append('file', take!);
      else if (choice === 'midi') {
        status = 'Rendering a MIDI preview, not generating a song…';
        const rendered = await renderMidi(await files[0].arrayBuffer());
        form.append('file', new File([rendered.wav], 'midi-preview.wav', { type: 'audio/wav' }));
        form.append('midi', files[0]);
        status = 'Uploading…';
      } else for (const file of files) form.append('file', file);
      song = (await send<{ song: SongMeta }>('/api/studio/uploads', form)).song;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Upload failed.';
    } finally {
      progress = null;
      status = '';
    }
  }

  function again() {
    song = null;
    sheet = null;
    files = [];
    title = '';
    pasted = '';
    discardRecording();
  }

  const clock = (s: number) =>
    Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
</script>

<svelte:head><title>Upload · TTB Studio</title></svelte:head>

<div class="upload">
  <h1>Upload</h1>
  <RuneButton variant="ghost" href={resolve('/riffs')}>Create a riff instead</RuneButton>
  <p class="lead">
    Bring your own songs, beats, vocals, stems, video sound, MIDI or lyrics, then keep creating with
    them.
  </p>

  {#if song}
    <ArcanePanel title="Uploaded" eyebrow={song.upload?.type ?? 'upload'} glow="teal">
      <p class="done">“{song.title}” is in your library.</p>
      {#if song.upload?.type === 'midi'}
        <p class="tiny">
          This is a synthesized preview of the MIDI notes, not an AI-produced song. The original
          MIDI is preserved. Riff-to-song generation is not ready yet.
        </p>
      {/if}
      <audio controls preload="metadata" src={audioUrl(song.id)}></audio>
      <p class="tiny">
        From the song page you can extend it, remix or restyle it, split stems and master it.
      </p>
      <div class="next">
        <RuneButton href={resolve('/library/[id]', { id: song.id })}>Open song</RuneButton>
        <RuneButton variant="ghost" onclick={again}>Upload another</RuneButton>
      </div>
    </ArcanePanel>
  {:else if sheet}
    <ArcanePanel title="Lyrics saved" eyebrow="lyrics" glow="teal">
      <p class="done">“{sheet.title}” is saved and ready to use.</p>
      <pre class="lyrics">{sheet.text}</pre>
      <div class="next">
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() has no query support; the base path is resolved -->
        <a class="link-button" href={resolve('/') + '?lyrics=' + encodeURIComponent(sheet.id)}
          >Use in Create</a
        >
        <RuneButton variant="ghost" href={resolve('/lyrics')}>Open in Lyrics</RuneButton>
        <RuneButton variant="ghost" onclick={again}>Upload another</RuneButton>
      </div>
    </ArcanePanel>
  {:else}
    <fieldset class="types">
      <legend>What are you uploading?</legend>
      {#each choices as c (c.id)}
        <button
          type="button"
          class="type"
          class:active={choice === c.id}
          aria-pressed={choice === c.id}
          onclick={() => pick(c.id)}
        >
          <span class="name">{c.label}</span>
          <span class="hint">{c.hint}</span>
        </button>
      {/each}
    </fieldset>

    <ArcanePanel title={current.label}>
      {#if choice === 'recording'}
        <div class="recorder">
          {#if recording}
            <div
              class="meter"
              aria-label="Input level"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(level * 100)}
            >
              <span style:width={level * 100 + '%'}></span>
            </div>
            <p class="time">● {clock(seconds)}</p>
            <RuneButton variant="danger" onclick={stopRecording}>Stop</RuneButton>
          {:else if takeUrl}
            <audio controls src={takeUrl}></audio>
            <RuneButton variant="ghost" onclick={startRecording}>Record again</RuneButton>
          {:else}
            <RuneButton onclick={startRecording}>Start recording</RuneButton>
            <p class="small">Up to 15 minutes. Use headphones to avoid echo.</p>
          {/if}
        </div>
      {:else}
        {#key choice}
          <RuneDropzone
            label={choice === 'stems'
              ? 'Drop your stems or a ZIP here'
              : 'Drop a file here or tap to choose'}
            accept={current.accept}
            multiple={choice === 'stems'}
            max={16}
            bind:files
            hint={choice === 'stems'
              ? 'Up to 16 files. Names like “vocals”, “drums” or “bass” sort them in the mixer.'
              : choice === 'lyrics'
                ? '.txt, .md, .lrc, .srt, .vtt, .docx or .pdf, up to 5 MB'
                : 'Up to 95 MB and 15 minutes'}
          />
        {/key}
        {#if choice === 'lyrics' && !files.length}
          <ArcaneTextarea
            label="…or paste your lyrics"
            bind:value={pasted}
            rows={8}
            maxlength={15000}
          />
        {/if}
        {#if choice === 'midi'}
          <p class="small">
            We play your MIDI with a simple built-in synth to make a beat you can hear, and keep the
            original .mid file with it.
          </p>
        {/if}
      {/if}

      <ArcaneInput label="Title" bind:value={title} maxlength={120} />
      {#if choice !== 'lyrics'}
        <div class="row">
          <ArcaneInput label="Genre (optional)" bind:value={genre} maxlength={40} />
          <ArcaneInput label="Tags (optional, comma separated)" bind:value={tags} maxlength={400} />
        </div>
      {/if}

      <label class="rights">
        <input type="checkbox" bind:checked={rights} />
        <span>I made this or have the rights to use it.</span>
      </label>
      <p class="small">
        Uploading someone's recording is not their consent to copy their voice. Only use a voice
        with that person's clear permission.
      </p>

      {#if error}<p class="error" role="alert">{error}</p>{/if}
      {#if progress !== null}
        <div
          class="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span style:width={progress * 100 + '%'}></span>
        </div>
        <p class="small" aria-live="polite">{status}</p>
      {/if}

      <RuneButton disabled={!canSend} busy={progress !== null} onclick={upload}>
        {choice === 'lyrics' ? 'Save lyrics' : 'Upload'}
      </RuneButton>
    </ArcanePanel>
  {/if}
</div>

<style>
  .tiny {
    font-size: 0.85rem;
    color: var(--vbm-muted);
  }
  .upload {
    display: grid;
    gap: var(--vbm-space-4);
    max-width: 52rem;
    margin: 0 auto;
    padding: var(--vbm-space-4);
  }
  h1 {
    margin: 0;
    font-family: var(--vbm-font-display);
  }
  .lead,
  .small {
    color: var(--vbm-muted);
    margin: 0;
  }
  .small {
    font-size: 0.9rem;
  }
  .types {
    border: 0;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 9.5rem), 1fr));
    gap: var(--vbm-space-2);
  }
  legend {
    margin-bottom: var(--vbm-space-2);
    color: var(--vbm-muted);
  }
  .type {
    min-height: 4rem;
    display: grid;
    gap: 2px;
    text-align: left;
    padding: var(--vbm-space-3);
    background: var(--vbm-obsidian-2);
    color: var(--vbm-text);
    border: 1px solid var(--vbm-line);
    border-radius: 10px;
    cursor: pointer;
    font: inherit;
  }
  .type:focus-visible {
    outline: none;
    box-shadow: var(--vbm-focus);
  }
  .type.active {
    border-color: var(--vbm-teal);
    background: var(--vbm-obsidian-3);
  }
  .name {
    font-weight: 600;
    font-size: 1.05rem;
  }
  .hint {
    color: var(--vbm-muted);
    font-size: 0.85rem;
  }
  .row {
    display: grid;
    gap: var(--vbm-space-3);
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  }
  .recorder {
    display: grid;
    gap: var(--vbm-space-3);
    justify-items: start;
  }
  .meter,
  .progress {
    width: 100%;
    height: 10px;
    background: var(--vbm-obsidian-3);
    border-radius: 999px;
    overflow: hidden;
  }
  .meter span,
  .progress span {
    display: block;
    height: 100%;
    background: var(--vbm-teal);
    transition: width 80ms linear;
  }
  .time {
    margin: 0;
    color: var(--vbm-blood);
    font-family: var(--vbm-font-mono);
  }
  .rights {
    display: flex;
    gap: var(--vbm-space-3);
    align-items: center;
    min-height: 44px;
    font-weight: 600;
    cursor: pointer;
  }
  .rights input {
    width: 24px;
    height: 24px;
    flex: none;
  }
  .error {
    color: var(--vbm-blood);
    margin: 0;
  }
  .done {
    margin: 0 0 var(--vbm-space-3);
  }
  audio {
    width: 100%;
  }
  .next {
    display: flex;
    flex-wrap: wrap;
    gap: var(--vbm-space-2);
    margin-top: var(--vbm-space-3);
  }
  .link-button {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 var(--vbm-space-4);
    border-radius: 10px;
    background: var(--vbm-violet-deep);
    color: var(--vbm-text);
    text-decoration: none;
    font-weight: 600;
  }
  .lyrics {
    white-space: pre-wrap;
    max-height: 16rem;
    overflow: auto;
    font-family: var(--vbm-font-body);
    background: var(--vbm-obsidian-2);
    padding: var(--vbm-space-3);
    border-radius: 8px;
  }
  @media (max-width: 480px) {
    .types {
      grid-template-columns: 1fr 1fr;
    }
    .upload {
      padding: var(--vbm-space-3);
    }
  }
</style>
