/** One AudioContext + MediaElementSource per media element (createMediaElementSource may only run once). */
export interface MediaGraph {
  ctx: AudioContext;
  analyser: AnalyserNode;
}

const graphs = new WeakMap<HTMLMediaElement, MediaGraph>();

export function getMediaGraph(el: HTMLMediaElement): MediaGraph | null {
  const existing = graphs.get(el);
  if (existing) return existing;
  const Ctor =
    globalThis.AudioContext ??
    (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const source = ctx.createMediaElementSource(el);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.78;
  source.connect(analyser);
  analyser.connect(ctx.destination);
  const graph = { ctx, analyser };
  graphs.set(el, graph);
  return graph;
}
