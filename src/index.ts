import path from 'node:path';
import { clientOutputDir, frameworkLabel } from './lib/framework.js';
import { bold, cmd, dim, green, p } from './lib/log.js';
import { deriveNames, toKebabCase } from './lib/names.js';
import { findFreePort } from './lib/ports.js';
import { runScriptCommand, toShellCommand } from './lib/package-manager.js';
import { promptProject } from './prompts.js';
import { addOpenApiUi } from './steps/openapi-ui.js';
import { configureCoupling } from './steps/couple.js';
import { installDependencies } from './steps/install.js';
import { preflight } from './steps/preflight.js';
import { writeRootFiles } from './steps/root-files.js';
import { scaffoldApi } from './steps/scaffold-api.js';
import { scaffoldClient } from './steps/scaffold-client.js';
import { createSolution } from './steps/solution.js';
import type {
  ApiStyle,
  Coupling,
  Framework,
  PackageManager,
  ResolvedProject,
  SolutionFormat,
} from './types.js';

export interface CreateArgs {
  directory?: string;
  name?: string;
  framework?: Framework;
  coupling?: Coupling;
  api?: ApiStyle;
  pm?: PackageManager;
  sln?: SolutionFormat;
  scalar: boolean;
  install: boolean;
  yes: boolean;
  force: boolean;
}

/** The port Vite and Angular default to; we only move away from it if it is taken. */
const PREFERRED_CLIENT_PORT = 5173;

async function withSpinner<T>(label: string, action: () => Promise<T>): Promise<T> {
  const spinner = p.spinner();
  spinner.start(label);
  try {
    const result = await action();
    spinner.stop(label);
    return result;
  } catch (error) {
    spinner.stop(`${label} failed`, 1);
    throw error;
  }
}

export async function runCreate(args: CreateArgs, version: string): Promise<void> {
  p.intro(`${bold('create-dotnetspa')} ${dim(`v${version}`)}`);

  try {
    const answers = await promptProject({
      projectName: args.name,
      framework: args.framework,
      coupling: args.coupling,
      apiStyle: args.api,
      packageManager: args.pm,
      solutionFormat: args.sln,
      openApiUi: args.scalar,
      // An explicit --no-install always wins; otherwise prompt, or take the -y default.
      install: args.install === false ? false : undefined,
      yes: args.yes,
    });

    const names = deriveNames(answers.projectName, answers.solutionFormat);
    const targetDir = path.resolve(
      process.cwd(),
      args.directory ?? toKebabCase(answers.projectName),
    );

    await preflight({ targetDir, force: args.force, yes: args.yes });

    const clientPort = await findFreePort(PREFERRED_CLIENT_PORT);

    const api = await withSpinner(`Creating ${names.apiName}`, () =>
      scaffoldApi({ targetDir, apiName: names.apiName, apiStyle: answers.apiStyle }),
    );

    const project: ResolvedProject = {
      ...answers,
      ...names,
      targetDir,
      apiHttpsPort: api.ports.httpsPort,
      apiHttpPort: api.ports.httpPort,
      clientPort,
    };

    await withSpinner(`Creating ${names.clientName} (${frameworkLabel(answers.framework)})`, () =>
      scaffoldClient({
        targetDir,
        clientName: names.clientName,
        projectName: names.projectName,
        npmName: names.npmName,
        framework: answers.framework,
        clientPort,
        apiUrl: `https://localhost:${api.ports.httpsPort}`,
        packageManager: answers.packageManager,
      }),
    );

    const solution = await withSpinner(`Creating ${names.solutionFile}`, () =>
      createSolution({
        targetDir,
        projectName: names.projectName,
        solutionFormat: answers.solutionFormat,
        projectFiles: [api.projectFile],
      }),
    );

    await withSpinner(
      answers.coupling === 'coupled'
        ? 'Wiring the SPA proxy and the publish target'
        : 'Configuring the development CORS policy',
      () =>
        configureCoupling({
          apiDir: api.apiDir,
          projectFile: api.projectFile,
          coupling: answers.coupling,
          clientName: names.clientName,
          clientPort,
          packageManager: answers.packageManager,
          clientOutputDir: clientOutputDir(answers.framework, names.npmName),
        }),
    );

    if (answers.openApiUi) {
      await withSpinner('Adding the Scalar API reference', () =>
        addOpenApiUi({ apiDir: api.apiDir, projectFile: api.projectFile }),
      );
    }

    await writeRootFiles(project);

    if (answers.install) {
      await installDependencies({
        targetDir,
        solutionFile: solution.solutionFile,
        clientDir: path.join(targetDir, 'src', names.clientName),
        packageManager: answers.packageManager,
      });
    }

    printNextSteps(project);
  } catch (error) {
    p.cancel(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function printNextSteps(project: ResolvedProject): void {
  const dev = toShellCommand(runScriptCommand(project.packageManager, 'dev'));
  const backend = `dotnet run --project src/${project.apiName} --launch-profile https`;

  const lines: string[] = [];

  if (project.coupling === 'coupled') {
    lines.push(cmd(backend), `then open ${cmd(`https://localhost:${project.apiHttpsPort}`)}`);
  } else {
    lines.push(
      cmd(backend),
      cmd(`cd src/${project.clientName} && ${dev}`),
      `then open ${cmd(`http://localhost:${project.clientPort}`)}`,
    );
  }

  if (project.openApiUi) {
    lines.push(
      '',
      `API reference: ${cmd(`https://localhost:${project.apiHttpsPort}/scalar/v1`)}`,
    );
  }

  p.note(lines.join('\n'), 'Next steps');
  p.outro(`${green('Done')} ${dim(project.targetDir)}`);
}
