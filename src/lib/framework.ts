import type { Framework } from '../types.js';

/**
 * The folder the client builds into, relative to its own project root. The Vite
 * templates emit straight into `dist`; Angular's application builder nests the
 * browser bundle under `dist/browser`.
 */
export function clientOutputDir(framework: Framework, npmName: string): string {
  switch (framework) {
    case 'vue':
    case 'react':
      return 'dist';
    case 'angular':
      return 'dist/browser';
  }
}

/** Human readable label used in output and the generated README. */
export function frameworkLabel(framework: Framework): string {
  switch (framework) {
    case 'vue':
      return 'Vue 3 + Vite';
    case 'react':
      return 'React + Vite';
    case 'angular':
      return 'Angular';
  }
}
