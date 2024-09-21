<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import type { PerspectiveCamera } from 'three';
  import { createNoise4D } from 'simplex-noise';
  import { CornerBottomLeft } from 'radix-icons-svelte';

  interface Cube {
    position: [number, number, number];
    noiseValue: number;
  }

  let rotation = 0;

  useTask((delta) => {
    rotation += delta;
  });

  const noise4D = createNoise4D();

  const cubes: Cube[] = [];

  for (let x = -5; x <= 5; x++) {
    for (let y = -5; y <= 5; y++) {
      for (let z = -5; z <= 5; z++) {
        cubes.push({ position: [x, y, z], noiseValue: noise4D(x / 10, y / 10, z / 10, 1) });
      }
    }
  }

  const handleCameraCreate = ({ ref }: { ref: PerspectiveCamera }) => {
    ref.lookAt(0, 0, 0);
  };
</script>

<T.PerspectiveCamera makeDefault position={[10, 10, 10]} on:create={handleCameraCreate} />

<T.DirectionalLight position={[0, 10, 10]} />

{#each cubes as cube, index}
  <T.Mesh position={cube.position} scale={1}>
    <T.BoxGeometry
      args={[
        cube.noiseValue * Math.sin(rotation),
        cube.noiseValue * Math.sin(rotation),
        cube.noiseValue * Math.sin(rotation)
      ]}
    />
    <T.MeshStandardMaterial color={'black'} />
  </T.Mesh>
{/each}
