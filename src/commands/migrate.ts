import { ConfigManager } from '../config.js';
import { GitManager } from '../git.js';
import { SSHManager } from '../ssh.js';
import chalk from 'chalk';
import inquirer from 'inquirer';

export class MigrateCommand {
  private configManager: ConfigManager;
  private gitManager: GitManager;
  private sshManager: SSHManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.gitManager = new GitManager();
    this.sshManager = new SSHManager();
  }

  async execute(): Promise<void> {
    console.log(chalk.bold.cyan('📦 GitX Migrate - Importar configuración existente\n'));

    // Get current global Git config
    const globalConfig = await this.gitManager.getCurrentConfig('global');

    if (!globalConfig.name || !globalConfig.email) {
      console.log(chalk.yellow('⚠️  No se encontró configuración global de Git'));
      console.log(chalk.dim('Asegúrate de tener configurado user.name y user.email'));
      return;
    }

    console.log(chalk.bold('Configuración global encontrada:'));
    console.log(chalk.dim(`  Nombre: ${globalConfig.name}`));
    console.log(chalk.dim(`  Email: ${globalConfig.email}`));
    if (globalConfig.signingKey) {
      console.log(chalk.dim(`  Clave de firma: ${globalConfig.signingKey}`));
    }

    console.log();

    // Ask user for profile name
    const { profileName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'profileName',
        message: '¿Qué nombre quieres darle a este perfil?',
        default: this.suggestProfileName(globalConfig.email || ''),
        validate: (input: string) => {
          if (!input.trim()) return 'El nombre no puede estar vacío';
          if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
            return 'El nombre solo puede contener letras, números, guiones y guiones bajos';
          }
          return true;
        }
      }
    ]);

    // Check if profile already exists
    const existingProfile = await this.configManager.getProfile(profileName);
    if (existingProfile) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `El perfil "${profileName}" ya existe. ¿Deseas sobrescribirlo?`,
          default: false
        }
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('Migración cancelada'));
        return;
      }
    }

    // Ask if user wants to setup SSH
    const { setupSSH } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setupSSH',
        message: '¿Configurar SSH automáticamente? (Recomendado)',
        default: true
      }
    ]);

    let sshKey: string | undefined;
    
    if (setupSSH) {
      try {
        const keyInfo = await this.sshManager.setupSSHForProfile(
          globalConfig.email!,
          profileName
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
          await this.sshManager.testConnection('github.com', profileName);
          await this.sshManager.testConnection('gitlab.com', profileName);
        }
      } catch (error: any) {
        console.log(chalk.red(`\n❌ Error configurando SSH: ${error.message}`));
        console.log(chalk.yellow('⚠️  El perfil se creará sin configuración SSH'));
      }
    } else {
      // Ask if user wants to associate existing SSH key
      const sshKeys = await this.sshManager.listKeys();
      
      if (sshKeys.length > 0) {
        const { selectSSH } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'selectSSH',
            message: '¿Deseas asociar una clave SSH existente a este perfil?',
            default: false
          }
        ]);

        if (selectSSH) {
          const { selectedKey } = await inquirer.prompt([
            {
              type: 'list',
              name: 'selectedKey',
              message: 'Selecciona la clave SSH:',
              choices: [...sshKeys, { name: 'Ninguna', value: null }]
            }
          ]);

          if (selectedKey) {
            sshKey = selectedKey;
          }
        }
      }
    }

    // Save profile
    await this.configManager.addProfile(profileName, {
      name: globalConfig.name!,
      email: globalConfig.email!,
      sshKey,
      signingKey: globalConfig.signingKey
    });

    console.log(chalk.green(`\n✓ Perfil "${profileName}" creado exitosamente`));

    // Ask if user wants to set as default
    const { setDefault } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setDefault',
        message: '¿Deseas establecer este perfil como predeterminado?',
        default: true
      }
    ]);

    if (setDefault) {
      await this.configManager.setDefaultProfile(profileName);
      console.log(chalk.green(`✓ Perfil "${profileName}" establecido como predeterminado`));
    }

    // Ask if user wants to enable auto mode for current directory
    const isRepo = await this.gitManager.isGitRepo();
    if (isRepo) {
      const { enableAuto } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'enableAuto',
          message: '¿Deseas activar el modo automático para este repositorio?',
          default: true
        }
      ]);

      if (enableAuto) {
        const repoRoot = await this.gitManager.getRepoRoot();
        if (repoRoot) {
          await this.configManager.setFolderProfile(repoRoot, profileName);
          console.log(chalk.green(`✓ Modo automático activado para: ${repoRoot}`));
        }
      }
    }

    console.log(chalk.cyan('\n🎉 Migración completada'));
    
    if (setupSSH) {
      console.log(chalk.cyan('\n📝 Próximos pasos:'));
      console.log(chalk.dim('  1. Agrega la clave pública a GitHub/GitLab (mostrada arriba)'));
      console.log(chalk.dim(`  2. Clona repos con: git clone git@github.com-${profileName}:usuario/repo.git`));
      console.log(chalk.dim('  3. O usa: gitx list para ver todos tus perfiles'));
    } else {
      console.log(chalk.dim('Usa: gitx list para ver todos tus perfiles'));
    }
  }

  private suggestProfileName(email: string): string {
    // Extract username from email
    const username = email.split('@')[0];
    const domain = email.split('@')[1]?.split('.')[0];
    
    if (domain && (domain === 'work' || domain === 'company' || domain.length < 10)) {
      return domain;
    }
    
    return username;
  }
}
