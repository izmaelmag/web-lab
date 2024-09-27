<script lang="ts">
  import P5 from 'p5-svelte';
  import { Daily1, defaultParams, type Params as SketchParams } from './daily-1';
  import Layout from '$lib/components/Layout.svelte';
  import Header from '$lib/components/Header.svelte';
  import Controls from '$lib/components/Controls/Controls.svelte';
  import { controls } from './controls';
  import type { ControlsData } from '$lib/types/controls';
  import Player from '$lib/components/Player.svelte';
  import Playground from '$lib/components/Playground.svelte';

  let currentFrame: number;
  let isPlaying: boolean;
  let isRecording: boolean;

  const sketch = new Daily1({
    settings: {
      w: 520,
      h: 520,
      fps: 60,
      duration: 10
    },

    onTick: (settings) => {
      currentFrame = settings.currentFrame;
      isPlaying = settings.isPlaying;
      isRecording = settings.isRecording;
    },

    params: defaultParams
  });

  const handleControlsChange = (newParams: ControlsData) => {
    const params = newParams as SketchParams;
    sketch.setParams({ ...defaultParams, ...params });
  };
</script>

<Layout>
  <Header links={[{ title: 'Playground', url: '/draft' }, { title: 'Daily #1' }]} />

  <Playground>
    <div slot="sidebar">
      <Player
        onSkip={() => sketch.setFrame(sketch.totalFrames)}
        onPlay={() => sketch.play()}
        onPause={() => sketch.pause()}
        onReset={() => sketch.reset()}
        onRecord={() => sketch.record()}
        onChange={(currentFrame) => sketch.setFrame(currentFrame)}
        {currentFrame}
        {isPlaying}
        {isRecording}
        totalFrames={sketch.totalFrames}
      />
      <Controls onChange={handleControlsChange} config={controls.config} />
    </div>

    <div slot="content">
      {#if sketch}
        <P5 sketch={sketch.render} />
      {/if}
    </div>
  </Playground>
</Layout>
