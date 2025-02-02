import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    // @ts-ignore
    sveltekit()
  ],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  },
  css: {
    postcss: {
      map: true
    }
  },
  ssr: {
    noExternal: ['three']
  },
  // Serve static bundle during development
  server: {
    fs: {
      allow: ['static/glsl/**']
    }
  }
});
