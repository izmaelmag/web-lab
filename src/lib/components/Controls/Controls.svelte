<script lang="ts">
  import { untrack } from 'svelte';
  import { writable } from 'svelte/store';
  import Divider from '$lib/components/ui/Divider.svelte';
  import type { AnyControl, ControlsConfig, ControlsData } from '$lib/types/controls';
  import NumberControl from './NumberControl.svelte';
  import BooleanControl from './BooleanControl.svelte';

  let {
    onChange,
    config
  }: {
    onChange: (params: ControlsData) => void;
    config: ControlsConfig;
  } = $props();

  const paramsState = writable(untrack(() => config.defaults));

  paramsState.subscribe((newState) => {
    onChange(newState);
  });

  const groupedNodes: Record<string, AnyControl[]> = untrack(() =>
    config.groups.reduce(
      (result, group) => {
        return {
          ...result,
          [group]: Object.values(config.nodes).filter(
            (node): node is AnyControl => !Array.isArray(node) && node.group === group
          )
        };
      },
      {} as Record<string, AnyControl[]>
    )
  );

  const handleParamPatch = (patch: ControlsData) => {
    paramsState.update((state) => ({
      ...state,
      ...patch
    }));
  };
</script>

<div class="controls">
  <div class="nodes">
    {#each config.groups as groupName}
      <div class="nodeGroup">
        <div class="nodeGroupTitle">
          <Divider label={groupName} />
        </div>

        <div class="nodeGroupControls">
          {#each groupedNodes[groupName] as control}
            {#if control.type === 'number'}
              <NumberControl onChange={handleParamPatch} {control} />
            {/if}

            {#if control.type === 'boolean'}
              <BooleanControl onChange={handleParamPatch} {control} />
            {/if}
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .controls {
    display: flex;
    flex-direction: column;
  }

  .nodeGroupControls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .nodeGroupTitle {
    margin-bottom: 0;
  }
</style>
