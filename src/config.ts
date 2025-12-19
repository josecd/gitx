import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { GitXConfig, GitProfile, FolderProfile } from './types.js';

const CONFIG_DIR = join(homedir(), '.gitx');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export class ConfigManager {
  private config: GitXConfig | null = null;

  async ensureConfigDir(): Promise<void> {
    try {
      await fs.mkdir(CONFIG_DIR, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  async load(): Promise<GitXConfig> {
    if (this.config) return this.config;

    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf-8');
      this.config = JSON.parse(data);
    } catch (error) {
      this.config = {
        profiles: {},
        folderProfiles: []
      };
    }

    return this.config!;
  }

  async save(config: GitXConfig): Promise<void> {
    await this.ensureConfigDir();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
    this.config = config;
  }

  async addProfile(name: string, profile: GitProfile): Promise<void> {
    const config = await this.load();
    config.profiles[name] = profile;
    await this.save(config);
  }

  async removeProfile(name: string): Promise<void> {
    const config = await this.load();
    delete config.profiles[name];
    config.folderProfiles = config.folderProfiles.filter(fp => fp.profile !== name);
    if (config.defaultProfile === name) {
      delete config.defaultProfile;
    }
    await this.save(config);
  }

  async getProfile(name: string): Promise<GitProfile | undefined> {
    const config = await this.load();
    return config.profiles[name];
  }

  async listProfiles(): Promise<Record<string, GitProfile>> {
    const config = await this.load();
    return config.profiles;
  }

  async setFolderProfile(path: string, profileName: string): Promise<void> {
    const config = await this.load();
    
    // Remove existing folder profile for this path
    config.folderProfiles = config.folderProfiles.filter(fp => fp.path !== path);
    
    // Add new folder profile
    config.folderProfiles.push({ path, profile: profileName });
    await this.save(config);
  }

  async getFolderProfile(path: string): Promise<string | undefined> {
    const config = await this.load();
    
    // Find the most specific matching folder profile
    let bestMatch: FolderProfile | undefined;
    let bestMatchLength = 0;

    for (const fp of config.folderProfiles) {
      if (path.startsWith(fp.path) && fp.path.length > bestMatchLength) {
        bestMatch = fp;
        bestMatchLength = fp.path.length;
      }
    }

    return bestMatch?.profile;
  }

  async removeFolderProfile(path: string): Promise<void> {
    const config = await this.load();
    config.folderProfiles = config.folderProfiles.filter(fp => fp.path !== path);
    await this.save(config);
  }

  async setDefaultProfile(name: string): Promise<void> {
    const config = await this.load();
    config.defaultProfile = name;
    await this.save(config);
  }

  async getDefaultProfile(): Promise<string | undefined> {
    const config = await this.load();
    return config.defaultProfile;
  }
}
