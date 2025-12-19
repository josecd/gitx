import { ConfigManager } from '../config.js';
import { GitManager } from '../git.js';
import { SSHManager } from '../ssh.js';
import chalk from 'chalk';
import inquirer from 'inquirer';

export class ProfileCommands {
  private configManager: ConfigManager;
  private gitManager: GitManager;
  private sshManager: SSHManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.gitManager = new GitManager();
    this.sshManager = new SSHManager();
  }

  async add(): Promise<void> {
    console.log(chalk.bold.cyan('➕ Agregar nuevo perfil\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'profileName',
        message: 'Nombre del perfil:',
        validate: (input: string) => {
          if (!input.trim()) return 'El nombre no puede estar vacío';
          if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
            return 'El nombre solo puede contener letras, números, guiones y guiones bajos';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'name',
        message: 'Nombre completo:',
        validate: (input: string) => input.trim() ? true : 'El nombre no puede estar vacío'
      },
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        validate: (input: string) => {
          if (!input.trim()) return 'El email no puede estar vacío';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
            return 'Email inválido';
          }
          return true;
        }
      },
      {
        type: 'confirm',
        name: 'setupSSH',
        message: '¿Configurar SSH automáticamente? (Recomendado)',
        default: true
      },
      {
        type: 'input',
        name: 'signingKey',
        message: 'Clave GPG para firma de commits (opcional):',
        default: ''
      }
    ]);

    // Setup SSH if requested
    let sshKey: string | undefined;
    if (answers.setupSSH) {
      try {
        const keyInfo = await this.sshManager.setupSSHForProfile(
          answers.email,
          answers.profileName
        );
        sshKey = keyInfo.path;

        // Ask to test connection
        const { testNow } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'testNow',
            message: '¿Ya agregaste la clave a GitHub/GitLab y quieres probar la conexión?',
            default: false
          }
        ]);

        if (testNow) {
          await this.sshManager.testConnection('github.com', answers.profileName);
          await this.sshManager.testConnection('gitlab.com', answers.profileName);
        }
      } catch (error: any) {
        console.log(chalk.red(`\n❌ Error configurando SSH: ${error.message}`));
        console.log(chalk.yellow('⚠️  El perfil se creará sin configuración SSH'));
      }
    }

    await this.configManager.addProfile(answers.profileName, {
      name: answers.name,
      email: answers.email,
      sshKey,
      signingKey: answers.signingKey || undefined
    });

    console.log(chalk.green(`\n✓ Perfil "${answers.profileName}" creado exitosamente`));

    if (answers.setupSSH) {
      console.log(chalk.cyan('\n📝 Próximos pasos:'));
      console.log(chalk.dim('  1. Agrega la clave pública a GitHub/GitLab (mostrada arriba)'));
      console.log(chalk.dim(`  2. Clona repos con: git clone git@github.com-${answers.profileName}:usuario/repo.git`));
      console.log(chalk.dim(`  3. O usa: gitx switch ${answers.profileName} en repos existentes`));
    }
  }

  async list(): Promise<void> {
    const profiles = await this.configManager.listProfiles();
    const defaultProfile = await this.configManager.getDefaultProfile();
    const config = await this.configManager.load();

    if (Object.keys(profiles).length === 0) {
      console.log(chalk.yellow('No hay perfiles configurados'));
      console.log(chalk.dim('Usa: gitx profile add para crear uno'));
      return;
    }

    console.log(chalk.bold.cyan('📋 Perfiles configurados:\n'));

    for (const [name, profile] of Object.entries(profiles)) {
      const isDefault = name === defaultProfile;
      const icon = isDefault ? '★' : '○';
      const color = isDefault ? chalk.yellow : chalk.white;

      console.log(color(`${icon} ${name}`));
      console.log(chalk.dim(`  ${profile.name} <${profile.email}>`));
      
      if (profile.signingKey) {
        console.log(chalk.dim(`  GPG: ${profile.signingKey}`));
      }

      // Show folder associations
      const folders = config.folderProfiles
        .filter(fp => fp.profile === name)
        .map(fp => fp.path);

      if (folders.length > 0) {
        console.log(chalk.dim(`  Auto: ${folders.join(', ')}`));
      }

      console.log();
    }

    if (defaultProfile) {
      console.log(chalk.dim(`★ = perfil predeterminado`));
    }
  }

  async switch(profileName: string, options: { global?: boolean }): Promise<void> {
    const profile = await this.configManager.getProfile(profileName);

    if (!profile) {
      console.log(chalk.red(`❌ Perfil "${profileName}" no encontrado`));
      console.log(chalk.dim('Usa: gitx list para ver los perfiles disponibles'));
      process.exit(1);
    }

    if (options.global) {
      await this.gitManager.setConfig(profile, 'global');
      await this.configManager.setDefaultProfile(profileName);
      console.log(chalk.green(`✓ Perfil global cambiado a: ${profileName}`));
    } else {
      const isRepo = await this.gitManager.isGitRepo();
      
      if (!isRepo) {
        console.log(chalk.red('❌ No estás en un repositorio Git'));
        console.log(chalk.dim('Usa --global para cambiar el perfil global'));
        process.exit(1);
      }

      await this.gitManager.setConfig(profile, 'local');
      console.log(chalk.green(`✓ Perfil local cambiado a: ${profileName}`));

      // Ask if user wants to enable auto mode
      const { enableAuto } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'enableAuto',
          message: '¿Activar modo automático para este repositorio?',
          default: true
        }
      ]);

      if (enableAuto) {
        const repoRoot = await this.gitManager.getRepoRoot();
        if (repoRoot) {
          await this.configManager.setFolderProfile(repoRoot, profileName);
          console.log(chalk.green(`✓ Modo automático activado`));
        }
      }
    }

    console.log(chalk.dim(`  ${profile.name} <${profile.email}>`));
  }

  async remove(profileName: string): Promise<void> {
    const profile = await this.configManager.getProfile(profileName);

    if (!profile) {
      console.log(chalk.red(`❌ Perfil "${profileName}" no encontrado`));
      process.exit(1);
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `¿Eliminar el perfil "${profileName}"?`,
        default: false
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Operación cancelada'));
      return;
    }

    await this.configManager.removeProfile(profileName);
    console.log(chalk.green(`✓ Perfil "${profileName}" eliminado`));
  }

  async current(): Promise<void> {
    const isRepo = await this.gitManager.isGitRepo();

    if (isRepo) {
      const localConfig = await this.gitManager.getCurrentConfig('local');
      const repoRoot = await this.gitManager.getRepoRoot();
      const folderProfile = repoRoot ? await this.configManager.getFolderProfile(repoRoot) : undefined;

      console.log(chalk.bold.cyan('📍 Configuración actual (local):\n'));

      if (localConfig.name || localConfig.email) {
        console.log(chalk.bold('Git config local:'));
        if (localConfig.name) console.log(chalk.dim(`  Nombre: ${localConfig.name}`));
        if (localConfig.email) console.log(chalk.dim(`  Email: ${localConfig.email}`));
        if (localConfig.signingKey) console.log(chalk.dim(`  GPG: ${localConfig.signingKey}`));
      } else {
        console.log(chalk.yellow('No hay configuración local'));
      }

      if (folderProfile) {
        console.log(chalk.dim(`\nModo auto: ${folderProfile}`));
      }

      console.log();
    }

    const globalConfig = await this.gitManager.getCurrentConfig('global');
    const defaultProfile = await this.configManager.getDefaultProfile();

    console.log(chalk.bold.cyan('🌍 Configuración global:\n'));

    if (globalConfig.name || globalConfig.email) {
      console.log(chalk.bold('Git config global:'));
      if (globalConfig.name) console.log(chalk.dim(`  Nombre: ${globalConfig.name}`));
      if (globalConfig.email) console.log(chalk.dim(`  Email: ${globalConfig.email}`));
      if (globalConfig.signingKey) console.log(chalk.dim(`  GPG: ${globalConfig.signingKey}`));
    } else {
      console.log(chalk.yellow('No hay configuración global'));
    }

    if (defaultProfile) {
      console.log(chalk.dim(`\nPerfil predeterminado: ${defaultProfile}`));
    }
  }
}
