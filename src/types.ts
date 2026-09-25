export const FRAMEWORKS = ['vue', 'react', 'angular'] as const;
export type Framework = (typeof FRAMEWORKS)[number];

export const COUPLINGS = ['coupled', 'decoupled'] as const;
export type Coupling = (typeof COUPLINGS)[number];

export const API_STYLES = ['minimal', 'controllers'] as const;
export type ApiStyle = (typeof API_STYLES)[number];

export const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export const SOLUTION_FORMATS = ['slnx', 'sln'] as const;
export type SolutionFormat = (typeof SOLUTION_FORMATS)[number];

/** Everything the user chose, before any file is written. */
export interface ProjectOptions {
  projectName: string;
  targetDir: string;
  framework: Framework;
  coupling: Coupling;
  apiStyle: ApiStyle;
  packageManager: PackageManager;
  solutionFormat: SolutionFormat;
  openApiUi: boolean;
  install: boolean;
}

/** Names derived from `projectName` following the .NET naming convention. */
export interface ProjectNames {
  projectName: string;
  apiName: string;
  clientName: string;
  npmName: string;
  solutionFile: string;
}

/** Options plus derived names plus the ports that were actually reserved. */
export interface ResolvedProject extends ProjectOptions, ProjectNames {
  apiHttpsPort: number;
  apiHttpPort: number;
  clientPort: number;
}

export function isFramework(value: string): value is Framework {
  return (FRAMEWORKS as readonly string[]).includes(value);
}

export function isCoupling(value: string): value is Coupling {
  return (COUPLINGS as readonly string[]).includes(value);
}

export function isApiStyle(value: string): value is ApiStyle {
  return (API_STYLES as readonly string[]).includes(value);
}

export function isPackageManager(value: string): value is PackageManager {
  return (PACKAGE_MANAGERS as readonly string[]).includes(value);
}

export function isSolutionFormat(value: string): value is SolutionFormat {
  return (SOLUTION_FORMATS as readonly string[]).includes(value);
}
