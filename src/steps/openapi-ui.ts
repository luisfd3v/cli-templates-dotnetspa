import path from 'node:path';
import { addPackage } from '../lib/dotnet.js';
import { readText, writeText } from '../lib/fs.js';
import { insertAfter } from './couple.js';

/** The generated Program.cs maps the document inside the development block. */
const MAP_OPENAPI_LINE = '    app.MapOpenApi();';

export interface AddOpenApiUiOptions {
  apiDir: string;
  projectFile: string;
}

/**
 * Since .NET 9 the Web API templates ship the OpenAPI document but no UI.
 * Scalar is one package and renders the built-in document, so it is the
 * smallest dependency that gives a usable API explorer.
 */
export async function addOpenApiUi(options: AddOpenApiUiOptions): Promise<void> {
  await addPackage(options.projectFile, 'Scalar.AspNetCore', options.apiDir);

  const programFile = path.join(options.apiDir, 'Program.cs');
  let program = await readText(programFile);

  if (!program.includes('using Scalar.AspNetCore;')) {
    program = `using Scalar.AspNetCore;\n${program}`;
  }

  program = insertAfter(
    program,
    MAP_OPENAPI_LINE,
    '\n    app.MapScalarApiReference();',
    programFile,
  );

  await writeText(programFile, program);
}
