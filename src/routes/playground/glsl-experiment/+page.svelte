<script lang="ts">
	import Layout from '$lib/components/Layout.svelte';
	import Header from '$lib/components/Header.svelte';
	import Playground from '$lib/components/Playground.svelte';
	import GLSLExperiment from '$lib/components/GLSLExperiment.svelte';
	import Controls from '$lib/components/Controls/Controls.svelte';
	import type { NumberControl, ControlsConfig, ControlsData } from '$lib/types/controls';
	import Player from '$lib/components/Player.svelte';

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

	let editableFragmentShader = `
precision mediump float;

uniform float u_time;
uniform float u_swirl;
uniform float u_colorShift;
uniform float u_brightness;

// Function to generate 2D Perlin-like noise
vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash(i + 0.0)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
    return dot(n, vec3(60.0));
}

void main() {
    vec2 uv = gl_FragCoord.xy / vec2(512.0, 512.0);
    uv = uv * 2.0 - 1.0;
    
    // Create swirling effect
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    float swirl = sin(radius * 10.0 - u_time * u_swirl * 0.2) * 0.1;
    uv = vec2(radius * cos(angle + swirl), radius * sin(angle + swirl));
    
    // Generate base noise
    float n = noise(uv * 3.0 + u_time * 0.1);
    n += 0.5 * noise(uv * 6.0 - u_time * 0.2);
    n += 0.25 * noise(uv * 12.0 + u_time * 0.3);
    n = n * 0.5 + 0.5;
    
    // Create color palette
    vec3 color1 = vec3(0.0, 0.0, 0.0);
    vec3 color2 = vec3(1.0, 0.0, 0.0);
    vec3 color3 = vec3(0.0, 0.0, 0.0);
    
    // Mix colors based on noise and time
    vec3 color = mix(color1, color2, n);
    color = mix(color, color3, sin(u_time * u_colorShift) * 0.0 + 0.5);
    
    // Add some stars
    float stars = step(0.98, noise(uv * 50.0));
    color += stars * vec3(1.0);
    
    gl_FragColor = vec4(color, 1.0);
}
`;

	let fragmentShader = editableFragmentShader;

	const applyShaderChanges = () => {
		fragmentShader = editableFragmentShader;
	};

	const handleControlsChange = (newControls: ControlsData) => {
		controlsData = { ...controlsData, ...newControls };
		if (typeof newControls.u_time === 'number') {
			currentFrame = Math.round(newControls.u_time * 60);
		}
	};

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
			<GLSLExperiment controls={controlsData} {controlsConfig} {fragmentShader} />
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
