import * as p from '@clack/prompts';
import {
  PACKAGE_MANAGERS,
  SOLUTION_FORMATS,
  type ApiStyle,
  type Coupling,
  type Framework,
  type PackageManager,
  type SolutionFormat,
} from './types.js';
import { validateProjectName } from './lib/names.js';
import { detectPackageManager } from './lib/package-manager.js';
import { abort } from './lib/log.js';

/** Values supplied through CLI flags. `undefined` means "ask the user". */
export interface PromptOverrides {
  projectName?: string;
  framework?: Framework;
  coupling?: Coupling;
  apiStyle?: ApiStyle;
  packageManager?: PackageManager;
  solutionFormat?: SolutionFormat;
  openApiUi: boolean;
  install?: boolean;
  /** `--yes`: never prompt, fall back to the defaults below. */
  yes: boolean;
}

/**
 * Answers used when `--yes` is passed. These mirror the `initialValue` of the
 * interactive prompts so the scripted path builds the same project.
 */
const DEFAULTS = {
  framework: 'vue',
  coupling: 'coupled',
  apiStyle: 'minimal',
  packageManager: 'npm',
  install: true,
} as const satisfies {
  framework: Framework;
  coupling: Coupling;
  apiStyle: ApiStyle;
  packageManager: PackageManager;
  install: boolean;
};

export interface PromptAnswers {
  projectName: string;
  framework: Framework;
  coupling: Coupling;
  apiStyle: ApiStyle;
  packageManager: PackageManager;
  solutionFormat: SolutionFormat;
  openApiUi: boolean;
  install: boolean;
}

/** Returns the preset when there is one, otherwise asks and guards for cancel. */
async function ask<T>(preset: T | undefined, prompt: () => Promise<T | symbol>): Promise<T> {
  if (preset !== undefined) {
    return preset;
  }

  const answer = await prompt();
  if (p.isCancel(answer)) {
    abort('Operation cancelled.');
  }

  return answer as T;
}

const FRAMEWORK_OPTIONS: { value: Framework; label: string; hint: string }[] = [
  { value: 'vue', label: 'Vue', hint: 'Vue 3 + Vite + TypeScript' },
  { value: 'react', label: 'React', hint: 'React + Vite + TypeScript' },
  { value: 'angular', label: 'Angular', hint: 'Angular + TypeScript' },
];

const COUPLING_OPTIONS: { value: Coupling; label: string; hint: string }[] = [
  {
    value: 'coupled',
    label: 'Coupled',
    hint: 'one app: the API serves the SPA and boots Vite on dotnet run',
  },
  {
    value: 'decoupled',
    label: 'Decoupled',
    hint: 'two apps: run the API and the SPA in separate terminals',
  },
];

const API_STYLE_OPTIONS: { value: ApiStyle; label: string; hint: string }[] = [
  { value: 'minimal', label: 'Minimal API', hint: 'endpoint groups, no controllers' },
  { value: 'controllers', label: 'Controllers', hint: 'MVC controllers + Services/Models folders' },
];

export async function promptProject(overrides: PromptOverrides): Promise<PromptAnswers> {
  const preset = overrides.yes ? DEFAULTS : undefined;

  if (!overrides.projectName && overrides.yes) {
    abort('--name is required when you pass --yes.');
  }

  if (!process.stdin.isTTY && !overrides.yes) {
    abort(
      'This terminal is not interactive. Pass --yes together with --name ' +
        '(and any other flags you want to override).',
    );
  }

  const projectName = await ask(overrides.projectName, () =>
    p.text({
      message: 'Project name',
      placeholder: 'MeuProjeto',
      validate: (value) => validateProjectName(value ?? ''),
    }),
  );

  const framework = await ask(overrides.framework ?? preset?.framework, () =>
    p.select<Framework>({
      message: 'Which SPA framework?',
      options: FRAMEWORK_OPTIONS,
      initialValue: 'vue',
    }),
  );

  const coupling = await ask(overrides.coupling ?? preset?.coupling, () =>
    p.select<Coupling>({
      message: 'How should the API and the SPA be organised?',
      options: COUPLING_OPTIONS,
      initialValue: 'coupled',
    }),
  );

  const apiStyle = await ask(overrides.apiStyle ?? preset?.apiStyle, () =>
    p.select<ApiStyle>({
      message: 'How should the API be structured?',
      options: API_STYLE_OPTIONS,
      initialValue: 'minimal',
    }),
  );

  const detected = detectPackageManager();
  const packageManager = await ask(
    overrides.packageManager ?? detected ?? preset?.packageManager,
    () =>
      p.select<PackageManager>({
        message: 'Which package manager should the SPA use?',
        options: PACKAGE_MANAGERS.map((value) => ({ value, label: value })),
        initialValue: 'npm',
      }),
  );

  const install = await ask(overrides.install ?? preset?.install, () =>
    p.confirm({
      message: 'Install dependencies and restore NuGet packages now?',
      initialValue: true,
    }),
  );

  return {
    projectName,
    framework,
    coupling,
    apiStyle,
    packageManager,
    solutionFormat: overrides.solutionFormat ?? SOLUTION_FORMATS[0],
    openApiUi: overrides.openApiUi,
    install,
  };
}
