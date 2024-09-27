<!-- ThreeScene.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { TextureLoader, PMREMGenerator } from 'three';
  import Playground from '$lib/components/Playground.svelte';
  import Layout from '$lib/components/Layout.svelte';
  import Header from '$lib/components/Header.svelte';

  let container: HTMLDivElement;
  let cube: THREE.Mesh;
  let backgroundSphere: THREE.Mesh;

  onMount(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    // Load the texture and set it as the scene's background
    const textureLoader = new TextureLoader();
    textureLoader.load('/hdr/industrial_sunset_puresky.webp', function (texture) {
      // Create a large sphere that will act as the background
      const sphereGeometry = new THREE.SphereGeometry(500, 60, 40);
      sphereGeometry.scale(-1, 1, 1); // Invert the geometry to be visible from the inside

      const sphereMaterial = new THREE.MeshBasicMaterial({
        map: texture
      });

      backgroundSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      scene.add(backgroundSphere);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = texture; // Set the texture as the background

      const pmremGenerator = new PMREMGenerator(renderer);
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      pmremGenerator.dispose();

      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.9,
        roughness: 0,
        envMap: envMap
      });

      cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
    });

    camera.position.z = 2;

    const animate = () => {
      requestAnimationFrame(animate);

      if (cube) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      }

      if (backgroundSphere) {
        scene.rotation.y += 0.01;
        scene.rotation.x -= 0.01;
        scene.rotation.z += 0.02;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      container.removeChild(renderer.domElement);
    };
  });
</script>

<Layout>
  <Header links={[{ url: '/draft', title: 'Playground' }, { title: 'Three test' }]} />
  <Playground>
    <div slot="content">
      <div class="container" bind:this={container} />
    </div>
  </Playground>
</Layout>

<style>
  .container {
    width: 512px;
    height: 512px;
  }
</style>
