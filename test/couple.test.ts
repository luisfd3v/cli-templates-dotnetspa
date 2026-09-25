import { describe, expect, it } from 'vitest';
import { insertAfter, insertBefore } from '../src/steps/couple.js';

/**
 * These two helpers are what lets the coupled and decoupled wiring edit a
 * `dotnet new` generated Program.cs without a parser. They must fail loudly
 * rather than produce a half-wired file.
 */
describe('insertBefore', () => {
  it('inserts the block ahead of the anchor', () => {
    const program = 'app.MapProductEndpoints();\n\napp.Run();\n';
    const result = insertBefore(program, 'app.Run();', 'app.UseStaticFiles();\n\n', 'Program.cs');

    expect(result).toBe(
      'app.MapProductEndpoints();\n\napp.UseStaticFiles();\n\napp.Run();\n',
    );
  });

  it('throws with the file name when the anchor is missing', () => {
    expect(() => insertBefore('nothing here', 'app.Run();', 'x', 'Program.cs')).toThrow(
      /Program\.cs/,
    );
  });
});

describe('insertAfter', () => {
  it('inserts the block immediately after the anchor without a trailing newline', () => {
    const program = '    app.MapOpenApi();\n}\n';
    const result = insertAfter(
      program,
      '    app.MapOpenApi();',
      '\n    app.MapScalarApiReference();',
      'Program.cs',
    );

    expect(result).toBe('    app.MapOpenApi();\n    app.MapScalarApiReference();\n}\n');
  });

  it('throws when the anchor is missing', () => {
    expect(() => insertAfter('nothing here', 'app.Run();', 'x', 'Program.cs')).toThrow();
  });
});
