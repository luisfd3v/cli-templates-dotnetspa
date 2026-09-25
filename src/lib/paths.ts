import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Root of the published package. `dist/cli.js` and (in dev) `src/cli.ts` both
 * live one level below the package root, so `..` resolves correctly in both.
 */
export const packageRoot = fileURLToPath(new URL('..', import.meta.url));

export const templatesDir = path.join(packageRoot, 'templates');
export const clientTemplatesDir = path.join(templatesDir, 'client');
export const commonTemplatesDir = path.join(templatesDir, 'common');
