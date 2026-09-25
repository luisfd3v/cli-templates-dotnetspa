import * as p from '@clack/prompts';
import pc from 'picocolors';

export { p };

export const log = {
  info: (message: string): void => p.log.info(message),
  step: (message: string): void => p.log.step(message),
  success: (message: string): void => p.log.success(message),
  warn: (message: string): void => p.log.warn(message),
  error: (message: string): void => p.log.error(message),
  message: (message: string): void => p.log.message(message),
};

export const bold = (value: string): string => pc.bold(value);
export const dim = (value: string): string => pc.dim(value);
export const cyan = (value: string): string => pc.cyan(value);
export const green = (value: string): string => pc.green(value);
export const red = (value: string): string => pc.red(value);
export const yellow = (value: string): string => pc.yellow(value);

/** Formats a command so it stands out when printed. */
export const cmd = (value: string): string => pc.cyan(pc.bold(value));

export function abort(message: string): never {
  p.cancel(message);
  process.exit(1);
}
