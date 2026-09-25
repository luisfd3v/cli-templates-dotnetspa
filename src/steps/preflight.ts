import * as p from '@clack/prompts';
import { REQUIRED_DOTNET_MAJOR, readDotnetVersion } from '../lib/dotnet.js';
import { ensureDir, isEmptyDirectory, pathExists } from '../lib/fs.js';
import { abort, log } from '../lib/log.js';

export interface PreflightOptions {
  targetDir: string;
  force: boolean;
  yes: boolean;
}

/**
 * Fails fast on everything that would otherwise produce a confusing error deep
 * inside `dotnet new`.
 */
export async function preflight(options: PreflightOptions): Promise<void> {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (!Number.isFinite(nodeMajor) || nodeMajor < 20) {
    abort(`Node.js 20 or newer is required (found ${process.versions.node}).`);
  }

  const dotnet = await readDotnetVersion();
  if (dotnet.major < REQUIRED_DOTNET_MAJOR) {
    abort(
      `The .NET ${REQUIRED_DOTNET_MAJOR} SDK is required, but ${dotnet.raw} was found.\n` +
        'Install it from https://get.dot.net/10 and try again.',
    );
  }

  if (!(await pathExists(options.targetDir))) {
    await ensureDir(options.targetDir);
    return;
  }

  if (await isEmptyDirectory(options.targetDir)) {
    return;
  }

  if (options.force) {
    log.warn(`${options.targetDir} is not empty. Continuing because --force was passed.`);
    return;
  }

  if (options.yes) {
    abort(`${options.targetDir} already exists and is not empty. Pass --force to use it anyway.`);
  }

  const proceed = await p.confirm({
    message: `${options.targetDir} is not empty. Continue anyway?`,
    initialValue: false,
  });

  if (p.isCancel(proceed) || !proceed) {
    abort('Operation cancelled.');
  }
}
