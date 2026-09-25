import path from 'node:path';
import type { ApiStyle } from '../types.js';
import { TARGET_FRAMEWORK, readApiPorts, type ApiPorts } from '../lib/dotnet.js';
import { run } from '../lib/exec.js';
import { copyTemplate, pathExists, remove, writeText } from '../lib/fs.js';
import { templatesDir } from '../lib/paths.js';

/** Sample files that only exist when the controllers flavour is scaffolded. */
const CONTROLLER_SAMPLE_FILES = [
  'WeatherForecast.cs',
  path.join('Controllers', 'WeatherForecastController.cs'),
];

export interface ScaffoldApiOptions {
  targetDir: string;
  apiName: string;
  apiStyle: ApiStyle;
}

export interface ScaffoldApiResult {
  apiDir: string;
  projectFile: string;
  ports: ApiPorts;
}

/**
 * Delegates the .NET shell to `dotnet new` so the target framework, launch
 * settings, implicit usings and OpenAPI wiring stay correct for the installed
 * SDK, then replaces the thrown-away weather sample with a small products slice.
 */
export async function scaffoldApi(options: ScaffoldApiOptions): Promise<ScaffoldApiResult> {
  const apiDir = path.join(options.targetDir, 'src', options.apiName);

  await run(
    'dotnet',
    [
      'new',
      'webapi',
      '--name',
      options.apiName,
      '--output',
      apiDir,
      '--framework',
      TARGET_FRAMEWORK,
      '--no-update-check',
      options.apiStyle === 'controllers' ? '--use-controllers' : '--use-minimal-apis',
    ],
    { cwd: options.targetDir },
  );

  const projectFile = path.join(apiDir, `${options.apiName}.csproj`);
  if (!(await pathExists(projectFile))) {
    throw new Error(`"dotnet new webapi" did not produce ${projectFile}.`);
  }

  const stale = [
    // The generated .http file points at the weather sample, which we remove.
    `${options.apiName}.http`,
    ...(options.apiStyle === 'controllers' ? CONTROLLER_SAMPLE_FILES : []),
  ];

  for (const file of stale) {
    const full = path.join(apiDir, file);
    if (await pathExists(full)) {
      await remove(full);
    }
  }

  const tokens = { API_NAME: options.apiName };
  await copyTemplate(path.join(templatesDir, 'api', '_shared'), apiDir, { tokens });
  await copyTemplate(path.join(templatesDir, 'api', options.apiStyle), apiDir, { tokens });

  const ports = await readApiPorts(apiDir);
  await writeText(path.join(apiDir, `${options.apiName}.http`), httpFile(options.apiName, ports));

  return { apiDir, projectFile, ports };
}

/** Ready-to-run requests, readable by VS Code's REST Client and Rider. */
function httpFile(apiName: string, ports: ApiPorts): string {
  return `@host = https://localhost:${ports.httpsPort}

### List every product
GET {{host}}/api/products
Accept: application/json

### Get a single product
GET {{host}}/api/products/1
Accept: application/json

### Create a product
POST {{host}}/api/products
Content-Type: application/json

{
  "name": "Created from ${apiName}.http",
  "price": 12.34
}
`;
}
