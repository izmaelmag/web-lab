<script lang="ts">
  import Layout from '$lib/components/Layout.svelte';
  import Header from '$lib/components/Header.svelte';
  import Playground from '$lib/components/Playground.svelte';
  import Oscillograph from '$lib/components/Oscillograph/Oscillograph.svelte';
  import { squareSines } from '$lib/utils/squareSines';
  import type { SineProps } from '$lib/components/Oscillograph/Sine';
  import { onMount } from 'svelte';

  // const sines = squareSines({ iterations: 4, baseFrequency: 4 });

  const sines: SineProps[] = [
    {
      amplitude: 1,
      frequency: 64,
      phase: 0,
      phaseSpeed: 1
    },

    // {
    // 	amplitude: 1,
    // 	frequency: 24,
    // 	phase: 0,
    // 	phaseSpeed: 0
    // },

    // {
    // 	amplitude: 1,
    // 	frequency: 2,
    // 	phase: 1,
    // 	phaseSpeed: 1
    // },

    {
      amplitude: 2,
      frequency: 0.5,
      phase: 0,
      phaseSpeed: 1
    }
  ];
</script>

<Layout>
  <Header links={[{ title: 'Playground', url: '/playground' }, { title: 'Oscillators' }]} />

  <Playground>
    <div slot="content">
      <div class="plate">
        <div class="plateBar">Oscillator</div>

        <Oscillograph {sines} params={{ animated: true, fade: false }} size={[420, 128]} />

        {#each sines as sine}
          <Oscillograph sines={[sine]} params={{ animated: true, fade: false }} size={[420, 64]} />
        {/each}
      </div>
    </div>
  </Playground>
</Layout>

<style>
  .plate {
    padding: 4px 4px 8px;
    background: var(--blue-gray-200);
    border: 0.5px solid var(--blue-gray-500);
  }

  .plateBar {
    background: var(--blue-gray-300);
    padding: 2px 4px;
    font-size: 8px;
    margin-bottom: 4px;
    font-weight: 300;
    color: var(--blue-gray-900);
    font-smooth: never;
    border: 0.5px solid var(--blue-gray-400);
  }
  /* 
	.sines {
		margin-top: 8px;
	}

	.sineData {
		background: #fff;
		padding: 2px;
		border-bottom: 0.5px solid var(--blue-gray-500);
		font-size: 8px;
		font-weight: 300;
		color: var(--blue-gray-800);
	} */
</style>
