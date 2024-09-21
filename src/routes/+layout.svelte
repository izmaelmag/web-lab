<script>
  import '../app.css';
  import { SvelteUIProvider } from '@svelteuidev/core';
  import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

  import '$lib/styles/fonts.css';
  import '$lib/styles/colors.css';
  import '$lib/styles/global.css';
  import { onMount } from 'svelte';

  onMount(() => {
    injectSpeedInsights();
  });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true" />
  <link
    href="https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@100..900&amp;display=swap"
    rel="stylesheet"
  />
</svelte:head>

<SvelteUIProvider>
  <main class="app">
    <slot></slot>
  </main>
</SvelteUIProvider>

<style>
  main {
    font-family: 'Azeret Mono', monospace;
    max-height: -webkit-fill-available;
    background: var(--blue-gray-100);
  }
</style>
