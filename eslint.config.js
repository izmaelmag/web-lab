import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  {
    ignores: ['static/**', 'build/**', '.svelte-kit/**']
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig
      }
    }
  },
  {
    rules: {
      // Handmade sketch pages use static internal links and keyed animation loops.
      'svelte/no-navigation-without-resolve': 'off',
      'svelte/require-each-key': 'off',
      'svelte/no-at-html-tags': 'off',
      'svelte/no-dom-manipulating': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off'
    }
  }
);
