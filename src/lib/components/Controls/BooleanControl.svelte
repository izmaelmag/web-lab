<script lang="ts">
  import { untrack } from 'svelte';
  import type { BooleanControl } from '$lib/types/controls';

  let {
    onChange,
    control
  }: {
    onChange: (patch: Record<string, boolean>) => void;
    control: BooleanControl;
  } = $props();

  let value = $state(untrack(() => control.defaultValue));

  const patchParam = () => {
    value = !value;

    onChange({
      [control.key]: value
    });
  };
</script>

<div class="container">
  <label class="checkbox">
    <input type="checkbox" checked={value} onchange={patchParam} />
    <span class="label">{control.description}</span>
  </label>
</div>

<style>
  .container {
    margin-top: 8px;
  }

  .checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .checkbox input {
    accent-color: var(--brand-orange, #ff9913);
    width: 12px;
    height: 12px;
    margin: 0;
  }

  .label {
    font-weight: 300;
    font-size: 12px;
    color: var(--cool-gray-600);
    user-select: none;
  }

  .checkbox:hover .label {
    color: var(--cool-gray-900);
  }
</style>
