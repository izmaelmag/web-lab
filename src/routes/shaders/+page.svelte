<script lang="ts">
  import Layout from '$lib/components/Layout.svelte';
  import InnerPage from '$lib/layouts/InnerPage/InnerPage.svelte';

  import { links } from '$lib/data/mainMenu.json';
  const menuItem = links.find((item) => item.id === 'shaders');
</script>

<Layout>
  {#if menuItem}
    <InnerPage title={menuItem.title} description={menuItem.description}>
      <h1>Shaders</h1>
    </InnerPage>
  {/if}
</Layout>
