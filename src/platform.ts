import { platform } from 'os';

export const isWindows = platform() === 'win32';
export const isMac = platform() === 'darwin';
export const isLinux = platform() === 'linux';

export function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || '';
}

export function getShell(): string {
  if (isWindows) {
    return process.env.SHELL || process.env.ComSpec || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/bash';
}

export function normalizeCommand(command: string): string {
  // En Windows, asegurar que usamos comandos compatibles
  if (isWindows) {
    // Git debería estar en PATH en Windows
    return command;
  }
  return command;
}
