import { ConfigManager } from '../config.js';
import { GitManager } from '../git.js';
import chalk from 'chalk';
import inquirer from 'inquirer';

export class UnlinkCommand {
  private configManager: ConfigManager;
  private gitManager: GitManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.gitManager = new GitManager();
  }

  async execute(options: { path?: string; force?: boolean; global?: boolean }): Promise<void> {
    const cwd = options.path || process.cwd();

    // Check if in a git repo
    const isRepo = await this.gitManager.isGitRepo(cwd);
    if (!isRepo && !options.global) {
      console.log(chalk.red('❌ No estás en un repositorio Git'));
      console.log(chalk.dim('Usa --global para limpiar la configuración global'));
      process.exit(1);
    }

    if (options.global) {
      await this.unlinkGlobal(options.force);
    } else {
      await this.unlinkLocal(cwd, options.force);
    }
  }

  private async unlinkLocal(path: string, force?: boolean): Promise<void> {
    const repoRoot = await this.gitManager.getRepoRoot(path);
    if (!repoRoot) {
      console.log(chalk.red('❌ No se pudo determinar la raíz del repositorio'));
      process.exit(1);
    }

    const currentConfig = await this.gitManager.getCurrentConfig('local');
    const folderProfile = await this.configManager.getFolderProfile(repoRoot);

    console.log(chalk.bold.yellow('⚠️  Limpieza de repositorio local\n'));
    console.log(chalk.dim(`Repositorio: ${repoRoot}\n`));

    if (currentConfig.name || currentConfig.email) {
      console.log(chalk.bold('Configuración actual:'));
      if (currentConfig.name) console.log(chalk.dim(`  Nombre: ${currentConfig.name}`));
      if (currentConfig.email) console.log(chalk.dim(`  Email: ${currentConfig.email}`));
      if (currentConfig.signingKey) console.log(chalk.dim(`  Clave de firma: ${currentConfig.signingKey}`));
      console.log();
    }

    if (folderProfile) {
      console.log(chalk.bold('Modo automático:'));
      console.log(chalk.dim(`  Perfil asociado: ${folderProfile}`));
      console.log();
    }

    if (!currentConfig.name && !currentConfig.email && !folderProfile) {
      console.log(chalk.green('✓ El repositorio ya está limpio'));
      return;
    }

    // Ask for confirmation unless force flag is used
    if (!force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: '¿Deseas eliminar toda la configuración de este repositorio?',
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Operación cancelada'));
        return;
      }
    }

    // Remove local git config
    if (currentConfig.name || currentConfig.email) {
      await this.gitManager.unsetConfig('local');
      console.log(chalk.green('✓ Configuración local de Git eliminada'));
    }

    // Remove folder profile association
    if (folderProfile) {
      await this.configManager.removeFolderProfile(repoRoot);
      console.log(chalk.green('✓ Asociación de modo automático eliminada'));
    }

    console.log(chalk.cyan('\n🎉 Repositorio limpio'));
    console.log(chalk.dim('La configuración global de Git seguirá activa'));
  }

  private async unlinkGlobal(force?: boolean): Promise<void> {
    const currentConfig = await this.gitManager.getCurrentConfig('global');

    console.log(chalk.bold.yellow('⚠️  Limpieza de configuración global\n'));

    if (!currentConfig.name && !currentConfig.email) {
      console.log(chalk.green('✓ La configuración global ya está limpia'));
      return;
    }

    console.log(chalk.bold('Configuración global actual:'));
    if (currentConfig.name) console.log(chalk.dim(`  Nombre: ${currentConfig.name}`));
    if (currentConfig.email) console.log(chalk.dim(`  Email: ${currentConfig.email}`));
    if (currentConfig.signingKey) console.log(chalk.dim(`  Clave de firma: ${currentConfig.signingKey}`));
    console.log();

    console.log(chalk.red.bold('⚠️  ADVERTENCIA: Esto eliminará tu configuración global de Git'));
    console.log(chalk.dim('Tus perfiles en GitX no se verán afectados\n'));

    // Ask for confirmation unless force flag is used
    if (!force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: '¿Estás seguro de que deseas eliminar la configuración global?',
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Operación cancelada'));
        return;
      }
    }

    // Remove global git config
    await this.gitManager.unsetConfig('global');
    console.log(chalk.green('✓ Configuración global de Git eliminada'));

    console.log(chalk.cyan('\n🎉 Configuración global limpia'));
    console.log(chalk.dim('Usa: gitx switch <profile> para establecer un nuevo perfil'));
  }
}
