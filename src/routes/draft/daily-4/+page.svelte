<script lang="ts">
  import Layout from '$lib/components/Layout.svelte';
  import Header from '$lib/components/Header.svelte';
  import Playground from '$lib/components/Playground.svelte';
  import { Canvas } from '@threlte/core';
  import Scene from './Scene.svelte';
</script>

<Layout>
  <Header links={[{ title: 'Playground', url: '/draft' }, { title: 'Daily #4' }]} />

  <Playground>
    {#snippet content()}
      <div class="scene">
        <Canvas>
          <Scene />
        </Canvas>
      </div>
    {/snippet}
  </Playground>
</Layout>

<style>
  .scene {
    width: 640px;
    height: 640px;
    max-width: 100%;
  }
</style>
