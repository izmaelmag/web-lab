import type { SineProps } from '$lib/components/Oscillograph/Sine';

// Function to generate the waveform array
export function generateWaveform(sineWaves: Required<SineProps>[]) {
	const waveArray = new Array(sineWaves.length);

	for (let i = 0; i < sineWaves.length; i++) {
		// Sum the contributions of each sine wave at time t
		let sampleValue = 0;
		for (const { amplitude, frequency, phase } of sineWaves) {
			sampleValue += amplitude * Math.sin(2 * Math.PI * frequency + phase);
		}

		// Store the sample value in the array
		waveArray[i] = sampleValue;
	}

	return waveArray;
}
