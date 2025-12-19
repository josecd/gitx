import { GitManager } from '../git.js';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import chalk from 'chalk';
import type { DoctorCheckResult } from '../types.js';

export class DoctorCommand {
  private gitManager: GitManager;

  constructor() {
    this.gitManager = new GitManager();
  }

  async execute(options: { fix?: boolean }): Promise<void> {
    console.log(chalk.bold.cyan('🏥 GitX Doctor - Diagnóstico del sistema\n'));

    const checks: DoctorCheckResult[] = [];

    // Check 1: Git installation
    checks.push(await this.checkGitInstallation());

    // Check 2: Git configuration
    checks.push(await this.checkGitConfig());

    // Check 3: SSH keys
    checks.push(await this.checkSSHKeys());

    // Check 4: SSH connection to GitHub
    checks.push(await this.checkGitHubConnection());

    // Check 5: SSH connection to GitLab
    checks.push(await this.checkGitLabConnection());

    // Check 6: GPG configuration
    checks.push(await this.checkGPGConfig());

    // Display results
    console.log(chalk.bold('\n📋 Resultados:\n'));
    
    let hasErrors = false;
    let hasWarnings = false;

    for (const check of checks) {
      const icon = check.status === 'ok' ? '✓' : check.status === 'warning' ? '⚠️' : '❌';
      const color = check.status === 'ok' ? chalk.green : check.status === 'warning' ? chalk.yellow : chalk.red;
      
      console.log(color(`${icon} ${check.name}`));
      console.log(chalk.dim(`  ${check.message}`));
      
      if (check.status === 'error') hasErrors = true;
      if (check.status === 'warning') hasWarnings = true;
    }

    // Auto-fix if requested
    if (options.fix) {
      console.log(chalk.bold.cyan('\n🔧 Aplicando correcciones...\n'));
      
      for (const check of checks) {
        if (check.status !== 'ok' && check.fix) {
          try {
            await check.fix();
            console.log(chalk.green(`✓ ${check.name} corregido`));
          } catch (error) {
            console.log(chalk.red(`❌ No se pudo corregir: ${check.name}`));
          }
        }
      }
    }

    // Summary
    console.log();
    if (!hasErrors && !hasWarnings) {
      console.log(chalk.green.bold('✓ Todo está configurado correctamente'));
    } else if (hasErrors) {
      console.log(chalk.red.bold('❌ Se encontraron errores que requieren atención'));
      if (!options.fix) {
        console.log(chalk.dim('Usa: gitx doctor --fix para intentar corregirlos automáticamente'));
      }
    } else {
      console.log(chalk.yellow.bold('⚠️  Se encontraron advertencias'));
    }
  }

  private async checkGitInstallation(): Promise<DoctorCheckResult> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync('git --version');
      return {
        name: 'Instalación de Git',
        status: 'ok',
        message: stdout.trim()
      };
    } catch (error) {
      return {
        name: 'Instalación de Git',
        status: 'error',
        message: 'Git no está instalado o no está en el PATH'
      };
    }
  }

  private async checkGitConfig(): Promise<DoctorCheckResult> {
    const config = await this.gitManager.getCurrentConfig('global');
    
    if (!config.name || !config.email) {
      return {
        name: 'Configuración global de Git',
        status: 'warning',
        message: 'Falta configuración de usuario (name/email)',
        fix: async () => {
          console.log(chalk.yellow('⚠️  Configura tu perfil con: gitx profile add <nombre>'));
        }
      };
    }

    return {
      name: 'Configuración global de Git',
      status: 'ok',
      message: `${config.name} <${config.email}>`
    };
  }

  private async checkSSHKeys(): Promise<DoctorCheckResult> {
    const sshDir = join(homedir(), '.ssh');
    
    try {
      const files = await fs.readdir(sshDir);
      const keyFiles = files.filter(f => 
        f.startsWith('id_') && !f.endsWith('.pub') && f !== 'id_rsa.pub'
      );

      if (keyFiles.length === 0) {
        return {
          name: 'Claves SSH',
          status: 'error',
          message: 'No se encontraron claves SSH',
          fix: async () => {
            console.log(chalk.yellow('Genera una clave SSH con:'));
            console.log(chalk.dim('  ssh-keygen -t ed25519 -C "tu@email.com"'));
          }
        };
      }

      const keys = await this.gitManager.listSSHKeys();
      if (keys.length === 0) {
        return {
          name: 'Claves SSH',
          status: 'warning',
          message: `${keyFiles.length} clave(s) encontrada(s), pero no agregadas al agente SSH`,
          fix: async () => {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            
            for (const keyFile of keyFiles) {
              try {
                await execAsync(`ssh-add ${join(sshDir, keyFile)}`);
              } catch (error) {}
            }
          }
        };
      }

      return {
        name: 'Claves SSH',
        status: 'ok',
        message: `${keys.length} clave(s) agregada(s) al agente`
      };
    } catch (error) {
      return {
        name: 'Claves SSH',
        status: 'error',
        message: 'No se pudo acceder al directorio .ssh'
      };
    }
  }

  private async checkGitHubConnection(): Promise<DoctorCheckResult> {
    const connected = await this.gitManager.checkSSHConnection('github.com');
    
    if (connected) {
      return {
        name: 'Conexión SSH a GitHub',
        status: 'ok',
        message: 'Conectado correctamente'
      };
    }

    return {
      name: 'Conexión SSH a GitHub',
      status: 'warning',
      message: 'No se pudo conectar (esto es normal si no usas GitHub)'
    };
  }

  private async checkGitLabConnection(): Promise<DoctorCheckResult> {
    const connected = await this.gitManager.checkSSHConnection('gitlab.com');
    
    if (connected) {
      return {
        name: 'Conexión SSH a GitLab',
        status: 'ok',
        message: 'Conectado correctamente'
      };
    }

    return {
      name: 'Conexión SSH a GitLab',
      status: 'warning',
      message: 'No se pudo conectar (esto es normal si no usas GitLab)'
    };
  }

  private async checkGPGConfig(): Promise<DoctorCheckResult> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync('gpg --list-secret-keys');
      
      if (stdout.trim().length === 0) {
        return {
          name: 'GPG (firma de commits)',
          status: 'warning',
          message: 'No se encontraron claves GPG (opcional)'
        };
      }

      return {
        name: 'GPG (firma de commits)',
        status: 'ok',
        message: 'Claves GPG configuradas'
      };
    } catch (error) {
      return {
        name: 'GPG (firma de commits)',
        status: 'warning',
        message: 'GPG no está instalado (opcional)'
      };
    }
  }
}
