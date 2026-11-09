<script lang="ts">
  let {
    label,
    value,
    display,
    tone = 'good',
    size = 120
  }: {
    label: string;
    value: number;
    display?: string;
    tone?: 'good' | 'warn' | 'bad';
    size?: number;
  } = $props();

  const v = $derived(Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);
  const R = 40;
  const ARC = 0.75; // 270° sweep
  const circumference = 2 * Math.PI * R;
  const ticks = Array.from({ length: 28 }, (_, i) => -135 + (i * 270) / 27);
  const text = $derived(display ?? `${Math.round(v * 100)}%`);
</script>

<div
  class="meter {tone}"
  role="meter"
  aria-label={label}
  aria-valuemin={0}
  aria-valuemax={1}
  aria-valuenow={v}
  aria-valuetext={text}
>
  <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    {#each ticks as angle, i (i)}
      <line
        x1="50"
        y1="3"
        x2="50"
        y2={i % 9 === 0 ? 9 : 6}
        transform="rotate({angle} 50 50)"
        class:lit={i / 27 <= v && v > 0}
      />
    {/each}
    <circle
      class="track"
      cx="50"
      cy="50"
      r={R}
      stroke-dasharray="{circumference * ARC} {circumference}"
      transform="rotate(135 50 50)"
    />
    <circle
      class="fill"
      cx="50"
      cy="50"
      r={R}
      stroke-dasharray="{circumference * ARC * v} {circumference}"
      transform="rotate(135 50 50)"
    />
    <polygon class="eye" points="50,36 60,50 50,64 40,50" />
  </svg>
  <span class="value" style:height="{size}px">{text}</span>
  <span class="label">{label}</span>
</div>

<style>
  .meter {
    --c: var(--vbm-teal);
    position: relative;
    display: inline-grid;
    justify-items: center;
    gap: 0.25rem;
  }
  .warn {
    --c: var(--vbm-gold);
  }
  .bad {
    --c: var(--vbm-blood);
  }
  svg {
    overflow: visible;
  }
  line {
    stroke: var(--vbm-line-bright);
    stroke-width: 1;
  }
  line.lit {
    stroke: var(--c);
  }
  circle {
    fill: none;
    stroke-width: 5;
  }
  .track {
    stroke: var(--vbm-obsidian-3);
  }
  .fill {
    stroke: var(--c);
    transition: stroke-dasharray 0.6s ease;
  }
  .eye {
    fill: none;
    stroke: var(--c);
    stroke-width: 0.8;
    opacity: 0.5;
  }
  .value {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: grid;
    place-items: center;
    font-family: var(--vbm-font-mono);
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--vbm-text);
    pointer-events: none;
  }
  .label {
    font-family: var(--vbm-font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--vbm-muted);
    text-align: center;
  }
</style>
