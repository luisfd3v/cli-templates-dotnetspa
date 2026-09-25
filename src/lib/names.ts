import type { ProjectNames, SolutionFormat } from '../types.js';

/** `MeuProjeto` -> `meu-projeto`, `MinhaAPI2` -> `minha-api2`. */
export function toKebabCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function deriveNames(projectName: string, solutionFormat: SolutionFormat): ProjectNames {
  return {
    projectName,
    apiName: `${projectName}.API`,
    clientName: `${projectName}.Client`,
    npmName: toKebabCase(projectName),
    solutionFile: `${projectName}.${solutionFormat}`,
  };
}

/**
 * The name has to be a valid C# namespace segment *and* a valid assembly name,
 * so we keep it to letters, digits and underscores.
 */
export function validateProjectName(value: string): string | undefined {
  if (!value) {
    return 'Project name is required.';
  }
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(value)) {
    return 'Use letters, digits and underscores only, starting with a letter (e.g. MeuProjeto).';
  }
  if (value.length > 60) {
    return 'Keep the name under 60 characters.';
  }
  return undefined;
}
