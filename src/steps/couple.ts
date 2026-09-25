import path from 'node:path';
import type { Coupling, PackageManager } from '../types.js';
import { addPackage, enableSpaProxyHostingStartup, escapeXml } from '../lib/dotnet.js';
import { readText, writeText } from '../lib/fs.js';
import { installCommand, runScriptCommand, toShellCommand } from '../lib/package-manager.js';

export interface ConfigureCouplingOptions {
  apiDir: string;
  projectFile: string;
  coupling: Coupling;
  clientName: string;
  clientPort: number;
  packageManager: PackageManager;
  /** Build output of the client, relative to the client project root. */
  clientOutputDir: string;
}

const RUN_ANCHOR = 'app.Run();';
const BUILD_ANCHOR = 'var app = builder.Build();';
const SERVICES_ANCHOR = 'builder.Services.AddOpenApi();';

export function insertBefore(source: string, anchor: string, block: string, file: string): string {
  const index = source.indexOf(anchor);
  if (index < 0) {
    throw new Error(`Expected to find "${anchor}" in ${file}. The generated code was modified.`);
  }
  return `${source.slice(0, index)}${block}${source.slice(index)}`;
}

export function insertAfter(source: string, anchor: string, block: string, file: string): string {
  const index = source.indexOf(anchor);
  if (index < 0) {
    throw new Error(`Expected to find "${anchor}" in ${file}. The generated code was modified.`);
  }
  const end = index + anchor.length;
  return `${source.slice(0, end)}${block}${source.slice(end)}`;
}

/**
 * `.NET` serves the SPA from `wwwroot` in production, while in development the
 * SpaProxy hosting startup redirects `/` to the Vite dev server.
 */
const STATIC_FILES_BLOCK = `app.UseDefaultFiles();
app.UseStaticFiles();

app.MapFallbackToFile("index.html");

`;

function corsServicesBlock(clientPort: number): string {
  return `builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientApp", policy => policy
        .WithOrigins("http://localhost:${clientPort}")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});
`;
}

/**
 * Applied regardless of environment: the policy only allows the local dev
 * origin, so it is inert once deployed. Keeping it out of an `if` avoids
 * generating a second, duplicate development block.
 */
const CORS_MIDDLEWARE_BLOCK = `

// Lets the SPA call this API directly. Narrow or extend the origins per environment.
app.UseCors("ClientApp");`;

/** Adds the MSBuild plumbing that launches Vite and packs it into the publish. */
async function configureCoupled(options: ConfigureCouplingOptions): Promise<void> {
  const devCommand = toShellCommand(runScriptCommand(options.packageManager, 'dev'));
  const buildCommand = toShellCommand(runScriptCommand(options.packageManager, 'build'));
  const installCmd = toShellCommand(installCommand(options.packageManager));

  const projectXml = await readText(options.projectFile);

  // SpaProxyServerUrl and SpaProxyRedirectUrl have no defaults in
  // Microsoft.AspNetCore.SpaProxy.targets: both are written to spa.proxy.json
  // verbatim, so leaving the redirect unset would produce an empty target.
  const block = `  <PropertyGroup>
    <SpaRoot>../${options.clientName}/</SpaRoot>
    <SpaProxyServerUrl>http://localhost:${options.clientPort}</SpaProxyServerUrl>
    <SpaProxyRedirectUrl>http://localhost:${options.clientPort}</SpaProxyRedirectUrl>
    <SpaProxyLaunchCommand>${escapeXml(devCommand)}</SpaProxyLaunchCommand>
    <ClientProjectPath>$(MSBuildProjectDirectory)/../${options.clientName}/</ClientProjectPath>
    <ClientOutputDir>${escapeXml(options.clientOutputDir)}</ClientOutputDir>
  </PropertyGroup>

  <Target Name="PublishClientApp" AfterTargets="ComputeFilesToPublish">
    <Message Importance="high" Text="Installing client dependencies" />
    <Exec WorkingDirectory="$(ClientProjectPath)" Command="${escapeXml(installCmd)}" />
    <Message Importance="high" Text="Building the client" />
    <Exec WorkingDirectory="$(ClientProjectPath)" Command="${escapeXml(buildCommand)}" />
    <ItemGroup>
      <ClientDistFiles Include="$(ClientProjectPath)$(ClientOutputDir)/**/*" />
      <ResolvedFileToPublish Include="@(ClientDistFiles->'%(FullPath)')" Exclude="@(ResolvedFileToPublish)">
        <RelativePath>wwwroot/%(RecursiveDir)%(Filename)%(Extension)</RelativePath>
        <CopyToPublishDirectory>PreserveNewest</CopyToPublishDirectory>
        <ExcludeFromSingleFile>true</ExcludeFromSingleFile>
      </ResolvedFileToPublish>
    </ItemGroup>
  </Target>`;

  const match = /<Project\b[^>]*>/.exec(projectXml);
  if (!match) {
    throw new Error(`${options.projectFile} does not contain a <Project> element.`);
  }
  const afterOpenTag = projectXml.slice(0, match.index + match[0].length);
  const rest = projectXml.slice(match.index + match[0].length);
  await writeText(options.projectFile, `${afterOpenTag}\n${block}\n${rest}`);

  const programFile = path.join(options.apiDir, 'Program.cs');
  const program = await readText(programFile);
  await writeText(
    programFile,
    insertBefore(program, RUN_ANCHOR, STATIC_FILES_BLOCK, programFile),
  );

  await addPackage(options.projectFile, 'Microsoft.AspNetCore.SpaProxy', options.apiDir);
  await enableSpaProxyHostingStartup(options.apiDir);
}

/**
 * Nothing is shared between the two apps, so the API only needs to accept
 * cross-origin calls for the cases where the SPA bypasses its dev proxy.
 */
async function configureDecoupled(options: ConfigureCouplingOptions): Promise<void> {
  const programFile = path.join(options.apiDir, 'Program.cs');
  let program = await readText(programFile);

  program = insertAfter(
    program,
    SERVICES_ANCHOR,
    `\n${corsServicesBlock(options.clientPort)}`,
    programFile,
  );
  program = insertAfter(program, BUILD_ANCHOR, CORS_MIDDLEWARE_BLOCK, programFile);

  await writeText(programFile, program);
}

export async function configureCoupling(options: ConfigureCouplingOptions): Promise<void> {
  if (options.coupling === 'coupled') {
    await configureCoupled(options);
    return;
  }
  await configureDecoupled(options);
}
