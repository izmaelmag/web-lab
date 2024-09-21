<script lang="ts">
  import type { BooleanControl } from '$lib/types/controls';
  import { Switch, CheckboxGroup, Checkbox } from '@svelteuidev/core';

  export let onChange: (patch: Record<string, boolean>) => void;

  export let control: BooleanControl;
  $: control;

  let value: boolean = control.defaultValue;
  $: value;

  const patchParam = () => {
    value = !value;

    onChange({
      [control.key]: value
    });
  };
</script>

<div class="container">
  <Checkbox
    color="orange"
    size="xs"
    on:change={patchParam}
    checked={value}
    label={control.description}
  />
</div>

<style>
  .container {
    margin-top: 8px;

    & .svelteui-Checkbox-label {
      font-weight: 300;
      color: var(--cool-gray-600);
      user-select: none;
    }

    &:hover {
      & .svelteui-Checkbox-label {
        color: var(--cool-gray-900);
      }
    }
  }
</style>
