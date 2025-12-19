import { ConfigManager } from '../config.js';
import { GitManager } from '../git.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import inquirer from 'inquirer';

const execAsync = promisify(exec);

export class RemoteCommand {
  private configManager: ConfigManager;
  private gitManager: GitManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.gitManager = new GitManager();
  }

  async add(url: string, options: { name?: string }): Promise<void> {
    const remoteName = options.name || 'origin';

    // Check if in a git repo
    const isRepo = await this.gitManager.isGitRepo();
    if (!isRepo) {
      console.log(chalk.red('❌ No estás en un repositorio Git'));
      process.exit(1);
    }

    // Get current profile
    const repoRoot = await this.gitManager.getRepoRoot();
    if (!repoRoot) {
      console.log(chalk.red('❌ No se pudo determinar la raíz del repositorio'));
      process.exit(1);
    }

    const profileName = await this.configManager.getFolderProfile(repoRoot);
    
    if (!profileName) {
      console.log(chalk.yellow('⚠️  No hay perfil configurado para esta carpeta'));
      console.log(chalk.dim('Agregando remote sin modificar...'));
      await execAsync(`git remote add ${remoteName} ${url}`);
      return;
    }

    // Transform URL to use profile-specific host
    const transformedUrl = this.transformURL(url, profileName);

    console.log(chalk.cyan(`🔗 Agregando remote con perfil: ${profileName}`));
    console.log(chalk.dim(`  Remote: ${remoteName}`));
    console.log(chalk.dim(`  URL original: ${url}`));
    console.log(chalk.dim(`  URL transformada: ${transformedUrl}`));

    try {
      await execAsync(`git remote add ${remoteName} ${transformedUrl}`);
      console.log(chalk.green(`\n✓ Remote "${remoteName}" agregado exitosamente`));
    } catch (error: any) {
      console.log(chalk.red(`❌ Error agregando remote: ${error.message}`));
      process.exit(1);
    }
  }

  async fix(): Promise<void> {
    // Check if in a git repo
    const isRepo = await this.gitManager.isGitRepo();
    if (!isRepo) {
      console.log(chalk.red('❌ No estás en un repositorio Git'));
      process.exit(1);
    }

    // Get current profile
    const repoRoot = await this.gitManager.getRepoRoot();
    if (!repoRoot) {
      console.log(chalk.red('❌ No se pudo determinar la raíz del repositorio'));
      process.exit(1);
    }

    const profileName = await this.configManager.getFolderProfile(repoRoot);
    
    if (!profileName) {
      console.log(chalk.yellow('⚠️  No hay perfil configurado para esta carpeta'));
      console.log(chalk.dim('Usa: gitx switch <perfil> primero'));
      process.exit(1);
    }

    console.log(chalk.bold.cyan(`🔧 Arreglando remotes para perfil: ${profileName}\n`));

    // Get all remotes
    try {
      const { stdout } = await execAsync('git remote -v');
      const lines = stdout.split('\n').filter(line => line.includes('(push)'));
      
      if (lines.length === 0) {
        console.log(chalk.yellow('⚠️  No hay remotes configurados'));
        return;
      }

      const remotes: Array<{ name: string; url: string }> = [];
      
      for (const line of lines) {
        const match = line.match(/^(\S+)\s+(\S+)\s+\(push\)/);
        if (match) {
          remotes.push({ name: match[1], url: match[2] });
        }
      }

      console.log(chalk.bold('Remotes actuales:\n'));
      
      for (const remote of remotes) {
        const transformedUrl = this.transformURL(remote.url, profileName);
        const needsUpdate = remote.url !== transformedUrl;

        console.log(chalk.bold(`${remote.name}:`));
        console.log(chalk.dim(`  Actual: ${remote.url}`));
        
        if (needsUpdate) {
          console.log(chalk.cyan(`  Nuevo:  ${transformedUrl}`));
        } else {
          console.log(chalk.green(`  ✓ Ya está correcto`));
        }
        console.log();
      }

      // Ask to update
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: '¿Actualizar los remotes?',
          default: true
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Operación cancelada'));
        return;
      }

      // Update remotes
      for (const remote of remotes) {
        const transformedUrl = this.transformURL(remote.url, profileName);
        
        if (remote.url !== transformedUrl) {
          await execAsync(`git remote set-url ${remote.name} ${transformedUrl}`);
          console.log(chalk.green(`✓ Remote "${remote.name}" actualizado`));
        }
      }

      console.log(chalk.cyan('\n🎉 Remotes actualizados'));
      
    } catch (error: any) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  }

  async clone(url: string, options: { directory?: string }): Promise<void> {
    // Get current or default profile
    let profileName = await this.configManager.getDefaultProfile();
    
    if (!profileName) {
      const profiles = await this.configManager.listProfiles();
      const profileNames = Object.keys(profiles);
      
      if (profileNames.length === 0) {
        console.log(chalk.yellow('⚠️  No hay perfiles configurados'));
        console.log(chalk.dim('Usa: gitx profile add para crear uno'));
        console.log(chalk.dim('Clonando sin perfil...'));
        
        const dir = options.directory || '';
        await execAsync(`git clone ${url} ${dir}`);
        return;
      }

      // Ask which profile to use
      const { selectedProfile } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedProfile',
          message: 'Selecciona el perfil para este repositorio:',
          choices: profileNames
        }
      ]);

      profileName = selectedProfile;
    }

    // Transform URL
    const transformedUrl = this.transformURL(url, profileName!);

    console.log(chalk.cyan(`🔗 Clonando con perfil: ${profileName}`));
    console.log(chalk.dim(`  URL: ${transformedUrl}`));

    try {
      const dir = options.directory || '';
      const command = `git clone ${transformedUrl} ${dir}`.trim();
      
      // Use spawn-like approach for git clone to show output
      const { exec } = await import('child_process');
      const child = exec(command);
      
      child.stdout?.pipe(process.stdout);
      child.stderr?.pipe(process.stderr);
      
      await new Promise((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            resolve(code);
          } else {
            reject(new Error(`Git clone failed with code ${code}`));
          }
        });
      });

      // Get the cloned directory name
      const repoName = dir || url.split('/').pop()?.replace('.git', '') || '';
      const repoPath = process.cwd() + '/' + repoName;

      // Set profile for the cloned repo
      try {
        await this.configManager.setFolderProfile(repoPath, profileName!);
        console.log(chalk.green(`\n✓ Modo automático activado para: ${repoPath}`));
      } catch (error) {
        // Ignore error
      }

    } catch (error: any) {
      // Error already shown in console
      process.exit(1);
    }
  }

  private transformURL(url: string, profileName: string): string {
    // Handle different URL formats
    
    // SSH format: git@github.com:user/repo.git
    if (url.startsWith('git@github.com:')) {
      return url.replace('git@github.com:', `git@github.com-${profileName}:`);
    }
    
    if (url.startsWith('git@gitlab.com:')) {
      return url.replace('git@gitlab.com:', `git@gitlab.com-${profileName}:`);
    }

    // HTTPS format: https://github.com/user/repo.git
    // Convert to SSH with profile
    if (url.includes('github.com') && url.startsWith('https://')) {
      const path = url.replace('https://github.com/', '');
      return `git@github.com-${profileName}:${path}`;
    }

    if (url.includes('gitlab.com') && url.startsWith('https://')) {
      const path = url.replace('https://gitlab.com/', '');
      return `git@gitlab.com-${profileName}:${path}`;
    }

    // Already has profile suffix, update it
    if (url.includes('github.com-') || url.includes('gitlab.com-')) {
      return url.replace(/(github|gitlab)\.com-\w+/, `$1.com-${profileName}`);
    }

    // Unknown format, return as-is
    return url;
  }
}
