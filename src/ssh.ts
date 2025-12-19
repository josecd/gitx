import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import chalk from 'chalk';
import { isWindows } from './platform.js';

const execAsync = promisify(exec);

export interface SSHKeyInfo {
  path: string;
  publicPath: string;
  exists: boolean;
  inAgent: boolean;
}

export class SSHManager {
  private sshDir = join(homedir(), '.ssh');
  private configFile = join(this.sshDir, 'config');

  async ensureSSHDir(): Promise<void> {
    try {
      if (isWindows) {
        await fs.mkdir(this.sshDir, { recursive: true });
      } else {
        await fs.mkdir(this.sshDir, { recursive: true, mode: 0o700 });
      }
    } catch (error) {
      // Directory exists
    }
  }

  async generateKey(email: string, profileName: string): Promise<SSHKeyInfo> {
    await this.ensureSSHDir();

    const keyPath = join(this.sshDir, `id_ed25519_${profileName}`);
    const publicPath = `${keyPath}.pub`;

    // Check if key already exists
    try {
      await fs.access(keyPath);
      console.log(chalk.yellow(`⚠️  La clave SSH ya existe: ${keyPath}`));
      return {
        path: keyPath,
        publicPath,
        exists: true,
        inAgent: await this.isKeyInAgent(keyPath)
      };
    } catch (error) {
      // Key doesn't exist, create it
    }

    console.log(chalk.cyan(`🔑 Generando clave SSH para ${profileName}...`));

    try {
      await execAsync(
        `ssh-keygen -t ed25519 -C "${email}" -f "${keyPath}" -N ""`
      );

      console.log(chalk.green(`✓ Clave SSH generada: ${keyPath}`));

      // Set proper permissions (skip on Windows)
      if (!isWindows) {
        await fs.chmod(keyPath, 0o600);
        await fs.chmod(publicPath, 0o644);
      }

      return {
        path: keyPath,
        publicPath,
        exists: true,
        inAgent: false
      };
    } catch (error: any) {
      throw new Error(`Error generando clave SSH: ${error.message}`);
    }
  }

  async addKeyToAgent(keyPath: string): Promise<void> {
    // Check if already in agent
    if (await this.isKeyInAgent(keyPath)) {
      console.log(chalk.dim(`  Clave ya está en el agente SSH`));
      return;
    }

    console.log(chalk.cyan(`🔐 Agregando clave al agente SSH...`));

    try {
      // Start ssh-agent if not running
      await execAsync('eval "$(ssh-agent -s)"').catch(() => {});

      // Add key to agent
      await execAsync(`ssh-add "${keyPath}"`);

      console.log(chalk.green(`✓ Clave agregada al agente SSH`));
    } catch (error: any) {
      console.log(chalk.yellow(`⚠️  No se pudo agregar al agente: ${error.message}`));
      console.log(chalk.dim(`  Puedes agregarla manualmente con: ssh-add ${keyPath}`));
    }
  }

  async isKeyInAgent(keyPath: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync('ssh-add -l');
      return stdout.includes(keyPath);
    } catch (error) {
      return false;
    }
  }

  async getPublicKey(publicPath: string): Promise<string> {
    try {
      const content = await fs.readFile(publicPath, 'utf-8');
      return content.trim();
    } catch (error) {
      throw new Error(`No se pudo leer la clave pública: ${publicPath}`);
    }
  }

  async configureSSHConfig(profileName: string, keyPath: string): Promise<void> {
    await this.ensureSSHDir();

    console.log(chalk.cyan(`📝 Configurando ~/.ssh/config...`));

    // Read existing config or create new
    let configContent = '';
    try {
      configContent = await fs.readFile(this.configFile, 'utf-8');
    } catch (error) {
      // File doesn't exist, will create new
    }

    // Check if profile already configured
    if (configContent.includes(`Host github.com-${profileName}`)) {
      console.log(chalk.yellow(`⚠️  Configuración SSH ya existe para ${profileName}`));
      return;
    }

    // Add GitHub configuration
    const githubConfig = `
# ${profileName} - GitHub
Host github.com-${profileName}
  HostName github.com
  User git
  IdentityFile ${keyPath}
  IdentitiesOnly yes

`;

    // Add GitLab configuration
    const gitlabConfig = `# ${profileName} - GitLab
Host gitlab.com-${profileName}
  HostName gitlab.com
  User git
  IdentityFile ${keyPath}
  IdentitiesOnly yes

`;

    // Append to config
    configContent += githubConfig + gitlabConfig;

    await fs.writeFile(this.configFile, configContent, { mode: 0o600 });

    console.log(chalk.green(`✓ Configuración SSH actualizada`));
    console.log(chalk.dim(`  GitHub: git@github.com-${profileName}:usuario/repo.git`));
    console.log(chalk.dim(`  GitLab: git@gitlab.com-${profileName}:usuario/repo.git`));
  }

  async displayPublicKey(publicPath: string, profileName: string): Promise<void> {
    const publicKey = await this.getPublicKey(publicPath);

    console.log(chalk.bold.cyan('\n📋 Clave pública SSH (cópiala a GitHub/GitLab):'));
    console.log(chalk.bold.white('\n' + '='.repeat(70)));
    console.log(chalk.green(publicKey));
    console.log(chalk.bold.white('='.repeat(70) + '\n'));

    console.log(chalk.bold('🔗 Para agregar esta clave:'));
    console.log(chalk.dim('  GitHub:'));
    console.log(chalk.dim('    1. Ve a: https://github.com/settings/ssh/new'));
    console.log(chalk.dim(`    2. Title: ${profileName}`));
    console.log(chalk.dim('    3. Pega la clave de arriba'));
    console.log(chalk.dim(''));
    console.log(chalk.dim('  GitLab:'));
    console.log(chalk.dim('    1. Ve a: https://gitlab.com/-/profile/keys'));
    console.log(chalk.dim(`    2. Title: ${profileName}`));
    console.log(chalk.dim('    3. Pega la clave de arriba'));
    console.log('');
  }

  async testConnection(host: string, profileName: string): Promise<boolean> {
    console.log(chalk.cyan(`🔌 Probando conexión SSH con ${host}...`));

    try {
      const sshHost = host.includes('.com') ? `${host.split('.com')[0]}.com-${profileName}` : host;
      const { stdout, stderr } = await execAsync(`ssh -T git@${sshHost}`, { timeout: 10000 });
      
      if (stdout.includes('successfully authenticated') || 
          stderr.includes('successfully authenticated')) {
        console.log(chalk.green(`✓ Conexión exitosa con ${host}`));
        return true;
      }
      
      return false;
    } catch (error: any) {
      if (error.stderr?.includes('successfully authenticated')) {
        console.log(chalk.green(`✓ Conexión exitosa con ${host}`));
        return true;
      }
      
      console.log(chalk.yellow(`⚠️  No se pudo conectar con ${host}`));
      console.log(chalk.dim(`  Asegúrate de haber agregado la clave pública a tu cuenta`));
      return false;
    }
  }

  async listKeys(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('ssh-add -l');
      return stdout.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => {
          const parts = line.split(' ');
          return parts[parts.length - 1] || '';
        });
    } catch (error) {
      return [];
    }
  }

  async setupSSHForProfile(email: string, profileName: string): Promise<SSHKeyInfo> {
    console.log(chalk.bold.cyan(`\n🔐 Configurando SSH para perfil: ${profileName}\n`));

    // 1. Generate SSH key
    const keyInfo = await this.generateKey(email, profileName);

    // 2. Add to SSH agent
    await this.addKeyToAgent(keyInfo.path);

    // 3. Configure SSH config file
    await this.configureSSHConfig(profileName, keyInfo.path);

    // 4. Display public key
    await this.displayPublicKey(keyInfo.publicPath, profileName);

    return keyInfo;
  }
}
