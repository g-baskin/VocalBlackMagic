<script lang="ts" module>
  /** One choice in the picker: a routed model or a legacy single-provider engine. */
  export interface PickerItem {
    value: string;
    name: string;
    group: 'open' | 'hosted';
    /** First ready runner (shown as a badge) or null. */
    runner: string | null;
    license: string;
    commercial: boolean;
    detail: string;
    /** Why it cannot run now, or null. */
    reason: string | null;
    disabled: boolean;
  }
</script>

<script lang="ts">
  let { items, value = $bindable('') }: { items: PickerItem[]; value: string } = $props();

  const groups = $derived([
    {
      id: 'open',
      title: 'Open models (self-hostable)',
      list: items.filter((i) => i.group === 'open')
    },
    { id: 'hosted', title: 'Hosted', list: items.filter((i) => i.group === 'hosted') }
  ]);
  const runnerNames: Record<string, string> = {
    engine: 'Self-hosted engine',
    fal: 'fal',
    minimax: 'MiniMax API',
    elevenlabs: 'ElevenLabs API',
    gemini: 'Gemini API',
    replicate: 'Replicate'
  };
</script>

<div class="picker">
  {#each groups as group (group.id)}
    <fieldset>
      <legend class="group">{group.title}</legend>
      <ul>
        {#each group.list as item (item.value)}
          <li>
            <label class:on={value === item.value} class:off={item.disabled}>
              <input
                type="radio"
                name="model"
                value={item.value}
                bind:group={value}
                disabled={item.disabled}
              />
              <span class="head">
                <span class="name">{item.name}</span>
                <span class="badges">
                  {#if item.runner}<span class="badge run"
                      >{runnerNames[item.runner] ?? item.runner}</span
                    >{/if}
                  <span class="badge" class:nc={!item.commercial}
                    >{item.commercial ? item.license : 'Non-commercial'}</span
                  >
                </span>
              </span>
              <span class="detail">{item.detail}</span>
              {#if item.reason}<span class="reason">{item.reason}</span>{/if}
            </label>
          </li>
        {/each}
      </ul>
    </fieldset>
  {/each}
</div>

<style>
  .picker {
    display: grid;
    gap: 0.5rem;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
    display: grid;
    gap: 0.4rem;
  }
  .group {
    padding: 0;
    margin: 0.4rem 0 0;
    font-family: var(--vbm-font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--vbm-teal);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.4rem;
  }
  label {
    display: grid;
    gap: 0.2rem;
    padding: 0.55rem 0.75rem;
    border: 1px solid var(--vbm-violet-deep);
    border-radius: 6px;
    cursor: pointer;
    background: rgba(20, 8, 36, 0.35);
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }
  label.on {
    border-color: var(--vbm-violet);
    box-shadow: 0 0 14px rgba(160, 90, 255, 0.35);
  }
  label.off {
    cursor: not-allowed;
    opacity: 0.55;
  }
  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  label:has(input:focus-visible) {
    outline: 2px solid var(--vbm-teal);
    outline-offset: 2px;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.4rem;
    align-items: baseline;
  }
  .name {
    font-family: var(--vbm-font-display);
    letter-spacing: 0.06em;
  }
  .badges {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
  }
  .badge {
    font-family: var(--vbm-font-mono);
    font-size: 0.68rem;
    padding: 0.05rem 0.45rem;
    border-radius: 999px;
    border: 1px solid var(--vbm-violet-deep);
  }
  .badge.run {
    border-color: var(--vbm-teal-deep);
    color: var(--vbm-teal);
  }
  .badge.nc {
    border-color: #c8603a;
    color: #ffb08a;
    font-weight: 600;
  }
  .detail {
    font-size: 0.82rem;
    opacity: 0.75;
  }
  .reason {
    font-size: 0.8rem;
    font-style: italic;
    color: #ffb08a;
  }
</style>
