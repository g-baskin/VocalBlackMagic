<script lang="ts">
  let {
    value = $bindable(),
    min,
    max,
    step = 0.01,
    defaultValue = min,
    label,
    format = (v: number) => String(Math.round(v * 100) / 100),
    size = 64,
    accent = 'violet',
    bipolar = false,
    log = false,
    disabled = false,
    onbegin = () => {}
  }: {
    value: number;
    min: number;
    max: number;
    step?: number;
    defaultValue?: number;
    label: string;
    format?: (v: number) => string;
    size?: number;
    accent?: 'violet' | 'ember' | 'pink';
    bipolar?: boolean;
    /** Exponential travel (for frequencies). */
    log?: boolean;
    disabled?: boolean;
    /** Called once at the start of each gesture, before the value changes (for undo). */
    onbegin?: () => void;
  } = $props();

  const uid = $props.id();
  const sweep = 270;
  const toNorm = (v: number) =>
    log ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min);
  const fromNorm = (n: number) => {
    const c = Math.min(1, Math.max(0, n));
    const raw = log ? min * (max / min) ** c : min + c * (max - min);
    const snapped = Math.round(raw / step) * step;
    return Math.min(max, Math.max(min, Number(snapped.toFixed(6))));
  };
  const norm = $derived(Math.min(1, Math.max(0, toNorm(value))));
  const r = $derived(size / 2 - 5);
  const c = $derived(size / 2);
  const point = (n: number, radius: number) => {
    const a = ((-sweep / 2 + n * sweep - 90) * Math.PI) / 180;
    return [c + radius * Math.cos(a), c + radius * Math.sin(a)];
  };
  const arc = (from: number, to: number) => {
    if (Math.abs(to - from) < 1e-4) return '';
    const [a, b] = [Math.min(from, to), Math.max(from, to)];
    const [x1, y1] = point(a, r);
    const [x2, y2] = point(b, r);
    const large = (b - a) * sweep > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  const start = $derived(bipolar ? toNorm(0) : 0);
  const pointer = $derived.by(() => {
    const [x1, y1] = point(norm, r * 0.32);
    const [x2, y2] = point(norm, r * 0.62);
    return { x1, y1, x2, y2 };
  });

  let dragFrom: { y: number; n: number } | null = null;
  function down(e: PointerEvent) {
    if (disabled || e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLElement).focus();
    onbegin();
    dragFrom = { y: e.clientY, n: norm };
  }
  function move(e: PointerEvent) {
    if (!dragFrom) return;
    const speed = e.shiftKey ? 600 : 180;
    value = fromNorm(dragFrom.n + (dragFrom.y - e.clientY) / speed);
  }
  function up() {
    dragFrom = null;
  }
  function key(e: KeyboardEvent) {
    if (disabled) return;
    const unit = 1 / 100;
    const moves: Record<string, number> = {
      ArrowUp: unit,
      ArrowRight: unit,
      ArrowDown: -unit,
      ArrowLeft: -unit,
      PageUp: unit * 10,
      PageDown: -unit * 10
    };
    let next: number | null = null;
    if (e.key in moves) next = fromNorm(norm + moves[e.key]);
    else if (e.key === 'Home') next = min;
    else if (e.key === 'End') next = max;
    if (next === null) return;
    e.preventDefault();
    if (next !== value) {
      onbegin();
      value = next;
    }
  }
  function reset() {
    if (disabled || value === defaultValue) return;
    onbegin();
    value = defaultValue;
  }
</script>

<div class="knob" class:disabled style:--size={size + 'px'}>
  <div
    class="dial"
    role="slider"
    tabindex={disabled ? -1 : 0}
    aria-label={label}
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    aria-valuetext={format(value)}
    aria-disabled={disabled}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
    onkeydown={key}
    ondblclick={reset}
    title="Drag up or down (Shift for fine). Double-click to reset."
  >
    <svg width={size} height={size} viewBox="0 0 {size} {size}" aria-hidden="true">
      <defs>
        <linearGradient id="g-{uid}" x1="0" y1="1" x2="1" y2="0">
          {#if accent === 'ember'}
            <stop offset="0" stop-color="#ff3d1f" /><stop offset="1" stop-color="#ff7a2e" />
          {:else if accent === 'pink'}
            <stop offset="0" stop-color="#ff4fa3" /><stop offset="1" stop-color="#ff7ac0" />
          {:else}
            <stop offset="0" stop-color="#8f6bff" /><stop offset="0.7" stop-color="#c06bff" /><stop
              offset="1"
              stop-color="#ff4f6a"
            />
          {/if}
        </linearGradient>
      </defs>
      <path d={arc(0, 1)} class="track" stroke-width="5" fill="none" />
      {#if bipolar}<circle
          cx={point(start, r)[0]}
          cy={point(start, r)[1]}
          r="2.4"
          class="centre"
        />{/if}
      <path
        d={arc(start, norm)}
        stroke="url(#g-{uid})"
        stroke-width="5"
        stroke-linecap="round"
        fill="none"
      />
      <circle cx={c} cy={c} r={r * 0.72} class="cap" />
      <line {...pointer} class="pointer" stroke-width="3" stroke-linecap="round" />
    </svg>
  </div>
  <span class="label">{label}</span>
  <span class="value">{format(value)}</span>
</div>

<style>
  .knob {
    display: grid;
    justify-items: center;
    gap: 0.1rem;
    min-width: calc(var(--size) + 1rem);
  }
  .dial {
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    cursor: ns-resize;
    touch-action: none;
  }
  .dial:focus-visible {
    outline: 2px solid var(--pads-focus, #3ff0d2);
    outline-offset: 2px;
  }
  .disabled .dial {
    cursor: default;
    opacity: 0.45;
  }
  .track {
    stroke: rgb(255 255 255 / 8%);
  }
  .centre {
    fill: #ff4fa3;
  }
  .cap {
    fill: #0e1020;
    stroke: rgb(255 255 255 / 6%);
    filter: drop-shadow(0 3px 6px rgb(0 0 0 / 60%));
  }
  .pointer {
    stroke: #f4f1ff;
  }
  .label {
    font-size: 0.78rem;
    color: var(--pads-text, #ece6f7);
    margin-top: 0.2rem;
  }
  .value {
    font-family: var(--vbm-font-mono);
    font-size: 0.66rem;
    color: var(--pads-muted, #a99fc2);
  }
</style>
