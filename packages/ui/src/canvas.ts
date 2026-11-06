/** Shared canvas plumbing: DPR-aware sizing via ResizeObserver. */
export function observeCanvas(
  canvas: HTMLCanvasElement,
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  let width = 0;
  let height = 0;
  const render = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, width, height);
  };
  const ro = new ResizeObserver(render);
  ro.observe(canvas);
  render();
  return () => ro.disconnect();
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export const GLOW = {
  violet: { main: '#a774ff', deep: '#5b2bc4', rgb: '167,116,255' },
  ember: { main: '#ff8a3d', deep: '#c2410c', rgb: '255,138,61' },
  teal: { main: '#3ff0d2', deep: '#0f8f7d', rgb: '63,240,210' }
} as const;

export type GlowName = keyof typeof GLOW;

/** Arcane colour map: void → violet → ember → pale gold. t in 0..1. */
export function arcaneColor(t: number): [number, number, number] {
  const stops: [number, number, number, number][] = [
    [0, 5, 4, 10],
    [0.3, 60, 20, 120],
    [0.55, 167, 116, 255],
    [0.75, 255, 120, 60],
    [0.9, 255, 200, 110],
    [1, 255, 250, 225]
  ];
  const x = Math.min(1, Math.max(0, t));
  for (let i = 1; i < stops.length; i++) {
    if (x <= stops[i][0]) {
      const [p0, r0, g0, b0] = stops[i - 1];
      const [p1, r1, g1, b1] = stops[i];
      const f = (x - p0) / (p1 - p0);
      return [r0 + (r1 - r0) * f, g0 + (g1 - g0) * f, b0 + (b1 - b0) * f];
    }
  }
  return [255, 250, 225];
}
