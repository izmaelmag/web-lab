<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { interactivity } from '@threlte/extras';
  import { spring } from 'svelte/motion';
  import type { PerspectiveCamera } from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

  interactivity();
  const scale = spring(1);
  let rotation = 0;

  useTask((delta) => {
    rotation += delta;
  });

  const handleCameraCreate = ({ ref }: { ref: PerspectiveCamera }) => {
    ref.lookAt(0, 0, 0);
  };

  const cubes: { size: number }[] = [];

  for (let n = 0; n < 10; n++) {
    cubes.push({
      size: 4 - ((4 - 0.2) / 9) * n
    });
  }
</script>

<T.PerspectiveCamera makeDefault position={[5, 5, 5]} on:create={handleCameraCreate} />

<T.DirectionalLight position={[0, 10, 10]} />

{#each cubes as cube, index}
  <T.Mesh
    rotation.y={(rotation * (index + 1)) / 2}
    position.y={0}
    position.x={0}
    position.z={0}
    scale={cube.size}
  >
    <T.BoxGeometry args={[1, 1, 1]} />
    <T.MeshStandardMaterial color={[index * 25]} wireframe={true} />
  </T.Mesh>
{/each}
