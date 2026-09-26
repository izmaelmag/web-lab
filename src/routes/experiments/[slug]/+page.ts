import { error } from '@sveltejs/kit';
import { experiments, findExperiment } from '$lib/experiments/catalog';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => experiments.map(({ slug }) => ({ slug }));

export const load: PageLoad = ({ params }) => {
  const experiment = findExperiment(params.slug);
  if (!experiment) error(404, 'Not in the archive');

  const index = experiments.indexOf(experiment);
  return {
    experiment,
    previous: experiments[index - 1],
    next: experiments[index + 1]
  };
};
