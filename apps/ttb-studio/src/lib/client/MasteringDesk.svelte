<script lang="ts">
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import { masteringPresets, type MasteringPreset } from '../mastering';
  let {
    selected = $bindable('balanced'),
    disabled = false,
    rendering = false,
    error = null,
    masterHref = null,
    onrender
  }: {
    selected?: MasteringPreset;
    disabled?: boolean;
    rendering?: boolean;
    error?: string | null;
    masterHref?: string | null;
    onrender: () => void;
  } = $props();
</script>

<section class="mastering-desk" aria-labelledby="mastering-title">
  <header>
    <p class="eyebrow">Mastering desk</p>
    <h2 id="mastering-title">Choose your finish</h2>
    <p>Shape the whole mix, not individual vocals or instruments.</p>
  </header>
  <fieldset disabled={disabled || rendering}>
    <legend>Mastering preset</legend>
    <div class="presets">
      {#each masteringPresets as preset (preset.id)}
        <label class:chosen={selected === preset.id}>
          <input
            type="radio"
            name="mastering-preset"
            value={preset.id}
            bind:group={selected}
            aria-describedby={'mastering-' + preset.id}
          />
          <span>
            <strong>{preset.name}</strong>
            <span hidden id={'mastering-' + preset.id}>{preset.description}</span>
          </span>
        </label>
      {/each}
    </div>
  </fieldset>
  <p class="preset-description" aria-hidden="true">
    {masteringPresets.find((p) => p.id === selected)?.description}
  </p>
  <div class="output">
    <span><b>−14 LUFS</b> loudness target</span>
    <span><b>−1 dBTP</b> peak target</span>
    <span><b>24-bit WAV</b> copy</span>
  </div>
  <footer>
    <p>
      Selection does not change playback. Rendering saves a new version and keeps this source
      untouched. No AI provider charge.
    </p>
    <div class="actions">
      <RuneButton {disabled} busy={rendering} onclick={onrender}>
        {rendering
          ? 'Creating mastered copy…'
          : error
            ? 'Retry mastered copy'
            : 'Create mastered copy'}
      </RuneButton>
      {#if masterHref && !rendering}
        <RuneButton variant="ghost" href={masterHref}
          >Open {masteringPresets.find((p) => p.id === selected)?.name} master (A/B)</RuneButton
        >
      {/if}
    </div>
    <div class="status" role="status">
      {#if rendering}<p>Rendering your selected finish. This can take a few minutes.</p>
      {:else if !error && masterHref}<p>
          Your selected finish has a saved copy ready to compare.
        </p>{/if}
    </div>
    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </footer>
</section>

<style>
  .mastering-desk {
    color: #f2f4f7;
    background: #191e27;
    border: 1px solid #3b4351;
    border-radius: 20px;
    min-width: 0;
    margin-top: 20px;
  }
  header {
    padding: 24px 24px 16px;
  }
  .eyebrow {
    color: #75dfef;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
    margin: 0 0 6px;
  }
  h2 {
    margin: 0;
    font-size: clamp(1.25rem, 3vw, 1.65rem);
    letter-spacing: -0.025em;
    line-height: 1.2;
  }
  header > p:last-child,
  footer > p {
    color: #b9c5d3;
    font-size: 0.85rem;
    line-height: 1.55;
    margin: 10px 0 0;
  }
  fieldset {
    min-width: 0;
    border: 0;
    padding: 0;
    margin: 0 24px 20px;
  }
  legend {
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 10px;
    padding: 0;
  }
  .presets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
    gap: 12px;
  }
  label {
    display: flex;
    align-items: start;
    gap: 12px;
    padding: 16px;
    border: 1px solid #77889d;
    border-radius: 10px;
    cursor: pointer;
    min-width: 0;
  }
  label:hover {
    background: #222b37;
  }
  label.chosen {
    border-color: #75dfef;
    background: #222b37;
  }
  input {
    margin: 4px 0 0;
    width: 18px;
    height: 18px;
    flex: none;
    accent-color: #75dfef;
  }
  label:has(input:focus-visible) {
    outline: 2px solid #75dfef;
    outline-offset: 3px;
  }
  input:focus-visible {
    outline: none;
  }
  strong {
    display: block;
    font-size: 1rem;
  }
  .preset-description {
    display: block;
    margin: 0 24px 20px;
    color: #b9c5d3;
    font-size: 0.85rem;
    line-height: 1.5;
  }
  fieldset:disabled label {
    cursor: wait;
    opacity: 0.65;
  }
  .output {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    padding: 0 24px 20px;
    color: #b9c5d3;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
  }
  .output b {
    color: #f2f4f7;
    font-weight: 600;
  }
  footer {
    border-top: 1px solid #3b4351;
    padding: 16px 24px 20px;
  }
  footer > p {
    margin: 0 0 16px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .status p,
  .error {
    font-size: 0.85rem;
    line-height: 1.5;
    margin: 12px 0 0;
  }
  .status {
    color: #b9c5d3;
  }
  .error {
    color: #ffacb9;
    overflow-wrap: anywhere;
  }
  @media (max-width: 480px) {
    header {
      padding: 20px 16px 16px;
    }
    fieldset,
    .preset-description {
      margin-inline: 16px;
    }
    .output {
      padding-inline: 16px;
    }
    footer {
      padding-inline: 16px;
    }
  }
  @media (forced-colors: active) {
    label.chosen {
      border: 2px solid Highlight;
    }
    label:has(input:focus-visible) {
      outline-color: Highlight;
    }
  }
</style>
