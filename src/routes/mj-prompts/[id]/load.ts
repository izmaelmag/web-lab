import type { Load } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const load: Load = async ({ params }) => {
  if (params.id === 'undefined') throw error(404, 'Prompt id is not defined');

  const id = Number(params.id);

  if (id < 0 || isNaN(id)) throw error(404, 'Id must be a positive integer');

  return {
    id: id || 0
  };
};
