<script lang="ts">
  import Layout from '$lib/components/Layout.svelte';
  import Header from '$lib/components/Header.svelte';
  import Playground from '$lib/components/Playground.svelte';
  import GLSLExperiment from '$lib/components/GLSLExperiment.svelte';
  import { Controls } from '$lib/modules/controls/Controls';
  import type { NumberControl, ControlsConfig } from '$lib/types/controls';

  const timeControl: NumberControl = {
    name: 'Time',
    order: 1,
    group: 'Options',
    key: 'u_time',
    type: 'number',
    min: 0,
    max: 10,
    step: 0.1,
    defaultValue: 0,
    placeholder: 'Time',
    icon: 'Clock'
  };

  const controlsData = {
    u_time: 0
  };

  const controlsConfig: ControlsConfig = {
    groups: ['Options'],
    nodes: { timeControl },
    defaults: controlsData
  };

  const fragmentShader = `
    precision mediump float;
    uniform float u_time;

    void main() {
      vec2 uv = gl_FragCoord.xy / vec2(512.0, 512.0);
      gl_FragColor = vec4(uv, sin(u_time) * 0.5 + 0.5, 1.0);
    }
  `;
</script>

<Layout>
  <Header links={[{ title: 'Playground', url: '/playground' }, { title: 'GLSL Template' }]} />

  <Playground>
    <div slot="content">
      <GLSLExperiment controls={controlsData} controlsConfig={controlsConfig} {fragmentShader} />
    </div>
  </Playground>
</Layout>
