import type { SineProps } from '$lib/components/Oscillograph/Sine';

type Params = {
	iterations: number;
	baseFrequency: number;
};

export const squareSines = ({ iterations = 6, baseFrequency = 4 }: Params): SineProps[] => {
	const output: SineProps[] = [];

	for (let n = 1; n <= iterations; n++) {
		const harmonic = 2 * n - 1;
		const amplitude = 1 / harmonic;
		const frequency = baseFrequency * harmonic;

		output.push({ amplitude, frequency, phase: 0 });
	}

	return output;
};
