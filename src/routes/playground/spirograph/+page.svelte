<script lang="ts">
  import P5 from 'p5-svelte';
  import { Spirograph, defaultParams, type Params as SketchParams } from './spirograph';
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

  const spirograph = new Spirograph({
    settings: {
      w: 480,
      h: 480,
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
    spirograph.setParams({ ...defaultParams, ...params });
  };
</script>

<Layout>
  <Header links={[{ title: 'Playground', url: '/playground' }, { title: 'Spirograph' }]} />
  <Playground>
    <div slot="sidebar">
      <Player
        onPlay={() => spirograph.play()}
        onPause={() => spirograph.pause()}
        onReset={() => spirograph.reset()}
        onSkip={() => spirograph.setFrame(spirograph.totalFrames)}
        onRecord={() => spirograph.record()}
        onChange={(currentFrame) => spirograph.setFrame(currentFrame)}
        {currentFrame}
        {isPlaying}
        {isRecording}
        totalFrames={spirograph.totalFrames}
      />
      <Controls onChange={handleControlsChange} config={controls.config} />
    </div>

    <div slot="content">
      {#if spirograph}
        <P5 sketch={spirograph.render} />
      {/if}
    </div>
  </Playground>
</Layout>
