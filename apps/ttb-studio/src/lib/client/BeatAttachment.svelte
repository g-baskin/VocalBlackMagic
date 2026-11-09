<script lang="ts" module>
  /** How Create uses an attached beat. */
  export type BeatUse = 'reference' | 'remix' | 'none';
</script>

<script lang="ts">
  import type { SongMeta, StudioEditInfo } from '@vbm/contracts';
  import { audioUrl } from './api';

  let {
    songId,
    song,
    choices,
    use = $bindable(),
    strength = $bindable(),
    remix,
    voiceName,
    onchange,
    onremove
  }: {
    songId: string;
    /** Null while the library is still loading. */
    song: SongMeta | null;
    choices: { value: string; label: string }[];
    use: BeatUse;
    /** Remix: 0 keeps the beat, 1 ignores it. */
    strength: number;
    /** Whether the remix edit can run on this beat now (null while checking). */
    remix: StudioEditInfo | null;
    /** The trained voice that will sing, when one is chosen under Sung by. */
    voiceName: string | null;
    onchange: (id: string) => void;
    onremove: () => void;
  } = $props();

  const uid = $props.id();
  let changing = $state(false);
</script>

<section class="beat" aria-labelledby="{uid}-title">
  <div class="head">
    <span class="icon" aria-hidden="true">♫</span>
    <div class="name">
      <span class="eyebrow">Attached beat</span>
      <strong id="{uid}-title">{song?.title ?? 'Loading…'}</strong>
    </div>
    <button type="button" class="link" onclick={() => (changing = !changing)}
      >{changing ? 'Done' : 'Change'}</button
    >
    <button type="button" class="remove" aria-label="Remove the attached beat" onclick={onremove}
      >✕</button
    >
  </div>

  {#if changing}
    <label class="change">
      <span>Use another song from your Library</span>
      <select
        value={songId}
        onchange={(e) => {
          onchange((e.currentTarget as HTMLSelectElement).value);
          changing = false;
        }}
      >
        {#each choices as c (c.value)}<option value={c.value}>{c.label}</option>{/each}
      </select>
    </label>
  {/if}

  {#if song?.audio}
    <audio controls preload="metadata" src={audioUrl(songId)} aria-label="Play {song.title}"
    ></audio>
  {/if}

  <fieldset class="uses">
    <legend>How should this song use it?</legend>
    <label class:on={use === 'reference'}>
      <input type="radio" name="{uid}-use" value="reference" bind:group={use} />
      <span>
        <strong>Sing a new song in my beat's style</strong>
        <small>
          MiniMax Music-01 hears your beat and writes new music like it, sung with your lyrics{voiceName
            ? ' in ' + voiceName + "'s voice"
            : ''}. About $0.035, lyrics up to about 380 characters.
        </small>
      </span>
    </label>
    <label class:on={use === 'remix'} class:off={remix !== null && !remix.available}>
      <input
        type="radio"
        name="{uid}-use"
        value="remix"
        bind:group={use}
        disabled={remix !== null && !remix.available}
      />
      <span>
        <strong>Keep my beat's structure, add vocals</strong>
        <small>
          ACE-Step remixes your actual audio with your style and lyrics. About $0.05. Unverified: it
          may come back without vocals.
          {#if remix && !remix.available}<em>Unavailable: {remix.reason}</em>{/if}
        </small>
      </span>
    </label>
    {#if use === 'remix'}
      <label class="strength">
        <span>How far from your beat: {strength.toFixed(2)} (0 keeps it, 1 ignores it)</span>
        <input type="range" min="0" max="1" step="0.05" bind:value={strength} />
      </label>
    {/if}
    <label class:on={use === 'none'}>
      <input type="radio" name="{uid}-use" value="none" bind:group={use} />
      <span>
        <strong>Don't use it</strong>
        <small>Create a song from your description with any model.</small>
      </span>
    </label>
  </fieldset>
</section>

<style>
  .beat {
    display: grid;
    gap: 0.7rem;
    margin: 0 0 1rem;
    padding: 0.85rem 1rem;
    border: 1px solid var(--vbm-blue);
    border-radius: var(--vbm-radius, 12px);
    background: linear-gradient(135deg, rgb(79 139 255 / 10%), var(--vbm-surface-2));
  }
  .head {
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  .icon {
    display: grid;
    place-items: center;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 10px;
    background: var(--vbm-gradient-blue);
    color: #fff;
    font-size: 1.2rem;
  }
  .name {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .eyebrow {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--vbm-blue-text);
  }
  .name strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .link,
  .remove {
    min-height: var(--vbm-tap, 2.5rem);
    padding: 0 0.7rem;
    border: 1px solid var(--vbm-border);
    border-radius: 8px;
    background: var(--vbm-surface);
    color: var(--vbm-text);
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .remove {
    color: var(--vbm-muted);
  }
  .change {
    display: grid;
    gap: 0.25rem;
    font-size: 0.8rem;
    color: var(--vbm-muted);
  }
  .change select {
    min-height: var(--vbm-tap, 2.5rem);
    padding: 0 0.5rem;
    border: 1px solid var(--vbm-border);
    border-radius: 8px;
    background: var(--vbm-bg);
    color: var(--vbm-text);
    font: inherit;
  }
  audio {
    width: 100%;
    height: 2.4rem;
  }
  .uses {
    display: grid;
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend {
    margin-bottom: 0.3rem;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .uses > label {
    display: flex;
    gap: 0.6rem;
    align-items: flex-start;
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--vbm-border);
    border-radius: 10px;
    background: var(--vbm-surface);
    cursor: pointer;
  }
  .uses > label.on {
    border-color: var(--vbm-blue);
  }
  .uses > label.off {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .uses input[type='radio'] {
    margin-top: 0.2rem;
    accent-color: var(--vbm-blue);
  }
  .uses span {
    display: grid;
    gap: 0.15rem;
  }
  .uses strong {
    font-size: 0.9rem;
  }
  small {
    font-size: 0.78rem;
    color: var(--vbm-muted);
  }
  em {
    display: block;
    font-style: normal;
    color: var(--vbm-warning);
  }
  .strength {
    display: grid;
    gap: 0.25rem;
    padding: 0 0.3rem;
    font-size: 0.78rem;
    color: var(--vbm-muted);
  }
  .strength input {
    accent-color: var(--vbm-blue);
  }
  button:focus-visible,
  select:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--vbm-focus, var(--vbm-blue));
    outline-offset: 2px;
  }
</style>
