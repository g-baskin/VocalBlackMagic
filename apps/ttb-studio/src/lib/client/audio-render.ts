// Tone.Offline temporarily changes Tone's shared context. Keep independent editors
// from overlapping that context or allocating two full-song buffers at once.
let rendering = false;
export async function withAudioRender<T>(work: () => Promise<T>): Promise<T> {
  if (rendering)
    throw Error('Another audio preview is rendering. Wait for it to finish, then retry.');
  rendering = true;
  try {
    return await work();
  } finally {
    rendering = false;
  }
}
