<script>
  import Header from '$lib/components/Header.svelte';
  import Layout from '$lib/components/Layout.svelte';
</script>

<Layout>
  <Header links={[{ title: 'Drafts' }]} />

  <nav>
    <h2>Processing</h2>
    <a href="/draft/daily-1">Daily #1</a>
    <a href="/draft/daily-2">Daily #2</a>
    <a href="/draft/daily-3">Daily #3</a>
    <a href="/draft/spirograph">Spirograph</a>

    <h2>Libraries demos</h2>
    <a href="/draft/glsl-base">2D GLSL</a>
    <a href="/draft/loop_demo">P5 Loop</a>
    <a href="/draft/three-test">Three.js</a>

    <h2>Ui</h2>
    <a href="/draft/oscillators">Oscillators</a>

    <h2>Data</h2>
    <a href="/draft/idb-test">IDB Test</a>
  </nav>
</Layout>

<style>
  nav {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  a {
    color: var(--blue-gray-600);
    text-decoration: none;
    font-size: 24px;
    line-height: 1;
    font-weight: 900;

    &:hover {
      color: var(--orange-600);
    }
  }

  h2 {
    font-size: 32px;
    font-weight: 900;
    margin: 24px 0 8px;
    color: var(--orange-600);
  }
</style>
