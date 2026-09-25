import fs from 'node:fs/promises';
import path from 'node:path';

export async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

/** A path that does not exist yet counts as empty. */
export async function isEmptyDirectory(target: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(target);
    return entries.length === 0;
  } catch {
    return true;
  }
}

export async function ensureDir(target: string): Promise<void> {
  await fs.mkdir(target, { recursive: true });
}

export async function remove(target: string): Promise<void> {
  await fs.rm(target, { recursive: true, force: true });
}

/**
 * `dotnet new` writes its JSON (appsettings.json, launchSettings.json, ...) with
 * a UTF-8 BOM, which `JSON.parse` rejects. Strip it on every read.
 */
export async function readText(file: string): Promise<string> {
  const content = await fs.readFile(file, 'utf8');
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

export async function readJson<T>(file: string): Promise<T> {
  const content = await readText(file);
  try {
    return JSON.parse(content) as T;
  } catch (cause) {
    throw new Error(
      `${file} does not contain valid JSON: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }
}

export async function writeText(file: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf8');
}

/** Directories that must never be copied out of a template. */
const IGNORED_DIRECTORIES = new Set(['node_modules', 'dist', '.git', 'bin', 'obj']);

export async function walk(root: string): Promise<string[]> {
  const results: string[] = [];

  const visit = async (dir: string): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          continue;
        }
        await visit(full);
      } else if (entry.isFile()) {
        results.push(full);
      }
    }
  };

  await visit(root);
  return results;
}

/**
 * Templates cannot ship dotfiles that git would ignore, so they use a leading
 * underscore (`_gitignore`) which is renamed on copy.
 */
const RENAME_MAP: Record<string, string> = {
  _gitignore: '.gitignore',
  _npmrc: '.npmrc',
  _editorconfig: '.editorconfig',
  _env: '.env',
  _env_example: '.env.example',
  _dockerignore: '.dockerignore',
};

async function applyRenames(root: string): Promise<void> {
  for (const file of await walk(root)) {
    const renamed = RENAME_MAP[path.basename(file)];
    if (renamed) {
      await fs.rename(file, path.join(path.dirname(file), renamed));
    }
  }
}

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.json', '.html', '.htm',
  '.css', '.scss', '.sass', '.less', '.md', '.txt', '.yml', '.yaml', '.cs',
  '.csproj', '.props', '.targets', '.xml', '.config', '.svg', '.slnx', '.http',
]);

const TEXT_FILENAMES = new Set(['.gitignore', '.npmrc', '.editorconfig', '.env', '.env.example', '.dockerignore', 'Dockerfile']);

export function isTextFile(file: string): boolean {
  return TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()) || TEXT_FILENAMES.has(path.basename(file));
}

/**
 * Token style is deliberately `__TOKEN__` and not `{{TOKEN}}`: Vue and Angular
 * templates use `{{ }}` for interpolation and would be corrupted.
 */
export function replaceTokens(content: string, tokens: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(tokens)) {
    result = result.split(`__${key}__`).join(value);
  }
  return result;
}

export async function applyTokens(root: string, tokens: Record<string, string>): Promise<void> {
  for (const file of await walk(root)) {
    if (!isTextFile(file)) {
      continue;
    }
    const original = await fs.readFile(file, 'utf8');
    const next = replaceTokens(original, tokens);
    if (next !== original) {
      await fs.writeFile(file, next, 'utf8');
    }
  }
}

export interface CopyTemplateOptions {
  tokens?: Record<string, string>;
  /** Paths relative to the template root that must not be copied. */
  skip?: string[];
}

export async function copyTemplate(
  sourceDir: string,
  targetDir: string,
  options: CopyTemplateOptions = {},
): Promise<void> {
  const skip = new Set(options.skip ?? []);

  await fs.cp(sourceDir, targetDir, {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(sourceDir, source);
      if (relative === '') {
        return true;
      }
      if (relative.split(path.sep).some((segment) => IGNORED_DIRECTORIES.has(segment))) {
        return false;
      }
      return !skip.has(relative);
    },
  });

  await applyRenames(targetDir);

  if (options.tokens) {
    await applyTokens(targetDir, options.tokens);
  }
}
