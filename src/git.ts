import { exec } from 'child_process';
import { promisify } from 'util';
import type { GitProfile } from './types.js';

const execAsync = promisify(exec);

export class GitManager {
  async getCurrentConfig(scope: 'local' | 'global' = 'local'): Promise<Partial<GitProfile>> {
    const flag = scope === 'local' ? '--local' : '--global';
    
    try {
      const { stdout: name } = await execAsync(`git config ${flag} user.name`).catch(() => ({ stdout: '' }));
      const { stdout: email } = await execAsync(`git config ${flag} user.email`).catch(() => ({ stdout: '' }));
      const { stdout: signingKey } = await execAsync(`git config ${flag} user.signingkey`).catch(() => ({ stdout: '' }));
      
      return {
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        signingKey: signingKey.trim() || undefined
      };
    } catch (error) {
      return {};
    }
  }

  async setConfig(profile: GitProfile, scope: 'local' | 'global' = 'local'): Promise<void> {
    const flag = scope === 'local' ? '--local' : '--global';
    
    await execAsync(`git config ${flag} user.name "${profile.name}"`);
    await execAsync(`git config ${flag} user.email "${profile.email}"`);
    
    if (profile.signingKey) {
      await execAsync(`git config ${flag} user.signingkey "${profile.signingKey}"`);
      await execAsync(`git config ${flag} commit.gpgsign true`);
    }
  }

  async unsetConfig(scope: 'local' | 'global' = 'local'): Promise<void> {
    const flag = scope === 'local' ? '--local' : '--global';
    
    try {
      await execAsync(`git config ${flag} --unset user.name`);
    } catch (error) {}
    
    try {
      await execAsync(`git config ${flag} --unset user.email`);
    } catch (error) {}
    
    try {
      await execAsync(`git config ${flag} --unset user.signingkey`);
    } catch (error) {}
    
    try {
      await execAsync(`git config ${flag} --unset commit.gpgsign`);
    } catch (error) {}
  }

  async isGitRepo(path: string = process.cwd()): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { cwd: path });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getRepoRoot(path: string = process.cwd()): Promise<string | null> {
    try {
      const { stdout } = await execAsync('git rev-parse --show-toplevel', { cwd: path });
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }

  async checkSSHConnection(host: string = 'github.com'): Promise<boolean> {
    try {
      const { stdout, stderr } = await execAsync(`ssh -T git@${host}`, { timeout: 5000 });
      return true;
    } catch (error: any) {
      // SSH connection to GitHub returns exit code 1 even on success
      return error.stderr?.includes('successfully authenticated') || 
             error.stdout?.includes('successfully authenticated');
    }
  }

  async listSSHKeys(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('ssh-add -l');
      return stdout.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.split(' ').pop() || '');
    } catch (error) {
      return [];
    }
  }
}
