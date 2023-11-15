<script lang="ts">
	import { DemoResume } from './mock';
	let link: string = '';
	$: link;

	const generate = async () => {
		const response = await fetch('api/resume-pdf', {
			method: 'POST',
			body: JSON.stringify({ document: DemoResume }),
			headers: {
				'Content-Type': 'application/json'
			}
		});

		const data = (await response.json()) as { url?: string };

		if (data.url) {
			link = data.url;
		}
	};
</script>

<button on:click={generate} type="button">Generate</button>

{#if link}
	<a href={link}>Link to the document</a>
{/if}
