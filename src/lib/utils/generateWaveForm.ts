import type { SineProps } from '$lib/components/Oscillograph/Sine';

// Function to generate the waveform array
export function generateWaveform(sineWaves: SineProps[], isCos = false) {
  const waveArray = new Array(sineWaves.length);

  for (let i = 0; i < sineWaves.length; i++) {
    // Sum the contributions of each sine wave at time t
    let sampleValue = 0;
    for (const { amplitude, frequency, phase } of sineWaves) {
      const phi = 2 * Math.PI * frequency + phase;
      const val = isCos ? Math.cos(phi) : Math.sin(phi);
      sampleValue += amplitude * val;
    }

    // Store the sample value in the array
    waveArray[i] = sampleValue;
  }

  return waveArray;
}
