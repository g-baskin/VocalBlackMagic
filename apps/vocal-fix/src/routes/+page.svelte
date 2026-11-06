<script lang="ts">
  import { onMount } from 'svelte';
  import BrandHeader from '@vbm/ui/BrandHeader.svelte';
  import StatusPanel from '@vbm/ui/StatusPanel.svelte';
  import type { VocalReferenceSession } from '@vbm/contracts';

  let performer = $state('');
  let files = $state<File[]>([]);
  let acknowledged = $state(false);
  let busy = $state(false);
  let status = $state('Checking local audio service…');
  let tone = $state<'neutral'|'warning'|'success'>('neutral');
  let session = $state<VocalReferenceSession | null>(null);
  let capabilityNote = $state('Gold Vocal processing is not implemented.');
  const ttbUrl = import.meta.env.VITE_TTB_STUDIO_URL || 'http://localhost:5174';

  onMount(async () => {
    try {
      const response = await fetch('/api/capabilities');
      if (!response.ok) { status = 'Audio service unavailable. Start the Python prototype on 127.0.0.1:8001 for local uploads.'; tone = 'warning'; return; }
      const result = await response.json();
      capabilityNote = result.gold_vocal === 'not-implemented'
        ? 'Reference upload only. Separation, Gold Vocal and voice-character prompts are upcoming.'
        : 'Backend capability information loaded.';
      status = 'Local prototype is available. Public SaaS upload remains disabled until authentication is ready.';
      tone = 'neutral';
    } catch { status = 'Local backend is unavailable.'; tone = 'warning'; }
  });

  function selectFiles(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    files = Array.from(input.files ?? []);
    if (files.length !== 5) { status = 'Select exactly five recordings.'; tone = 'warning'; }
  }

  async function upload(event: SubmitEvent) {
    event.preventDefault();
    if (!acknowledged || files.length !== 5 || !performer.trim()) return;
    busy = true; session = null; status = 'Uploading five authorized recordings…'; tone = 'neutral';
    const form = new FormData();
    for (const file of files) form.append('files', file, file.name);
    form.append('voice_owner', performer.trim());
    form.append('acknowledged_rights', 'true');
    try {
      const response = await fetch('/api/references', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) { status = result.detail || 'Upload failed.'; tone = 'warning'; return; }
      session = result as VocalReferenceSession;
      status = 'Five reference recordings stored locally. This is NOT yet a Gold Vocal; processing still requires implementation.';
      tone = 'success';
    } catch (error) { status = error instanceof Error ? error.message : 'Upload failed.'; tone = 'warning'; }
    finally { busy = false; }
  }

  async function deleteSession() {
    if (!session || busy) return;
    busy = true;
    try {
      const response = await fetch('/api/references/' + session.session_id, { method: 'DELETE' });
      if (!response.ok) throw new Error('Unable to delete session.');
      session = null; files = []; status = 'Local reference session deleted.'; tone = 'success';
    } catch (error) { status = error instanceof Error ? error.message : 'Deletion failed.'; tone = 'warning'; }
    finally { busy = false; }
  }
</script>

<BrandHeader product="Vocal Fix" sisterUrl={ttbUrl} sisterName="TTB Studio" />
<main>
  <span class="eyebrow">Application 01 / Vocal restoration</span>
  <h1>Find the voice.<br />Keep the character.</h1>
  <p class="lead">Five authorized reference tracks become the foundation for an isolated, curated Gold Vocal. Preserve the raw performance while preparing audio and a descriptive vocal profile.</p>
  <div class="split">
    <section class="panel" aria-label="Five vocal reference upload">
      <span class="tag">Local development intake</span>
      <h2>Build a vocal reference</h2>
      <p>{capabilityNote}</p>
      <form onsubmit={upload}>
        <div class="field">
          <label for="performer">Authorized performer</label>
          <input id="performer" type="text" maxlength="120" required placeholder="Name of the consenting vocalist" bind:value={performer} />
        </div>
        <div class="field">
          <label for="recordings">Upload exactly five recordings</label>
          <input id="recordings" type="file" accept=".wav,.mp3,.flac,.m4a" multiple required onchange={selectFiles} />
          <p class="tiny">Accepted formats: WAV, MP3, FLAC, M4A. Maximum 25 MiB per file.</p>
          {#if files.length > 0}
            <ul class="list">{#each files as file, index (index)}<li>{index + 1}. {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MiB</li>{/each}</ul>
          {/if}
        </div>
        <label class="terms">
          <input type="checkbox" bind:checked={acknowledged} required />
          <span>I have the rights to process these recordings and affirmative permission from the vocal performer for this purpose.</span>
        </label>
        <button class="primary" type="submit" disabled={busy || !acknowledged || files.length !== 5 || !performer.trim()}>
          {busy ? 'Working…' : 'Create reference session'}
        </button>
      </form>
      <div style="margin-top:20px"><StatusPanel title="Reference status" message={status} {tone} /></div>
      {#if session}
        <div class="panel" style="background:var(--panel-alt);margin-top:18px">
          <strong>Session created</strong>
          <p class="code">{session.session_id}</p>
          <p>Files: {session.recordings.length} · Gold Vocal ready: {session.gold_vocal_ready ? 'Yes' : 'Not yet'}</p>
          <button class="secondary" type="button" onclick={deleteSession} disabled={busy}>Delete stored references</button>
        </div>
      {/if}
    </section>
    <aside class="panel">
      <span class="eyebrow">Roadmap</span><h2>Gold Vocal workflow</h2>
      <ul class="list">
        <li>01. Five authorized source recordings</li>
        <li>02. Vocal/instrument separation</li>
        <li>03. Denoise and quality-check phrases</li>
        <li>04. Assemble representative dry Gold Vocal</li>
        <li>05. Extract an editable vocal-character prompt</li>
        <li>06. Export isolated assets and profile</li>
      </ul>
      <p class="tiny">Steps 02–06 are planned, not yet active. No voice cloning or artist imitation is performed by the prototype.</p>
    </aside>
  </div>
</main>
