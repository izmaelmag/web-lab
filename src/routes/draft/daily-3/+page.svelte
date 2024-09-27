<script lang="ts">
  import Layout from '$lib/components/Layout.svelte';
  import Header from '$lib/components/Header.svelte';
  import Playground from '$lib/components/Playground.svelte';
  import { Canvas } from '@threlte/core';
  import Scene from './Scene.svelte';
</script>

<Layout>
  <Header links={[{ title: 'Playground', url: '/draft' }, { title: 'Daily #3' }]} />

  <Playground>
    <!-- <div slot="sidebar">sidebar</div> -->

    <div slot="content">
      <Canvas size={{ width: 640, height: 640 }}>
        <Scene />
      </Canvas>
    </div>
  </Playground>
</Layout>
