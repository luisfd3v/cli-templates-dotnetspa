import { afterEach, describe, expect, it } from 'vitest';
import { isTextFile, replaceTokens } from '../src/lib/fs.js';
import { clientOutputDir, frameworkLabel } from '../src/lib/framework.js';
import {
  detectPackageManager,
  installCommand,
  runScriptCommand,
  toShellCommand,
} from '../src/lib/package-manager.js';
import { escapeXml, insertAfterProjectTag } from '../src/lib/dotnet.js';

describe('replaceTokens', () => {
  it('replaces every occurrence of a token', () => {
    expect(replaceTokens('__NAME__ and __NAME__', { NAME: 'App' })).toBe('App and App');
  });

  it('leaves unknown tokens untouched', () => {
    expect(replaceTokens('__NAME__ __OTHER__', { NAME: 'App' })).toBe('App __OTHER__');
  });

  // This is the whole reason tokens are not {{ }}: Vue and Angular use it to interpolate.
  it('does not touch vue or angular mustache interpolation', () => {
    const template = '<span>{{ title }}</span> <p>__PROJECT_NAME__</p>';
    expect(replaceTokens(template, { PROJECT_NAME: 'App' })).toBe(
      '<span>{{ title }}</span> <p>App</p>',
    );
  });

  it('does not mangle angular control flow blocks', () => {
    const template = '@if (loading()) { __PROJECT_NAME__ }';
    expect(replaceTokens(template, { PROJECT_NAME: 'App' })).toBe('@if (loading()) { App }');
  });
});

describe('isTextFile', () => {
  it('accepts source files and known extension-less config files', () => {
    expect(isTextFile('/a/b/App.vue')).toBe(true);
    expect(isTextFile('/a/b/main.tsx')).toBe(true);
    expect(isTextFile('/a/b/.gitignore')).toBe(true);
    expect(isTextFile('/a/b/Dockerfile')).toBe(true);
  });

  it('rejects binaries', () => {
    expect(isTextFile('/a/b/favicon.ico')).toBe(false);
    expect(isTextFile('/a/b/logo.png')).toBe(false);
  });
});

describe('clientOutputDir', () => {
  it('points at dist for the Vite templates', () => {
    expect(clientOutputDir('vue', 'meu-app')).toBe('dist');
    expect(clientOutputDir('react', 'meu-app')).toBe('dist');
  });

  // Verified against a real `ng build` on Angular 22.
  it('points at dist/browser for Angular', () => {
    expect(clientOutputDir('angular', 'meu-app')).toBe('dist/browser');
  });
});

describe('frameworkLabel', () => {
  it('labels every framework', () => {
    expect(frameworkLabel('vue')).toBe('Vue 3 + Vite');
    expect(frameworkLabel('react')).toBe('React + Vite');
    expect(frameworkLabel('angular')).toBe('Angular');
  });
});

describe('package manager commands', () => {
  it('builds a dev command per manager', () => {
    expect(toShellCommand(runScriptCommand('npm', 'dev'))).toBe('npm run dev');
    expect(toShellCommand(runScriptCommand('pnpm', 'dev'))).toBe('pnpm run dev');
    expect(toShellCommand(runScriptCommand('yarn', 'dev'))).toBe('yarn run dev');
    expect(toShellCommand(runScriptCommand('bun', 'dev'))).toBe('bun run dev');
  });

  it('builds an install command per manager', () => {
    expect(toShellCommand(installCommand('npm'))).toBe('npm install');
    expect(toShellCommand(installCommand('yarn'))).toBe('yarn install');
  });
});

describe('detectPackageManager', () => {
  const original = process.env.npm_config_user_agent;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.npm_config_user_agent;
    } else {
      process.env.npm_config_user_agent = original;
    }
  });

  it('reads the manager from the user agent npm injects', () => {
    process.env.npm_config_user_agent = 'pnpm/9.12.0 npm/? node/v20.11.0 win32 x64';
    expect(detectPackageManager()).toBe('pnpm');
  });

  it('returns undefined when run directly, so the prompt can ask', () => {
    delete process.env.npm_config_user_agent;
    expect(detectPackageManager()).toBeUndefined();
  });

  it('ignores unknown agents', () => {
    process.env.npm_config_user_agent = 'somethingelse/1.0.0';
    expect(detectPackageManager()).toBeUndefined();
  });
});

describe('csproj helpers', () => {
  it('escapes xml special characters', () => {
    expect(escapeXml('a & b < c > "d"')).toBe('a &amp; b &lt; c &gt; &quot;d&quot;');
  });

  it('inserts a block right after the opening Project tag', () => {
    const csproj = '<Project Sdk="Microsoft.NET.Sdk.Web">\n  <PropertyGroup />\n</Project>';
    const result = insertAfterProjectTag(csproj, '<PropertyGroup><SpaRoot /></PropertyGroup>');

    expect(result.indexOf('<PropertyGroup><SpaRoot /></PropertyGroup>')).toBeLessThan(
      result.indexOf('<PropertyGroup />'),
    );
  });

  it('throws when there is no Project element', () => {
    expect(() => insertAfterProjectTag('<NotAProject />', '<x />')).toThrow(/Project/);
  });
});
