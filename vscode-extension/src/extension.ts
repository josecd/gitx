import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { homedir } from 'os';
import { join } from 'path';
import { readFile } from 'fs/promises';

const execAsync = promisify(exec);

interface GitXConfig {
  profiles: Record<string, { name: string; email: string }>;
  folderProfiles: Array<{ path: string; profile: string }>;
  defaultProfile?: string;
}

let statusBarItem: vscode.StatusBarItem;
let currentProfile: string | null = null;

export function activate(context: vscode.ExtensionContext) {
  console.log('GitX Status Bar extension activated');

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.command = 'gitx.switchProfile';
  context.subscriptions.push(statusBarItem);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('gitx.switchProfile', async () => {
      await switchProfile();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gitx.refreshStatus', async () => {
      await updateStatusBar();
    })
  );

  // Update status bar on folder change
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
      await updateStatusBar();
    })
  );

  // Update status bar on config change
  const configPath = join(homedir(), '.gitx', 'config.json');
  const watcher = vscode.workspace.createFileSystemWatcher(configPath);
  
  watcher.onDidChange(async () => {
    await updateStatusBar();
  });
  
  context.subscriptions.push(watcher);

  // Initial update
  updateStatusBar();
}

async function updateStatusBar() {
  const config = vscode.workspace.getConfiguration('gitx');
  
  if (!config.get('showInStatusBar', true)) {
    statusBarItem.hide();
    return;
  }

  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      statusBarItem.hide();
      return;
    }

    const folderPath = workspaceFolder.uri.fsPath;
    
    // Check if it's a git repository
    const isGitRepo = await checkGitRepo(folderPath);
    if (!isGitRepo) {
      statusBarItem.hide();
      return;
    }

    // Get repository root
    const repoRoot = await getRepoRoot(folderPath);
    if (!repoRoot) {
      statusBarItem.hide();
      return;
    }

    // Get GitX config
    const gitxConfig = await loadGitXConfig();
    if (!gitxConfig) {
      statusBarItem.text = '$(git-branch) GitX: No config';
      statusBarItem.tooltip = 'Click to setup GitX';
      statusBarItem.show();
      return;
    }

    // Find profile for this folder
    let profileName: string | undefined;
    let bestMatchLength = 0;

    for (const fp of gitxConfig.folderProfiles) {
      if (repoRoot.startsWith(fp.path) && fp.path.length > bestMatchLength) {
        profileName = fp.profile;
        bestMatchLength = fp.path.length;
      }
    }

    // Get current git config
    const gitConfig = await getCurrentGitConfig(folderPath);

    if (profileName) {
      const profile = gitxConfig.profiles[profileName];
      currentProfile = profileName;
      
      statusBarItem.text = `$(git-branch) ${profileName}`;
      statusBarItem.tooltip = profile 
        ? `GitX Profile: ${profileName}\n${profile.name} <${profile.email}>\n\nClick to switch profile`
        : `GitX Profile: ${profileName}\n\nClick to switch profile`;
      statusBarItem.backgroundColor = undefined;
    } else if (gitConfig.email) {
      // Check if matches any profile
      for (const [name, profile] of Object.entries(gitxConfig.profiles)) {
        if (profile.email === gitConfig.email) {
          currentProfile = name;
          statusBarItem.text = `$(git-branch) ${name}`;
          statusBarItem.tooltip = `Git Config: ${name}\n${profile.name} <${profile.email}>\n\n⚠️ Auto mode not enabled\nClick to switch profile`;
          statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
          break;
        }
      }
      
      if (!currentProfile) {
        statusBarItem.text = '$(git-branch) Custom';
        statusBarItem.tooltip = `Git Config: Custom\n${gitConfig.name || 'Unknown'} <${gitConfig.email}>\n\nClick to switch profile`;
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      }
    } else {
      currentProfile = null;
      statusBarItem.text = '$(git-branch) No profile';
      statusBarItem.tooltip = 'No Git profile configured\n\nClick to switch profile';
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }

    statusBarItem.show();
  } catch (error) {
    console.error('Error updating GitX status bar:', error);
    statusBarItem.hide();
  }
}

async function switchProfile() {
  try {
    const gitxConfig = await loadGitXConfig();
    if (!gitxConfig || Object.keys(gitxConfig.profiles).length === 0) {
      const result = await vscode.window.showInformationMessage(
        'No GitX profiles found. Would you like to run "gitx migrate" to import your current Git config?',
        'Open Terminal',
        'Cancel'
      );

      if (result === 'Open Terminal') {
        const terminal = vscode.window.createTerminal('GitX');
        terminal.show();
        terminal.sendText('gitx migrate');
      }
      return;
    }

    // Show profile picker
    const profiles = Object.entries(gitxConfig.profiles).map(([name, profile]) => ({
      label: name,
      description: `${profile.name} <${profile.email}>`,
      detail: name === currentProfile ? '• Currently active' : undefined,
      profile: name
    }));

    const selected = await vscode.window.showQuickPick(profiles, {
      placeHolder: 'Select a Git profile'
    });

    if (selected) {
      const terminal = vscode.window.createTerminal('GitX');
      terminal.show();
      terminal.sendText(`gitx switch ${selected.profile}`);
      
      // Refresh after a delay
      setTimeout(() => updateStatusBar(), 1000);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error switching profile: ${error}`);
  }
}

async function checkGitRepo(path: string): Promise<boolean> {
  try {
    await execAsync('git rev-parse --git-dir', { cwd: path });
    return true;
  } catch {
    return false;
  }
}

async function getRepoRoot(path: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync('git rev-parse --show-toplevel', { cwd: path });
    return stdout.trim();
  } catch {
    return null;
  }
}

async function getCurrentGitConfig(path: string): Promise<{ name?: string; email?: string }> {
  try {
    const { stdout: name } = await execAsync('git config --local user.name', { cwd: path }).catch(() => ({ stdout: '' }));
    const { stdout: email } = await execAsync('git config --local user.email', { cwd: path }).catch(() => ({ stdout: '' }));
    
    return {
      name: name.trim() || undefined,
      email: email.trim() || undefined
    };
  } catch {
    return {};
  }
}

async function loadGitXConfig(): Promise<GitXConfig | null> {
  try {
    const configPath = join(homedir(), '.gitx', 'config.json');
    const data = await readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}
