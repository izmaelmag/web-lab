import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';

export const GET: RequestHandler = async ({ url }) => {
  const filePath = path.join(process.cwd(), 'static', 'glsl', 'interference', 'index.js');

  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return new Response(content, {
      headers: {
        'Content-Type': 'application/javascript'
      }
    });
  } catch (e) {
    throw error(404, 'File not found');
  }
};
