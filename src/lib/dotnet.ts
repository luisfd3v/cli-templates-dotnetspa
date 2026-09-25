import path from 'node:path';
import { capture, run } from './exec.js';
import { readJson, readText, writeText } from './fs.js';

export const REQUIRED_DOTNET_MAJOR = 10;
export const TARGET_FRAMEWORK = 'net10.0';

export interface DotnetVersion {
  major: number;
  minor: number;
  raw: string;
}

export async function readDotnetVersion(cwd?: string): Promise<DotnetVersion> {
  let raw: string;
  try {
    raw = (await capture('dotnet', ['--version'], { cwd })).trim();
  } catch {
    throw new Error(
      'The .NET SDK was not found on your PATH. Install .NET 10 from https://get.dot.net/10 and try again.',
    );
  }

  const match = /^(\d+)\.(\d+)/.exec(raw);
  if (!match?.[1] || !match[2]) {
    throw new Error(`Could not parse the .NET SDK version from "${raw}".`);
  }

  return { major: Number(match[1]), minor: Number(match[2]), raw };
}

interface LaunchProfile {
  commandName?: string;
  launchBrowser?: boolean;
  launchUrl?: string;
  applicationUrl?: string;
  environmentVariables?: Record<string, string>;
  [key: string]: unknown;
}

interface LaunchSettings {
  profiles?: Record<string, LaunchProfile>;
  [key: string]: unknown;
}

interface LaunchSettingsFile {
  file: string;
  settings: LaunchSettings;
}

const launchSettingsPath = (apiDir: string): string =>
  path.join(apiDir, 'Properties', 'launchSettings.json');

async function readLaunchSettings(apiDir: string): Promise<LaunchSettingsFile> {
  const file = launchSettingsPath(apiDir);
  const settings = await readJson<LaunchSettings>(file);
  return { file, settings };
}

function extractPorts(applicationUrl: string): { https?: number; http?: number } {
  const ports: { https?: number; http?: number } = {};

  for (const entry of applicationUrl.split(';')) {
    const value = entry.trim();
    if (!value) {
      continue;
    }
    try {
      const url = new URL(value);
      const port = Number(url.port);
      if (!port) {
        continue;
      }
      if (url.protocol === 'https:') {
        ports.https ??= port;
      } else {
        ports.http ??= port;
      }
    } catch {
      // Ignore entries that are not absolute URLs.
    }
  }

  return ports;
}

export interface ApiPorts {
  httpsPort: number;
  httpPort: number;
  profile: string;
}

/**
 * `dotnet new` assigns random ports per project, so we read them back instead of
 * assuming anything. The Vite dev server needs the HTTPS port as its proxy target.
 */
export async function readApiPorts(apiDir: string): Promise<ApiPorts> {
  const { settings } = await readLaunchSettings(apiDir);

  for (const [profile, value] of Object.entries(settings.profiles ?? {})) {
    const ports = extractPorts(value.applicationUrl ?? '');
    if (ports.https) {
      return {
        httpsPort: ports.https,
        httpPort: ports.http ?? ports.https,
        profile,
      };
    }
  }

  throw new Error(
    `Could not find an HTTPS application URL in ${launchSettingsPath(apiDir)}. ` +
      'The generated API must expose an https launch profile for the SPA proxy to work.',
  );
}

/**
 * Wires the `Microsoft.AspNetCore.SpaProxy` hosting startup so that `dotnet run`
 * boots the Vite dev server and redirects `/` to it.
 */
export async function enableSpaProxyHostingStartup(apiDir: string): Promise<void> {
  const { file, settings } = await readLaunchSettings(apiDir);

  for (const profile of Object.values(settings.profiles ?? {})) {
    if (profile.commandName !== 'Project') {
      continue;
    }
    profile.launchBrowser = true;
    profile.launchUrl = '';
    profile.environmentVariables = {
      ...(profile.environmentVariables ?? {}),
      ASPNETCORE_HOSTINGSTARTUPASSEMBLIES: 'Microsoft.AspNetCore.SpaProxy',
    };
  }

  await writeText(file, `${JSON.stringify(settings, null, 2)}\n`);
}

/** Adds a NuGet package letting NuGet pick the latest compatible version. */
export async function addPackage(projectFile: string, packageId: string, cwd?: string): Promise<void> {
  await run('dotnet', ['add', projectFile, 'package', packageId], { cwd });
}

export async function addProjectToSolution(solutionFile: string, projectFile: string, cwd: string): Promise<void> {
  await run('dotnet', ['sln', solutionFile, 'add', projectFile], { cwd });
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Inserts a raw XML block immediately after the opening `<Project ...>` tag. */
export function insertAfterProjectTag(csproj: string, block: string): string {
  const match = /<Project\b[^>]*>/.exec(csproj);
  if (!match) {
    throw new Error('The generated project file does not contain a <Project> element.');
  }
  const insertAt = match.index + match[0].length;
  return `${csproj.slice(0, insertAt)}\n${block}\n${csproj.slice(insertAt)}`;
}
