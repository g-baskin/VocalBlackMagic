<script lang="ts">
  let {
    title = 'Status',
    message,
    tone = 'neutral'
  }: { title?: string; message: string; tone?: 'neutral' | 'warning' | 'success' } = $props();
</script>

<div
  class="status"
  class:warning={tone === 'warning'}
  class:success={tone === 'success'}
  role="status"
  aria-live="polite"
>
  <strong>{title}</strong>
  <p>{message}</p>
</div>

<style>
  .status {
    background: var(--panel-alt);
    border: 1px solid var(--border);
    border-radius: 0.7rem;
    padding: 1rem;
    color: var(--text);
  }
  .warning {
    border-color: #ba8a43;
  }
  .success {
    border-color: #529e80;
  }
  p {
    margin: 0.35rem 0 0;
    white-space: pre-wrap;
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.5;
  }
</style>
