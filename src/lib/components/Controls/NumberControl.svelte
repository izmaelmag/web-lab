<script lang="ts">
  import { NumberInput } from '@svelteuidev/core';
  import type { NumberControl } from '$lib/types/controls';
  import * as Icon from 'radix-icons-svelte';
  import RangeSlider from '../RangeSlider.svelte';

  export let onChange: (patch: Record<string, number>) => void;

  export let control: NumberControl;
  $: control;

  let value: number = control.defaultValue;
  $: value;

  const patchParam = () => {
    onChange({
      [control.key]: value
    });
  };

  // @ts-ignore
  // Required for dynamic icon selection that actually works
  const ControlIcon = control.icon ? Icon[control.icon] : Icon.RulerSquare;
</script>

<div class="container">
  <NumberInput
    bind:value
    on:input={patchParam}
    label={control.name}
    placeholder={control.placeholder}
    defaultValue={control.defaultValue}
    min={control.min}
    max={control.max}
    step={control.step}
    stepHoldDelay={200}
    stepHoldInterval={50}
    disabled={control.disabled}
    color="orange"
    icon={ControlIcon}
    hideControls
    size="xs"
  />

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

  .rangeSlider {
    width: calc(1px + 189px);
    position: absolute;
    right: 10px;
    bottom: 0;

    height: 30px;
  }
</style>
