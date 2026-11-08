<script lang="ts">
  import Spectrogram from '@vbm/ui/Spectrogram.svelte';
  import PitchTrace from '@vbm/ui/PitchTrace.svelte';
  import { formatTime } from '@vbm/ui/audio';
  let { buffer }: { buffer: AudioBuffer | null } = $props();
</script>

<section class="analysis-deck" aria-label="Spectrogram and pitch analysis">
  <header class="analysis-head">
    <div>
      <p class="eyebrow">Signal analysis</p>
      <h2>Inside the sound</h2>
    </div>
    <span class="read-only">Read-only</span>
  </header>
  <div class="file-facts" aria-label="Decoded audio information">
    {#if buffer}
      <span><b>{formatTime(buffer.duration)}</b> duration</span>
      <span><b>{Number((buffer.sampleRate / 1000).toFixed(2))}</b> kHz</span>
      <span
        ><b>{buffer.numberOfChannels}</b>
        {buffer.numberOfChannels === 1 ? 'channel' : 'channels'}</span
      >
    {:else}<span>Analysis needs decoded audio. Playback is available above.</span>{/if}
  </div>

  <div class="instrument spectrum-instrument">
    <div class="instrument-head">
      <h3><span class="mark frequency" aria-hidden="true"></span>Spectrogram</h3>
      <span class="unit">Frequency · Hz</span>
    </div>
    <Spectrogram {buffer} height={230} variant="signal" />
    <div class="map-key">
      <span>Relative energy</span>
      <div class="energy-scale"><span>Low</span><i aria-hidden="true"></i><span>High</span></div>
    </div>
  </div>

  <div class="instrument pitch-instrument">
    <div class="instrument-head">
      <h3><span class="mark pitch" aria-hidden="true"></span>Pitch trace</h3>
      <span class="unit">Full-mix estimate</span>
    </div>
    <PitchTrace {buffer} height={190} variant="signal" />
    <p class="pitch-note">
      Tracks the mix, not just the singer. Jumps can come from bass or instruments, not out-of-tune
      vocals.
    </p>
  </div>
  <footer>Time runs left to right. These displays do not change your audio.</footer>
</section>

<style>
  .analysis-deck {
    --analysis-muted: #b9c5d3;
    color: #f2f4f7;
    background: #191e27;
    border: 1px solid #3b4351;
    border-radius: 20px;
    overflow: hidden;
    margin-top: 20px;
    min-width: 0;
  }
  .analysis-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
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
  .read-only {
    color: var(--analysis-muted);
    font-size: 0.75rem;
    border: 1px solid #647488;
    border-radius: 6px;
    padding: 5px 8px;
  }
  .file-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    color: var(--analysis-muted);
    font-size: 0.75rem;
    padding: 0 24px 20px;
    font-variant-numeric: tabular-nums;
  }
  .file-facts b {
    color: #f2f4f7;
    font-weight: 600;
  }
  .instrument {
    margin: 0 24px 20px;
    min-width: 0;
  }
  .instrument-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
    margin-bottom: 12px;
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
  }
  .mark {
    width: 4px;
    height: 16px;
    border-radius: 1px;
    flex: none;
  }
  .frequency {
    background: #ff91a7;
  }
  .pitch {
    background: #75dfef;
  }
  .unit {
    color: var(--analysis-muted);
    font-size: 0.75rem;
  }
  .map-key {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
    color: var(--analysis-muted);
    font-size: 0.7rem;
    margin-top: 8px;
  }
  .energy-scale {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .energy-scale i {
    display: block;
    width: 84px;
    height: 5px;
    border-radius: 2px;
    background: linear-gradient(
      90deg,
      #0f141b,
      #183145 25%,
      #236e8b 50%,
      #48b1c6 70%,
      #97dce5 88%,
      #fff2e9
    );
  }
  .pitch-note {
    margin: 10px 0 0;
    color: var(--analysis-muted);
    font-size: 0.8rem;
    line-height: 1.55;
    max-width: 80ch;
  }
  footer {
    border-top: 1px solid #3b4351;
    padding: 14px 24px;
    color: var(--analysis-muted);
    font-size: 0.75rem;
  }
  @media (max-width: 480px) {
    .analysis-head {
      padding: 20px 16px 14px;
    }
    .file-facts {
      padding-inline: 16px;
    }
    .instrument {
      margin-inline: 12px;
    }
    footer {
      padding-inline: 16px;
    }
  }
  @media (forced-colors: active) {
    .analysis-deck,
    .read-only {
      border-color: CanvasText;
    }
    .analysis-deck {
      color: CanvasText;
      background: Canvas;
    }
  }
</style>
