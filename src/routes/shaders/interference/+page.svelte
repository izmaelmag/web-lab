<script lang="ts">
  import { onMount } from 'svelte';
</script>

<iframe
  src="/glsl/interference/index.html"
  title="interference"
  class="fullscreen"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
/>

<style>
  .fullscreen {
    width: 100vw;
    height: 100vh;
    border: none;
    position: fixed;
    top: 0;
    left: 0;
  }
</style>
