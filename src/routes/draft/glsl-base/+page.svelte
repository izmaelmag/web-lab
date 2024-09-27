<script lang="ts">
  import { onMount } from 'svelte';
  import Layout from '$lib/components/Layout.svelte';
  import Header from '$lib/components/Header.svelte';
  import Playground from '$lib/components/Playground.svelte';
  import GLSLExperiment from '$lib/components/GLSLExperiment.svelte';
  import Controls from '$lib/components/Controls/Controls.svelte';
  import type { ControlsConfig, ControlsData } from '$lib/types/controls';
  import shader from '$lib/shaders/color-wheel.glsl?raw';

  let controlsData: ControlsData = {};

  let editableFragmentShader = shader;
  let glslExperimentKey = 0;

  const controlsConfig: ControlsConfig = {
    groups: ['Options'],
    nodes: {},
    defaults: controlsData
  };

  let glslExperiment: GLSLExperiment;

  const handleControlsChange = (newData: ControlsData) => {
    controlsData = { ...controlsData, ...newData };
    if (glslExperiment) {
      glslExperiment.update(controlsData);
    }
  };

  const applyShaderChanges = () => {
    glslExperimentKey += 1;
    localStorage.setItem('savedShader', editableFragmentShader);
  };

  onMount(() => {
    const savedShader = localStorage.getItem('savedShader');
    if (savedShader) {
      editableFragmentShader = savedShader;
      glslExperimentKey += 1;
    }
  });

  const handleGLSLExperimentMount = (event: CustomEvent) => {
    glslExperiment = event.detail;
  };
</script>

<Layout>
  <Header links={[{ title: 'Playground', url: '/draft' }, { title: 'GLSL Base' }]} />

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
          on:mount={handleGLSLExperimentMount}
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
