import path from 'node:path';
import type { SolutionFormat } from '../types.js';
import { addProjectToSolution } from '../lib/dotnet.js';
import { run } from '../lib/exec.js';
import { pathExists } from '../lib/fs.js';

export interface CreateSolutionOptions {
  targetDir: string;
  projectName: string;
  solutionFormat: SolutionFormat;
  /** Absolute paths of the projects that should be added to the solution. */
  projectFiles: string[];
}

export interface CreateSolutionResult {
  solutionFile: string;
}

/**
 * .NET 10 defaults to the XML-based `.slnx`, which is why the format is an
 * explicit option: older toolchains still expect the classic `.sln`.
 */
export async function createSolution(options: CreateSolutionOptions): Promise<CreateSolutionResult> {
  await run(
    'dotnet',
    [
      'new',
      'sln',
      '--name',
      options.projectName,
      '--format',
      options.solutionFormat,
      '--output',
      options.targetDir,
    ],
    { cwd: options.targetDir },
  );

  const solutionFile = path.join(
    options.targetDir,
    `${options.projectName}.${options.solutionFormat}`,
  );

  if (!(await pathExists(solutionFile))) {
    throw new Error(`The solution file was not created at ${solutionFile}.`);
  }

  for (const projectFile of options.projectFiles) {
    await addProjectToSolution(solutionFile, projectFile, options.targetDir);
  }

  return { solutionFile };
}
