import { readFileSync } from 'node:fs';
import path from 'node:path';
import { packageRoot } from './paths.js';

/** Read at runtime instead of importing JSON, which needs an import attribute. */
export function readPackageVersion(): string {
  try {
    const raw = readFileSync(path.join(packageRoot, 'package.json'), 'utf8');
    const json = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    return (JSON.parse(json) as { version?: string }).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}
