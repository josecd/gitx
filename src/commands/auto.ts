import { ConfigManager } from '../config.js';
import { GitManager } from '../git.js';
import chalk from 'chalk';
import ora from 'ora';

export class AutoCommand {
  private configManager: ConfigManager;
  private gitManager: GitManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.gitManager = new GitManager();
  }

  async execute(options: { path?: string; enable?: boolean; disable?: boolean }): Promise<void> {
    const cwd = options.path || process.cwd();

    // Check if we're in a git repo
    const isRepo = await this.gitManager.isGitRepo(cwd);
    if (!isRepo) {
      console.log(chalk.red('❌ No estás en un repositorio Git'));
      process.exit(1);
    }

    const repoRoot = await this.gitManager.getRepoRoot(cwd);
    if (!repoRoot) {
      console.log(chalk.red('❌ No se pudo determinar la raíz del repositorio'));
      process.exit(1);
    }

    // Disable auto mode
    if (options.disable) {
      await this.configManager.removeFolderProfile(repoRoot);
      console.log(chalk.green('✓ Modo automático desactivado para esta carpeta'));
      return;
    }

    // Get or detect profile
    let profileName = await this.configManager.getFolderProfile(repoRoot);

    if (!profileName) {
      // Try to detect from git config
      const currentConfig = await this.gitManager.getCurrentConfig('local');
      
      if (currentConfig.email) {
        // Find matching profile
        const profiles = await this.configManager.listProfiles();
        for (const [name, profile] of Object.entries(profiles)) {
          if ((profile as any).email === currentConfig.email) {
            profileName = name;
            break;
          }
        }
      }

      if (!profileName) {
        console.log(chalk.yellow('⚠️  No se encontró un perfil configurado para esta carpeta'));
        console.log(chalk.dim('Usa: gitx switch <profile> para configurar un perfil'));
        return;
      }
    }

    // Enable auto mode
    if (options.enable !== false) {
      await this.configManager.setFolderProfile(repoRoot, profileName);
      console.log(chalk.green(`✓ Modo automático activado`));
      console.log(chalk.dim(`  Carpeta: ${repoRoot}`));
      console.log(chalk.dim(`  Perfil: ${profileName}`));
    }
  }

  async applyProfile(path: string = process.cwd()): Promise<boolean> {
    const isRepo = await this.gitManager.isGitRepo(path);
    if (!isRepo) return false;

    const repoRoot = await this.gitManager.getRepoRoot(path);
    if (!repoRoot) return false;

    const profileName = await this.configManager.getFolderProfile(repoRoot);
    if (!profileName) return false;

    const profile = await this.configManager.getProfile(profileName);
    if (!profile) return false;

    // Check if already applied
    const currentConfig = await this.gitManager.getCurrentConfig('local');
    if (currentConfig.email === profile.email && currentConfig.name === profile.name) {
      return false; // Already applied
    }

    // Apply profile
    await this.gitManager.setConfig(profile, 'local');
    
    console.log(chalk.cyan(`🔄 Perfil aplicado automáticamente: ${profileName}`));
    console.log(chalk.dim(`   ${profile.name} <${profile.email}>`));
    
    return true;
  }
}
