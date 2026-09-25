import path from 'node:path';
import type { ApiStyle, Coupling, ResolvedProject } from '../types.js';
import { writeText } from '../lib/fs.js';
import { frameworkLabel } from '../lib/framework.js';
import { runScriptCommand, toShellCommand } from '../lib/package-manager.js';

export async function writeRootFiles(project: ResolvedProject): Promise<void> {
  await writeText(path.join(project.targetDir, '.gitignore'), gitignore(project));
  await writeText(path.join(project.targetDir, '.editorconfig'), editorconfig());
  await writeText(path.join(project.targetDir, 'README.md'), readme(project));
}

function gitignore(project: ResolvedProject): string {
  const lines = [
    '# .NET build output',
    'bin/',
    'obj/',
    '',
    '# SPA dependencies and build output',
    'node_modules/',
    'dist/',
  ];

  if (project.coupling === 'coupled') {
    lines.push(
      '',
      '# The coupled build packs the SPA bundle in here',
      `src/${project.apiName}/wwwroot/`,
    );
  }

  lines.push(
    '',
    '# Tooling',
    '.vs/',
    '.vscode/*',
    '!.vscode/extensions.json',
    '*.user',
    '*.suo',
    '',
    '# Logs and local secrets',
    '*.log',
    '.env',
    '.env.local',
    '',
    '# OS',
    '.DS_Store',
    'Thumbs.db',
    '',
  );

  return lines.join('\n');
}

function editorconfig(): string {
  return `root = true

[*]
charset = utf-8
insert_final_newline = true
trim_trailing_whitespace = true

[*.{cs,csproj,props,targets}]
indent_style = space
indent_size = 4

[*.{ts,tsx,js,jsx,mjs,cjs,vue,json,yml,yaml,css,html}]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
`;
}

const API_STYLE_LABEL: Record<ApiStyle, string> = {
  minimal: 'Minimal API',
  controllers: 'Controllers',
};

const COUPLING_LABEL: Record<Coupling, string> = {
  coupled: 'coupled',
  decoupled: 'decoupled',
};

function runSection(project: ResolvedProject, dev: string): string {
  if (project.coupling === 'coupled') {
    return `The API hosts the SPA. Running the backend also starts the Vite dev server:

\`\`\`bash
dotnet run --project src/${project.apiName} --launch-profile https
\`\`\`

Then open https://localhost:${project.apiHttpsPort}. The \`SpaProxy\` hosting startup
launches \`${dev}\` for you and redirects \`/\` to http://localhost:${project.clientPort}.

> The proxy only intercepts the root path. Once the browser is on the Vite dev server, the
> SPA calls \`/api/*\`, which Vite proxies back to the API. That is why the SPA always uses a
> relative \`/api\` base URL.

Prefer two terminals anyway? Run these in parallel:

\`\`\`bash
dotnet run --project src/${project.apiName} --launch-profile https
cd src/${project.clientName} && ${dev}
\`\`\``;
  }

  return `The API and the SPA run as two independent apps. Use two terminals:

\`\`\`bash
# terminal 1 - backend on https://localhost:${project.apiHttpsPort}
dotnet run --project src/${project.apiName} --launch-profile https
\`\`\`

\`\`\`bash
# terminal 2 - SPA on http://localhost:${project.clientPort}
cd src/${project.clientName} && ${dev}
\`\`\`

Open http://localhost:${project.clientPort}. The dev server proxies \`/api/*\` to the
backend, so no CORS configuration is needed while developing. A permissive \`ClientApp\`
CORS policy is still registered in case you call the API directly.`;
}

function publishSection(project: ResolvedProject, build: string): string {
  if (project.coupling === 'coupled') {
    return `\`\`\`bash
dotnet publish src/${project.apiName} -c Release
\`\`\`

The publish target installs the SPA dependencies, runs \`${build}\` and copies the bundle
into the API's \`wwwroot\`, so the published output is a single deployable unit that
serves both the API and the SPA.`;
  }

  return `Deploy the two apps separately:

\`\`\`bash
dotnet publish src/${project.apiName} -c Release
cd src/${project.clientName} && ${build}
\`\`\`

The API is deployed on its own and the SPA's static assets are hosted wherever you like.
Point the SPA at the deployed API by changing the proxy target, or by giving
\`src/${project.clientName}\` an environment specific base URL.`;
}

function readme(project: ResolvedProject): string {
  const dev = toShellCommand(runScriptCommand(project.packageManager, 'dev'));
  const build = toShellCommand(runScriptCommand(project.packageManager, 'build'));

  const docsSection = project.openApiUi
    ? `
## API documentation

| Resource | URL |
| --- | --- |
| Scalar UI | https://localhost:${project.apiHttpsPort}/scalar/v1 |
| OpenAPI document | https://localhost:${project.apiHttpsPort}/openapi/v1.json |

Both are only mapped in the development environment. The sample requests in
\`src/${project.apiName}/${project.apiName}.http\` work with VS Code's REST Client and Rider.
`
    : '';

  return `# ${project.projectName}

A ${frameworkLabel(project.framework)} single page app with an ASP.NET Core (.NET 10)
${API_STYLE_LABEL[project.apiStyle]} backend. The two projects are ${COUPLING_LABEL[project.coupling]}.

## Layout

| Path | Description |
| --- | --- |
| \`src/${project.apiName}\` | ASP.NET Core backend (${API_STYLE_LABEL[project.apiStyle]}) |
| \`src/${project.clientName}\` | ${frameworkLabel(project.framework)} app |
| \`${project.solutionFile}\` | Solution file |

## Requirements

- .NET 10 SDK
- Node.js 20 or newer

## Running

${runSection(project, dev)}
${docsSection}
## Publishing

${publishSection(project, build)}

## Where to go next

- Replace \`InMemoryProductService\` with real data access.
- Add your own endpoints next to the sample \`products\` ones.
- Install extra NuGet packages with \`dotnet add src/${project.apiName} package <name>\`.
`;
}
