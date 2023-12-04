<script lang="ts">
	import { Group, ActionIcon, Divider } from '@svelteuidev/core';
	import { Play, Pause, Stop, Loop } from 'radix-icons-svelte';

	let playing: boolean = false;
	$: playing;

	const onPlay = () => {
		playing = true;
	};

	const onPause = () => {
		playing = false;
	};
</script>

<Divider label="Player" labelPosition="center" />

<Group position="center" spacing="xs">
	<ActionIcon color="orange" size="sm" variant="outline" disabled={playing}>
		<Play on:click={onPlay} />
	</ActionIcon>

	<ActionIcon disabled={!playing} color="orange" size="sm" variant="outline">
		<Pause on:click={onPause} />
	</ActionIcon>

	<ActionIcon disabled={!playing} color="orange" size="sm" variant="outline">
		<Stop />
	</ActionIcon>

	<ActionIcon color="orange" size="sm" variant="outline">
		<Loop />
	</ActionIcon>
</Group>
