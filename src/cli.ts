import { Command, Option } from 'commander';
import { runCreate, type CreateArgs } from './index.js';
import { validateProjectName } from './lib/names.js';
import { abort } from './lib/log.js';
import { readPackageVersion } from './lib/version.js';
import {
  API_STYLES,
  COUPLINGS,
  FRAMEWORKS,
  PACKAGE_MANAGERS,
  SOLUTION_FORMATS,
  isApiStyle,
  isCoupling,
  isFramework,
  isPackageManager,
  isSolutionFormat,
} from './types.js';

interface RawOptions {
  name?: unknown;
  framework?: unknown;
  coupling?: unknown;
  api?: unknown;
  pm?: unknown;
  sln?: unknown;
  scalar: boolean;
  install: boolean;
  yes: boolean;
  force: boolean;
}

/** Commander already enforces the choices; this narrows the types for us. */
function pick<T extends string>(
  value: unknown,
  guard: (candidate: string) => candidate is T,
): T | undefined {
  return typeof value === 'string' && guard(value) ? value : undefined;
}

const program = new Command();

program
  .name('create-dotnetspa')
  .description('Scaffold a .NET 10 + SPA solution (React, Vue or Angular).')
  .version(readPackageVersion())
  .argument('[directory]', 'where to create the project (defaults to ./<project-name>)')
  .option('--name <name>', 'project name, used for the solution and the .API/.Client projects')
  .addOption(new Option('-f, --framework <framework>', 'SPA framework').choices([...FRAMEWORKS]))
  .addOption(
    new Option('-c, --coupling <coupling>', 'how the API and the SPA are combined').choices([
      ...COUPLINGS,
    ]),
  )
  .addOption(new Option('-a, --api <style>', 'API style').choices([...API_STYLES]))
  .addOption(
    new Option('-p, --pm <manager>', 'package manager for the SPA').choices([...PACKAGE_MANAGERS]),
  )
  .addOption(
    new Option('--sln <format>', 'solution file format')
      .choices([...SOLUTION_FORMATS])
      .default('slnx'),
  )
  .option('--no-scalar', 'do not add the Scalar API reference UI')
  .option('--no-install', 'skip the NuGet restore and the SPA dependency install')
  .option('-y, --yes', 'use defaults and ask nothing (for CI)', false)
  .option('--force', 'scaffold into a directory that is not empty', false)
  .action(async (directory: string | undefined, options: RawOptions) => {
    const name = typeof options.name === 'string' ? options.name : undefined;
    if (name) {
      const problem = validateProjectName(name);
      if (problem) {
        abort(problem);
      }
    }

    const args: CreateArgs = {
      directory,
      name,
      framework: pick(options.framework, isFramework),
      coupling: pick(options.coupling, isCoupling),
      api: pick(options.api, isApiStyle),
      pm: pick(options.pm, isPackageManager),
      sln: pick(options.sln, isSolutionFormat),
      scalar: options.scalar,
      install: options.install,
      yes: options.yes,
      force: options.force,
    };

    await runCreate(args, program.version() ?? '0.0.0');
  });

await program.parseAsync(process.argv);
