<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Layout from '$lib/components/Layout.svelte';
  import Header from '$lib/components/Header.svelte';
  import Playground from '$lib/components/Playground.svelte';
  import GLSLExperiment from '$lib/components/GLSLExperiment.svelte';
  import Controls from '$lib/components/Controls/Controls.svelte';
  import type { ControlsConfig, ControlsData } from '$lib/types/controls';
  import shader from '$lib/shaders/magic-sparkles.glsl?raw';

  let controlsData: ControlsData = {
    u_time: 0
  };

  let editableFragmentShader = shader;
  let glslExperimentKey = 0;

  const controlsConfig: ControlsConfig = {
    groups: ['Options'],
    nodes: {},
    defaults: controlsData
  };

  const handleControlsChange = (newData: ControlsData) => {
    controlsData = { ...controlsData, ...newData };
  };

  const applyShaderChanges = () => {
    glslExperimentKey += 1;
    localStorage.setItem('savedShader', editableFragmentShader);
  };

  let glslExperiment: GLSLExperiment;
  let animationFrameId: number;

  let lastTime = performance.now();
  const targetFPS = 30; // Reduce update frequency
  const frameInterval = 1000 / targetFPS;

  function animateShader(currentTime: number) {
    const deltaTime = currentTime - lastTime;

    if (deltaTime > frameInterval) {
      controlsData.u_time = Number(controlsData.u_time) + deltaTime / 1000;
      lastTime = currentTime;
    }

    animationFrameId = requestAnimationFrame(animateShader);
  }

  onMount(() => {
    const savedShader = localStorage.getItem('savedShader');

    if (savedShader) {
      editableFragmentShader = savedShader;
      glslExperimentKey += 1;
    }

    // Start animation loop
    animationFrameId = requestAnimationFrame(animateShader);
  });

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (glslExperiment) {
      glslExperiment.destroy();
    }
  });

  const handleGLSLExperimentMount = (component: GLSLExperiment) => {
    glslExperiment = component;
  };
</script>

<Layout>
  <Header links={[{ title: 'Playground', url: '/playground' }, { title: 'GLSL Base' }]} />

  <Playground>
    <div slot="sidebar">
      <textarea bind:value={editableFragmentShader} rows="30" cols="40" />

      <button on:click={applyShaderChanges}>Apply Changes</button>

      <Controls onChange={handleControlsChange} config={controlsConfig} />
    </div>

    <div slot="content">
      {#key glslExperimentKey}
        <GLSLExperiment
          controls={controlsData}
          fragmentShader={editableFragmentShader}
          on:mount={({ detail }) => handleGLSLExperimentMount(detail)}
        />
      {/key}
    </div>
  </Playground>
</Layout>

<style>
  textarea {
    width: 100%;
    font-family: monospace;
    margin-bottom: 10px;
  }

  button {
    width: 100%;
    padding: 10px;
    margin-bottom: 20px;
    background-color: #4caf50;
    color: white;
    border: none;
    cursor: pointer;
  }

  button:hover {
    background-color: #45a049;
  }
</style>
