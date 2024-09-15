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
		defaultValue: 0.5,
		placeholder: 'Rain Speed',
		icon: 'FastForward'
	};

	const densityControl: NumberControl = {
		name: 'Density',
		order: 3,
		group: 'Options',
		key: 'u_density',
		type: 'number',
		min: 5.0,
		max: 50.0,
		step: 1.0,
		defaultValue: 20.0,
		placeholder: 'Particle Density',
		icon: 'Grid'
	};

	const brightnessControl: NumberControl = {
		name: 'Brightness',
		order: 4,
		group: 'Options',
		key: 'u_brightness',
		type: 'number',
		min: 0.1,
		max: 1.0,
		step: 0.1,
		defaultValue: 0.4,
		placeholder: 'Brightness',
		icon: 'Sun'
	};

	let controlsData: ControlsData = {
		u_time: 0,
		u_speed: 0.5,
		u_density: 20.0,
		u_brightness: 0.4
	};

	const controlsConfig: ControlsConfig = {
		groups: ['Options'],
		nodes: { speedControl, densityControl, brightnessControl },
		defaults: controlsData
	};

	let editableFragmentShader = `
precision highp float;

uniform float u_time;
uniform float u_speed;
uniform float u_density;
uniform float u_brightness;

// Function to generate a pseudo-random value
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Function to create a smooth streak
vec3 createStreak(vec2 uv, float seed) {
    float speed = (random(vec2(seed, 1.0)) * 0.5 + 0.5) * u_speed;
    float t = fract(u_time * speed + seed);
    float length = 0.2 + random(vec2(seed, 2.0)) * 0.3;
    
    float fade = smoothstep(0.0, 0.1, t) * smoothstep(1.0, 0.9, t);
    float brightness = smoothstep(length, 0.0, fract(uv.y - t)) * fade;
    brightness = pow(brightness, 1.5); // Sharpen the streak
    
    vec3 color = mix(
        vec3(0.2, 0.4, 1.0), // Light blue
        vec3(0.8, 0.9, 1.0), // White-blue
        random(vec2(seed, 3.0))
    );
    
    // Add some pink/purple hues
    color = mix(color, vec3(1.0, 0.3, 0.7), random(vec2(seed, 4.0)) * 0.3);
    
    return color * brightness * u_brightness;
}

void main() {
    vec2 uv = gl_FragCoord.xy / vec2(512.0, 512.0);
    
    // Create curved bottom effect
    float curve = 0.3 * pow(abs(uv.x - 0.5) * 2.0, 2.0);
    uv.y += curve;
    
    vec3 finalColor = vec3(0.0, 0.0, 0.1); // Dark blue background
    
    for (float i = 0.0; i < 100.0; i++) {
        if (i >= u_density) break;
        
        float seed = random(vec2(i, 0.0));
        float xPos = fract(seed * 1.61803); // Golden ratio for better distribution
        3
        vec2 streakUV = uv - vec2(xPos, 0.0);
        finalColor += createStreak(streakUV, seed);
    }
    
    // Add some glow
    finalColor += pow(finalColor, vec3(2.0)) * 0.4;
    
    // Gamma correction for smoother gradients
    finalColor = pow(finalColor, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(finalColor, 1.0);
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
	let totalFrames = 600; // 10 seconds at 60 fps
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
