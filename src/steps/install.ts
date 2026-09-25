import { installCommand } from '../lib/package-manager.js';
import { run } from '../lib/exec.js';
import { p } from '../lib/log.js';
import type { PackageManager } from '../types.js';

export interface InstallOptions {
  targetDir: string;
  solutionFile: string;
  clientDir: string;
  packageManager: PackageManager;
}

/**
 * Both installs stream their output into the task message, so a slow restore
 * never looks like a hang.
 */
export async function installDependencies(options: InstallOptions): Promise<void> {
  const [command, args] = installCommand(options.packageManager);

  await p.tasks([
    {
      title: 'Restoring NuGet packages',
      task: async (message) => {
        await run('dotnet', ['restore', options.solutionFile], {
          cwd: options.targetDir,
          onOutput: message,
        });
        return 'NuGet packages restored';
      },
    },
    {
      title: `Installing SPA dependencies with ${options.packageManager}`,
      task: async (message) => {
        await run(command, args, {
          cwd: options.clientDir,
          onOutput: message,
        });
        return 'SPA dependencies installed';
      },
    },
  ]);
}
