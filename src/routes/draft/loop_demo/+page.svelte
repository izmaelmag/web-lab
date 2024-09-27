<script lang="ts">
  import P5 from 'p5-svelte';
  import { loop_demo } from './loop_demo';
  import Layout from '$lib/components/Layout.svelte';
  import Header from '$lib/components/Header.svelte';
</script>

<Layout>
  <Header links={[{ title: 'Playground', url: '/draft' }, { title: 'Loop demo' }]} />
  <P5 sketch={loop_demo} />
</Layout>
