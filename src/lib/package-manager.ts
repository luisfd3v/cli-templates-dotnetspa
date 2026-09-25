import type { PackageManager } from '../types.js';

/**
 * NPX/Pnpm dlx/Yarn/Bun all export `npm_config_user_agent`, which lets us match
 * the package manager the user actually invoked us with.
 */
export function detectPackageManager(): PackageManager | undefined {
  const agent = process.env.npm_config_user_agent;
  if (!agent) {
    return undefined;
  }
  const name = agent.split('/')[0]?.toLowerCase();
  if (name === 'npm' || name === 'pnpm' || name === 'yarn' || name === 'bun') {
    return name;
  }
  return undefined;
}

export type CommandSpec = [command: string, args: string[]];

export function installCommand(pm: PackageManager): CommandSpec {
  switch (pm) {
    case 'npm':
    case 'pnpm':
      return [pm, ['install']];
    case 'yarn':
      return ['yarn', ['install']];
    case 'bun':
      return ['bun', ['install']];
  }
}

export function runScriptCommand(pm: PackageManager, script: string): CommandSpec {
  switch (pm) {
    case 'npm':
    case 'bun':
      return [pm, ['run', script]];
    case 'pnpm':
    case 'yarn':
      return [pm, ['run', script]];
  }
}

/** Renders a command for MSBuild `<Exec Command="..." />`. */
export function toShellCommand(spec: CommandSpec): string {
  return [spec[0], ...spec[1]].join(' ');
}

export const PACKAGE_MANAGER_LABELS: Record<PackageManager, string> = {
  npm: 'npm',
  pnpm: 'pnpm',
  yarn: 'yarn',
  bun: 'bun',
};
