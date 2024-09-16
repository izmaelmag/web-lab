<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import Header from '$lib/components/Header.svelte';
	import Playground from '$lib/components/Playground.svelte';
	import GLSLExperiment from '$lib/components/GLSLExperiment.svelte';
	import Controls from '$lib/components/Controls/Controls.svelte';
	import type { NumberControl, ControlsConfig, ControlsData } from '$lib/types/controls';
	import Player from '$lib/components/Player.svelte';
	import fragmentShaderSource from '$lib/shaders/fragmentShader.glsl?raw';

	const speedControl: NumberControl = {
		name: 'Speed',
		order: 2,
		group: 'Options',
		key: 'u_speed',
		type: 'number',
		min: 0.1,
		max: 2.0,
		step: 0.1,
		defaultValue: 2.0,
		placeholder: 'Rain Speed',
		icon: 'Play'
	};

	const densityControl: NumberControl = {
		name: 'Swirl',
		order: 3,
		group: 'Options',
		key: 'u_swirl',
		type: 'number',
		min: 5.0,
		max: 150.0,
		step: 1.0,
		defaultValue: 35.0,
		placeholder: 'Particle Density',
		icon: 'Grid'
	};

	let controlsData: ControlsData = {
		u_time: 0,
		u_speed: 0.5,
		u_swirl: 20.0,
		u_colorShift: 0.4
	};

	const controlsConfig: ControlsConfig = {
		groups: ['Options'],
		nodes: { speedControl, densityControl },
		defaults: controlsData
	};

	const handleControlsChange = (newData: ControlsData) => {
		controlsData = { ...controlsData, ...newData };
	};

	let editableFragmentShader = fragmentShaderSource;
	let glslExperimentKey = 0;

	const applyShaderChanges = () => {
		glslExperimentKey += 1;
		localStorage.setItem('savedShader', editableFragmentShader);
	};

	onMount(() => {
		const savedShader = localStorage.getItem('savedShader');
		if (savedShader) {
			editableFragmentShader = savedShader;
			glslExperimentKey += 1;
		}
	});

	let currentFrame = 0;
	let totalFrames = 1800; // 10 seconds at 60 fps
	let isPlaying = false;
	let isRecording = false;

	const onRecord = () => {
		isRecording = !isRecording;
	};

	const onPlay = () => {
		if (isPlaying) return; // Prevent multiple animations from starting
		isPlaying = true;
		let lastTime = performance.now();
		const animate = (currentTime: number) => {
			if (!isPlaying) return;
			const deltaTime = (currentTime - lastTime) / 1000;
			controlsData.u_time = (Number(controlsData.u_time) + deltaTime * Number(controlsData.u_speed)) % (totalFrames / 60);
			currentFrame = Math.round(Number(controlsData.u_time) * 60) % totalFrames;
			lastTime = currentTime;
			requestAnimationFrame(animate);
		};
		requestAnimationFrame(animate);
	};

	const onPause = () => {
		isPlaying = false;
	};

	const onReset = () => {
		currentFrame = 0;
		controlsData.u_time = 0;
	};

	const onSkip = () => {
		currentFrame = totalFrames;
		controlsData.u_time = totalFrames / 60;
	};

	const onChange = (frame: number) => {
		currentFrame = frame;
		controlsData.u_time = frame / 60;
	};

	$: if (isPlaying && !isRecording) {
		controlsData.u_time = currentFrame / 60;
	}
</script>

<Layout>
	<Header links={[{ title: 'Playground', url: '/playground' }, { title: 'GLSL Template' }]} />

	<Playground>
		<div slot="sidebar">
			<textarea bind:value={editableFragmentShader} rows="20" cols="40"></textarea>
			<button on:click={applyShaderChanges}>Apply Shader Changes</button>
			<Controls onChange={handleControlsChange} config={controlsConfig} />
			<Player
				bind:currentFrame
				{totalFrames}
				bind:isPlaying
				bind:isRecording
				{onRecord}
				{onPlay}
				{onPause}
				{onReset}
				{onSkip}
				{onChange}
			/>
		</div>
		<div slot="content">
			{#key glslExperimentKey}
				<GLSLExperiment 
					controls={controlsData} 
					{controlsConfig} 
					fragmentShader={editableFragmentShader} 
				/>
			{/key}
		</div>
	</Playground>
</Layout>

<style>
	textarea {
		width: 100%;
		font-family: monospace;
		margin-bottom: 10px;
	}

	button {
		width: 100%;
		padding: 10px;
		margin-bottom: 20px;
		background-color: #4caf50;
		color: white;
		border: none;
		cursor: pointer;
	}

	button:hover {
		background-color: #45a049;
	}
</style>
