import path from 'node:path';
import type { Framework, PackageManager } from '../types.js';
import { copyTemplate, pathExists } from '../lib/fs.js';
import { clientTemplatesDir } from '../lib/paths.js';

export interface ScaffoldClientOptions {
  targetDir: string;
  clientName: string;
  projectName: string;
  npmName: string;
  framework: Framework;
  clientPort: number;
  /** Absolute https URL of the API, used as the dev-server proxy target. */
  apiUrl: string;
  packageManager: PackageManager;
}

export interface ScaffoldClientResult {
  clientDir: string;
}

/** Copies the bundled SPA template and resolves its tokens. */
export async function scaffoldClient(options: ScaffoldClientOptions): Promise<ScaffoldClientResult> {
  const clientDir = path.join(options.targetDir, 'src', options.clientName);
  const frameworkTemplate = path.join(clientTemplatesDir, options.framework);

  if (!(await pathExists(frameworkTemplate))) {
    throw new Error(`No SPA template ships with this CLI for "${options.framework}".`);
  }

  const tokens = {
    PROJECT_NAME: options.projectName,
    NPM_NAME: options.npmName,
    CLIENT_PORT: String(options.clientPort),
    API_URL: options.apiUrl,
    PACKAGE_MANAGER: options.packageManager,
  };

  // `_shared` first so a framework template can override any of its files.
  await copyTemplate(path.join(clientTemplatesDir, '_shared'), clientDir, { tokens });
  await copyTemplate(frameworkTemplate, clientDir, { tokens });

  return { clientDir };
}
