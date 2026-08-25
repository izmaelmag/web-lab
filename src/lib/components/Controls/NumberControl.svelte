<script lang="ts">
  import { untrack } from 'svelte';
  import type { NumberControl } from '$lib/types/controls';
  import RangeSlider from '../RangeSlider.svelte';
  import { controlIcons } from './controlIcons';

  let {
    onChange,
    control
  }: {
    onChange: (patch: Record<string, number>) => void;
    control: NumberControl;
  } = $props();

  let value = $state(untrack(() => control.defaultValue));
  const ControlIcon = $derived(
    controlIcons[control.icon ?? 'RulerSquare'] ?? controlIcons.RulerSquare
  );

  const patchParam = () => {
    onChange({
      [control.key]: value
    });
  };
</script>

<div class="container">
  <label class="number-field">
    <span class="name">{control.name}</span>
    <span class="input-wrap">
      <span class="icon">
        <ControlIcon size="12" />
      </span>
      <input
        type="number"
        bind:value
        oninput={patchParam}
        placeholder={control.placeholder}
        min={control.min}
        max={control.max}
        step={control.step}
        disabled={control.disabled}
      />
    </span>
  </label>

  <div class="rangeSlider">
    <RangeSlider
      bind:value
      onChange={patchParam}
      min={control.min}
      max={control.max}
      step={control.step}
    />
  </div>
</div>

<style>
  .container {
    position: relative;
  }

  .number-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .name {
    font-size: 10px;
    font-weight: 300;
    color: var(--cool-gray-600);
  }

  .input-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--cool-gray-400);
    border-radius: 4px;
    padding: 2px 8px 2px 6px;
    background: transparent;
  }

  .icon {
    display: inline-flex;
    width: 12px;
    height: 12px;
    color: var(--brand-orange, #ff9913);
    flex-shrink: 0;
  }

  input {
    width: 100%;
    border: none;
    background: transparent;
    color: inherit;
    font-size: 11px;
    font-family: var(--font-body);
    outline: none;
  }

  input:disabled {
    opacity: 0.5;
  }

  .rangeSlider {
    width: calc(1px + 189px);
    position: absolute;
    right: 10px;
    bottom: 0;
    height: 30px;
  }
</style>
