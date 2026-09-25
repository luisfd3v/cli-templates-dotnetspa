import { execa } from 'execa';

export interface RunOptions {
  cwd?: string;
  /** Receives the child's output line by line (used for clack `taskLog`). */
  onOutput?: (line: string) => void;
  env?: Record<string, string>;
}

export class CommandError extends Error {
  readonly command: string;
  readonly exitCode: number;
  readonly output: string;

  constructor(command: string, exitCode: number, output: string) {
    const tail = output.trim().split(/\r?\n/).slice(-25).join('\n');
    super(`Command failed (exit ${exitCode}): ${command}${tail ? `\n${tail}` : ''}`);
    this.name = 'CommandError';
    this.command = command;
    this.exitCode = exitCode;
    this.output = output;
  }
}

const BASE_ENV: Record<string, string> = {
  DOTNET_NOLOGO: '1',
  DOTNET_CLI_TELEMETRY_OPTOUT: '1',
  DOTNET_SKIP_FIRST_TIME_EXPERIENCE: '1',
};

interface SpawnResult {
  stdout: string;
  stderr: string;
}

async function spawn(cmd: string, args: string[], options: RunOptions): Promise<SpawnResult> {
  const child = execa(cmd, args, {
    cwd: options.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    reject: false,
    env: { ...BASE_ENV, ...options.env },
    windowsHide: true,
  });

  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];

  const consume = (stream: NodeJS.ReadableStream | null, sink: string[]): void => {
    if (!stream) {
      return;
    }
    stream.on('data', (chunk: Buffer | string) => {
      const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
      sink.push(text);
      if (options.onOutput) {
        for (const line of text.split(/\r?\n/)) {
          if (line.trim().length > 0) {
            options.onOutput(line.trimEnd());
          }
        }
      }
    });
  };

  consume(child.stdout, stdoutChunks);
  consume(child.stderr, stderrChunks);

  const result = await child;
  const stdout = stdoutChunks.join('');
  const stderr = stderrChunks.join('');

  if (result.exitCode !== 0) {
    throw new CommandError(`${cmd} ${args.join(' ')}`, result.exitCode ?? 1, `${stdout}\n${stderr}`);
  }

  return { stdout, stderr };
}

/** Runs a command and discards its output. */
export async function run(cmd: string, args: string[], options: RunOptions = {}): Promise<void> {
  await spawn(cmd, args, options);
}

/** Runs a command and returns its merged stdout. */
export async function capture(cmd: string, args: string[], options: RunOptions = {}): Promise<string> {
  const { stdout, stderr } = await spawn(cmd, args, options);
  return `${stdout}${stderr}`;
}

/** Returns true when the executable can be resolved and answers `--version`. */
export async function hasCommand(cmd: string): Promise<boolean> {
  try {
    await spawn(cmd, ['--version'], {});
    return true;
  } catch {
    return false;
  }
}
