import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { homedir } from 'os';

// Import our compiled modules from the parent project
import { ConfigManager } from '../dist/config.js';
import { GitManager } from '../dist/git.js';
import { SSHManager } from '../dist/ssh.js';

const execAsync = promisify(exec);
const app = express();
let PORT = 3001;
const portArgIndex = process.argv.indexOf('--port');
if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
  PORT = parseInt(process.argv[portArgIndex + 1], 10);
} else if (process.env.PORT) {
  PORT = parseInt(process.env.PORT, 10);
}

app.use(cors());
app.use(express.json());

const configManager = new ConfigManager();
const gitManager = new GitManager();
const sshManager = new SSHManager();

// Helper to get basename of a path
function getBasename(filePath) {
  return filePath.split(/[/\\]/).pop();
}

// ----------------------------------
// API Endpoints
// ----------------------------------

// 1. GET /api/config
app.get('/api/config', async (req, res) => {
  try {
    const config = await configManager.load();
    
    // Si no hay repositorios asociados en la configuración real,
    // vamos a auto-agregar el actual y el api-core (si existen)
    // para que la interfaz no empiece totalmente en blanco.
    let updated = false;
    
    if (config.folderProfiles.length === 0) {
      const rootRepo = '/Users/alex/Documents/personal';
      const apiCoreRepo = '/Users/alex/Documents/alify/api-core';
      
      const hasRoot = await gitManager.isGitRepo(rootRepo);
      if (hasRoot) {
        config.folderProfiles.push({ path: rootRepo, profile: config.defaultProfile || 'personal' });
        updated = true;
      }
      
      const hasApiCore = await gitManager.isGitRepo(apiCoreRepo);
      if (hasApiCore) {
        config.folderProfiles.push({ path: apiCoreRepo, profile: 'work' });
        // Asegurarse de que el perfil 'work' existe
        if (!config.profiles['work']) {
          config.profiles['work'] = {
            name: 'Alex Developer',
            email: 'alex@company.com',
            sshKey: `${homedir()}/.ssh/id_ed25519_work`
          };
        }
        updated = true;
      }
      
      if (updated) {
        await configManager.save(config);
      }
    }
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET /api/repo-status
app.get('/api/repo-status', async (req, res) => {
  const repoPath = req.query.path;
  if (!repoPath) {
    return res.status(400).json({ error: 'Falta el parámetro path' });
  }

  try {
    const isRepo = await gitManager.isGitRepo(repoPath);
    if (!isRepo) {
      return res.status(400).json({ error: 'La ruta no es un repositorio Git válido' });
    }

    // 2.1. Obtener los commits reales
    // Formato: hash|subject|author|relativeDate
    let commits = [];
    try {
      const { stdout: commitsOut } = await execAsync('git log -n 15 --pretty=format:"%H|%s|%an|%cr"', { cwd: repoPath });
      commits = commitsOut.split('\n')
        .filter(line => line.trim().length > 0)
        .map((line, idx) => {
          const [hash, title, author, date] = line.split('|');
          return {
            id: `c_${hash.substring(0, 7)}`,
            title,
            author,
            date: date || 'Reciente',
            hash: hash.substring(0, 7),
            fullHash: hash
          };
        });
    } catch (e) {
      // Si el repositorio es nuevo y no tiene commits
      commits = [{ id: 'empty', title: 'Repositorio sin commits aún', author: 'N/A', date: 'N/A', hash: '0000000' }];
    }

    // 2.2. Obtener archivos modificados
    let changes = [];
    try {
      // git status --porcelain
      const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd: repoPath });
      const statusLines = statusOut.split('\n').filter(line => line.trim().length > 0);

      // git diff HEAD --numstat to get total stats (staged + unstaged) vs HEAD
      const { stdout: numstatOut } = await execAsync('git diff HEAD --numstat', { cwd: repoPath }).catch(() => ({ stdout: '' }));
      const numstatLines = numstatOut.split('\n').filter(line => line.trim().length > 0);
      const statMap = new Map();
      numstatLines.forEach(line => {
        const [add, del, file] = line.split(/\s+/);
        statMap.set(file, { additions: parseInt(add) || 0, deletions: parseInt(del) || 0 });
      });

      changes = statusLines.map((line, idx) => {
        const indexStatus = line[0];
        const workStatus = line[1];
        const statusCode = line.substring(0, 2).trim();
        const filePath = line.substring(3).trim();
        
        let status = 'modified';
        if (statusCode === 'A' || statusCode === '??') status = 'added';
        if (statusCode === 'D') status = 'deleted';

        let stagingState = 'unstaged'; // 'staged', 'unstaged', 'partially-staged'
        if (indexStatus !== ' ' && indexStatus !== '?' && workStatus === ' ') {
          stagingState = 'staged';
        } else if ((indexStatus === ' ' || indexStatus === '?') && workStatus !== ' ') {
          stagingState = 'unstaged';
        } else if (indexStatus !== ' ' && indexStatus !== '?' && workStatus !== ' ') {
          stagingState = 'partially-staged';
        }

        const stats = statMap.get(filePath) || { additions: 0, deletions: 0 };

        return {
          id: `f_${idx}`,
          name: getBasename(filePath),
          path: filePath,
          status,
          stagingState,
          additions: stats.additions || (status === 'added' ? 10 : 1),
          deletions: stats.deletions || (status === 'deleted' ? 10 : 0),
          type: 'code'
        };
      });
    } catch (e) {
      console.error('Error leyendo status:', e);
    }

    // 2.3. Obtener rama actual y comprobar si tiene un stash de GitX
    let stashedChanges = null;
    try {
      const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath });
      const currentBranch = branchOut.trim();
      
      const { stdout: stashList } = await execAsync('git stash list', { cwd: repoPath });
      const lines = stashList.split('\n').filter(l => l.trim().length > 0);
      
      const index = lines.findIndex(line => {
        return line.includes(`GitX-Stash: ${currentBranch}`) || 
               line.includes(`WIP on ${currentBranch}:`) || 
               line.includes(`On ${currentBranch}:`) ||
               line.includes(`!!GitHub_Desktop<${currentBranch}>`);
      });
      if (index !== -1) {
        stashedChanges = {
          id: `stash@{${index}}`,
          message: lines[index],
          branch: currentBranch
        };
      }
    } catch (e) {
      console.error('Error checking stash list:', e.message);
    }

    res.json({ commits, changes, stashedChanges });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to parse diff text into structured lines with line numbers
function parseDiffLines(diffText) {
  if (!diffText || !diffText.trim()) return [];
  const lines = diffText.split('\n');
  const parsed = [];
  let lnL = 0, lnR = 0;
  let inHunk = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    let type = 'context';
    let numL = '';
    let numR = '';
    let marker = ' ';
    let code = rawLine;

    if (rawLine.startsWith('@@')) {
      type = 'info';
      marker = '@@';
      inHunk = true;
      const m = rawLine.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) {
        lnL = parseInt(m[1]);
        lnR = parseInt(m[2]);
      }
      parsed.push({ type, content: rawLine, numL: '', numR: '' });
    } else if (!inHunk) {
      type = 'info';
      parsed.push({ type, content: rawLine, numL: '', numR: '' });
    } else if (rawLine.startsWith('-')) {
      type = 'deletion';
      marker = '-';
      code = rawLine.slice(1);
      numL = lnL++;
      parsed.push({ type, content: rawLine, numL, numR: '', code, marker });
    } else if (rawLine.startsWith('+')) {
      type = 'addition';
      marker = '+';
      code = rawLine.slice(1);
      numR = lnR++;
      parsed.push({ type, content: rawLine, numL: '', numR, code, marker });
    } else if (rawLine.startsWith('\\')) {
      type = 'info';
      parsed.push({ type, content: rawLine, numL: '', numR: '' });
    } else {
      type = 'context';
      numL = lnL++;
      numR = lnR++;
      parsed.push({ type, content: rawLine, numL, numR });
    }
  }
  return parsed;
}

// 3. GET /api/repo-diff
app.get('/api/repo-diff', async (req, res) => {
  const repoPath = req.query.path;
  const filePath = req.query.file;

  if (!repoPath || !filePath) {
    return res.status(400).json({ error: 'Falta path o file' });
  }

  try {
    let diff = '';
    let lines = [];
    try {
      const { stdout: status } = await execAsync(`git status --porcelain "${filePath}"`, { cwd: repoPath });
      
      if (status.includes('??')) {
        // Untracked, leer contenido
        const absolutePath = path.join(repoPath, filePath);
        const content = await fs.readFile(absolutePath, 'utf-8');
        const fileLines = content.split('\n');
        diff = `@@ -0,0 +1,${fileLines.length} @@\n` + fileLines.map(line => `+${line}`).join('\n');
        
        // Build lines manually for untracked file
        lines = [
          { type: 'info', content: `diff --git a/${filePath} b/${filePath}`, numL: '', numR: '' },
          { type: 'info', content: `new file mode 100644`, numL: '', numR: '' },
          { type: 'info', content: `--- /dev/null`, numL: '', numR: '' },
          { type: 'info', content: `+++ b/${filePath}`, numL: '', numR: '' },
          { type: 'info', content: `@@ -0,0 +1,${fileLines.length} @@`, numL: '', numR: '' }
        ];
        
        fileLines.forEach((lineText, idx) => {
          lines.push({
            type: 'addition',
            content: `+${lineText}`,
            numL: '',
            numR: idx + 1,
            code: lineText,
            marker: '+',
            changeIndex: idx,
            staged: false
          });
        });
      } else {
        const { stdout: totalDiff } = await execAsync(`git diff HEAD -- "${filePath}"`, { cwd: repoPath }).catch(() => ({ stdout: '' }));
        diff = totalDiff || 'Sin cambios detectados en el área de trabajo.';

        if (totalDiff) {
          const { stdout: stagedDiff } = await execAsync(`git diff --cached -- "${filePath}"`, { cwd: repoPath }).catch(() => ({ stdout: '' }));
          const { stdout: unstagedDiff } = await execAsync(`git diff -- "${filePath}"`, { cwd: repoPath }).catch(() => ({ stdout: '' }));

          const stagedParsed = parseDiffLines(stagedDiff);
          const stagedDeletions = new Set(
            stagedParsed
              .filter(l => l.type === 'deletion')
              .map(l => l.numL)
          );

          const unstagedParsed = parseDiffLines(unstagedDiff);
          const unstagedAdditions = new Set(
            unstagedParsed
              .filter(l => l.type === 'addition')
              .map(l => l.numR)
          );

          const totalParsed = parseDiffLines(totalDiff);
          let changeIndex = 0;

          lines = totalParsed.map(line => {
            if (line.type === 'deletion') {
              const isStaged = stagedDeletions.has(line.numL);
              return {
                ...line,
                changeIndex: changeIndex++,
                staged: isStaged
              };
            } else if (line.type === 'addition') {
              const isStaged = !unstagedAdditions.has(line.numR);
              return {
                ...line,
                changeIndex: changeIndex++,
                staged: isStaged
              };
            }
            return line;
          });
        }
      }
    } catch (e) {
      diff = `Error obteniendo diff de Git: ${e.message}`;
    }

    res.json({ diff, lines });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. GET /api/commit-diff
app.get('/api/commit-diff', async (req, res) => {
  const { path: repoPath, commit: commitHash, file } = req.query;

  if (!repoPath || !commitHash) {
    return res.status(400).json({ error: 'Falta path o commit' });
  }

  try {
    const isStash = commitHash.startsWith('stash@{');
    const cmd = isStash
      ? (file ? `git diff "${commitHash}^1..${commitHash}" -- "${file}"` : `git diff "${commitHash}^1..${commitHash}"`)
      : (file ? `git show ${commitHash} -- "${file}"` : `git show ${commitHash}`);
    const { stdout: diff } = await execAsync(cmd, { cwd: repoPath });
    res.json({ diff });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/git/commit-files — get list of files modified in a commit
app.get('/api/git/commit-files', async (req, res) => {
  const { path: repoPath, commit: commitHash } = req.query;
  if (!repoPath || !commitHash) {
    return res.status(400).json({ error: 'Faltan parámetros: path, commit son requeridos' });
  }
  try {
    const { stdout } = await execAsync(`git show --name-status --pretty=format:"" ${commitHash}`, { cwd: repoPath });
    const lines = stdout.split('\n').filter(l => l.trim().length > 0);
    const files = lines.map(line => {
      const parts = line.split(/\s+/);
      const code = parts[0];
      const filePath = parts[1];
      const fileRenamePath = parts[2]; // if renamed

      let status = 'modified';
      if (code.startsWith('A')) status = 'added';
      else if (code.startsWith('D')) status = 'deleted';
      else if (code.startsWith('R')) status = 'renamed';

      const name = filePath.split('/').pop();

      return {
        path: filePath,
        renamePath: fileRenamePath,
        name,
        status
      };
    });
    res.json({ files });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 5. POST /api/profile/switch
app.post('/api/profile/switch', async (req, res) => {
  const { profileName, repoPath, global } = req.body;

  if (!profileName) {
    return res.status(400).json({ error: 'Falta profileName' });
  }

  try {
    const profile = await configManager.getProfile(profileName);
    if (!profile) {
      return res.status(404).json({ error: `Perfil "${profileName}" no encontrado` });
    }

    if (global) {
      await gitManager.setConfig(profile, 'global');
      await configManager.setDefaultProfile(profileName);
    } else {
      if (!repoPath) {
        return res.status(400).json({ error: 'Falta repoPath para aplicar local' });
      }
      await gitManager.setConfig(profile, 'local', repoPath);
      await configManager.setFolderProfile(repoPath, profileName);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. POST /api/profile/add
app.post('/api/profile/add', async (req, res) => {
  const { id, name, email, setupSsh, signingKey } = req.body;

  if (!id || !name || !email) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (id, name, email)' });
  }

  try {
    let sshKey;
    
    if (setupSsh) {
      const keyInfo = await sshManager.setupSSHForProfile(email, id);
      sshKey = keyInfo.path;
    }

    await configManager.addProfile(id, {
      name,
      email,
      sshKey,
      signingKey: signingKey || undefined
    });

    res.json({ success: true, sshKey });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. GET /api/doctor
app.get('/api/doctor', async (req, res) => {
  const checks = [];

  // Check 1: Git Installation
  try {
    const { stdout } = await execAsync('git --version');
    checks.push({ id: 'git', name: 'Instalación de Git', status: 'ok', msg: stdout.trim() });
  } catch (e) {
    checks.push({ id: 'git', name: 'Instalación de Git', status: 'error', msg: 'Git no está en el PATH' });
  }

  // Check 2: Global Configuration
  const config = await gitManager.getCurrentConfig('global');
  if (config.name && config.email) {
    checks.push({ id: 'config', name: 'Configuración global de Git', status: 'ok', msg: `${config.name} <${config.email}>` });
  } else {
    checks.push({ id: 'config', name: 'Configuración global de Git', status: 'warning', msg: 'Falta configurar user.name / user.email global' });
  }

  // Check 3: SSH Key Agent
  try {
    const sshDir = path.join(homedir(), '.ssh');
    const files = await fs.readdir(sshDir).catch(() => []);
    const keyFiles = files.filter(f => f.startsWith('id_') && !f.endsWith('.pub'));
    
    const loadedKeys = await gitManager.listSSHKeys();
    
    if (keyFiles.length === 0) {
      checks.push({ id: 'ssh', name: 'Claves SSH', status: 'warning', msg: 'No se encontraron claves SSH en ~/.ssh/' });
    } else if (loadedKeys.length === 0) {
      checks.push({ id: 'ssh', name: 'Claves SSH', status: 'warning', msg: `${keyFiles.length} clave(s) encontradas, pero ninguna cargada en el ssh-agent` });
    } else {
      checks.push({ id: 'ssh', name: 'Claves SSH', status: 'ok', msg: `${loadedKeys.length} clave(s) cargadas en el agente` });
    }
  } catch (e) {
    checks.push({ id: 'ssh', name: 'Claves SSH', status: 'error', msg: 'No se pudo acceder al directorio ~/.ssh' });
  }

  // Check 4 & 5: Connections
  const connectedGitHub = await gitManager.checkSSHConnection('github.com');
  checks.push({
    id: 'github',
    name: 'Conexión SSH a GitHub',
    status: connectedGitHub ? 'ok' : 'warning',
    msg: connectedGitHub ? 'Autenticado correctamente' : 'No se pudo verificar la conexión (verifica tus claves en GitHub)'
  });

  const connectedGitLab = await gitManager.checkSSHConnection('gitlab.com');
  checks.push({
    id: 'gitlab',
    name: 'Conexión SSH a GitLab',
    status: connectedGitLab ? 'ok' : 'warning',
    msg: connectedGitLab ? 'Autenticado correctamente' : 'No se pudo verificar la conexión (esto es normal si no usas GitLab)'
  });

  // Check 6: GPG signing
  try {
    const { stdout } = await execAsync('gpg --list-secret-keys');
    if (stdout.trim().length > 0) {
      checks.push({ id: 'gpg', name: 'GPG (firma de commits)', status: 'ok', msg: 'Claves secretas GPG listas para firma' });
    } else {
      checks.push({ id: 'gpg', name: 'GPG (firma de commits)', status: 'warning', msg: 'GPG instalado pero sin claves secretas' });
    }
  } catch (e) {
    checks.push({ id: 'gpg', name: 'GPG (firma de commits)', status: 'warning', msg: 'GPG no está instalado (opcional)' });
  }

  res.json(checks);
});

// 8. POST /api/doctor/fix
app.post('/api/doctor/fix', async (req, res) => {
  try {
    const sshDir = path.join(homedir(), '.ssh');
    const files = await fs.readdir(sshDir).catch(() => []);
    const keyFiles = files.filter(f => f.startsWith('id_') && !f.endsWith('.pub'));

    // Agrega claves al agente
    for (const key of keyFiles) {
      try {
        await execAsync(`ssh-add "${path.join(sshDir, key)}"`);
      } catch (e) {
        console.error(`Error agregando clave ${key}:`, e);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. POST /api/repos/link
app.post('/api/repos/link', async (req, res) => {
  const { repoPath, profileName } = req.body;

  if (!repoPath || !profileName) {
    return res.status(400).json({ error: 'Falta repoPath o profileName' });
  }

  let resolvedPath = repoPath;
  if (repoPath.startsWith('~')) {
    resolvedPath = path.join(homedir(), repoPath.slice(1));
  } else {
    resolvedPath = path.resolve(resolvedPath);
  }

  try {
    const isGit = await gitManager.isGitRepo(resolvedPath);
    if (!isGit) {
      return res.status(400).json({ error: 'La ruta especificada no es un repositorio Git válido (no contiene un directorio .git).' });
    }

    const repoRoot = await gitManager.getRepoRoot(resolvedPath);
    if (!repoRoot) {
      return res.status(400).json({ error: 'No se pudo determinar el directorio raíz del repositorio Git.' });
    }

    const profile = await configManager.getProfile(profileName);
    if (!profile) {
      return res.status(404).json({ error: `El perfil "${profileName}" no existe.` });
    }

    // Vincular en config de GitX
    await configManager.setFolderProfile(repoRoot, profileName);

    // Aplicar identidad local
    await gitManager.setConfig(profile, 'local', repoRoot);

    res.json({ success: true, path: repoRoot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. POST /api/repos/clone
app.post('/api/repos/clone', async (req, res) => {
  const { url, repoPath, profileName } = req.body;

  if (!url || !repoPath || !profileName) {
    return res.status(400).json({ error: 'Faltan campos requeridos (url, repoPath, profileName)' });
  }

  let resolvedPath = repoPath;
  if (repoPath.startsWith('~')) {
    resolvedPath = path.join(homedir(), repoPath.slice(1));
  } else {
    resolvedPath = path.resolve(resolvedPath);
  }

  try {
    const profile = await configManager.getProfile(profileName);
    if (!profile) {
      return res.status(404).json({ error: `El perfil "${profileName}" no existe.` });
    }

    // Asegurar que el directorio padre existe
    const parentDir = path.dirname(resolvedPath);
    await fs.mkdir(parentDir, { recursive: true });

    // Clonar repositorio
    await execAsync(`git clone "${url}" "${resolvedPath}"`);

    const isGit = await gitManager.isGitRepo(resolvedPath);
    if (!isGit) {
      throw new Error('La clonación se realizó pero no se detectó un repositorio Git en el destino.');
    }

    const repoRoot = await gitManager.getRepoRoot(resolvedPath);

    // Vincular en config de GitX
    await configManager.setFolderProfile(repoRoot, profileName);

    // Aplicar identidad local
    await gitManager.setConfig(profile, 'local', repoRoot);

    res.json({ success: true, path: repoRoot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. GET /api/repos/browse
app.get('/api/repos/browse', async (req, res) => {
  const platform = process.platform;
  let command = '';

  if (platform === 'darwin') {
    command = 'osascript -e "POSIX path of (choose folder with prompt \\"Selecciona la carpeta del repositorio\\")"';
  } else if (platform === 'win32') {
    command = 'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = \'Selecciona la carpeta del repositorio\'; if($f.ShowDialog() -eq \'OK\') { $f.SelectedPath }"';
  } else {
    return res.status(400).json({ error: 'La selección de carpeta interactiva no está soportada en esta plataforma.' });
  }

  try {
    const { stdout } = await execAsync(command);
    const selectedPath = stdout.trim();
    res.json({ path: selectedPath || null });
  } catch (error) {
    res.json({ path: null });
  }
});

// 12. GET /api/repo-branch — returns current branch name
app.get('/api/repo-branch', async (req, res) => {
  const repoPath = req.query.path;
  if (!repoPath) return res.status(400).json({ error: 'Falta path' });
  try {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath });
    res.json({ branch: stdout.trim() || 'main' });
  } catch (e) {
    res.json({ branch: 'main' });
  }
});

// 13. GET /api/git/remote-status — ahead/behind counts vs origin
app.get('/api/git/remote-status', async (req, res) => {
  const repoPath = req.query.path;
  if (!repoPath) return res.status(400).json({ error: 'Falta path' });
  try {
    // Silently fetch to update remote refs (no network if no remote) unless skipFetch is true
    if (req.query.skipFetch !== 'true') {
      await execAsync('git fetch --quiet', { cwd: repoPath }).catch(() => {});
    }

    // ahead = commits we have that remote doesn't; behind = commits remote has that we don't
    const { stdout: aheadOut } = await execAsync('git rev-list --count @{u}..HEAD', { cwd: repoPath }).catch(() => ({ stdout: '0' }));
    const { stdout: behindOut } = await execAsync('git rev-list --count HEAD..@{u}', { cwd: repoPath }).catch(() => ({ stdout: '0' }));

    const ahead = parseInt(aheadOut.trim()) || 0;
    const behind = parseInt(behindOut.trim()) || 0;

    // Check if remote exists
    const { stdout: remotes } = await execAsync('git remote', { cwd: repoPath }).catch(() => ({ stdout: '' }));
    const hasRemote = remotes.trim().length > 0;

    res.json({ ahead, behind, hasRemote });
  } catch (e) {
    res.json({ ahead: 0, behind: 0, hasRemote: false });
  }
});

// 14. POST /api/git/fetch
app.post('/api/git/fetch', async (req, res) => {
  const { repoPath } = req.body;
  if (!repoPath) return res.status(400).json({ error: 'Falta repoPath' });
  try {
    const { stdout } = await execAsync('git fetch --prune', { cwd: repoPath });
    res.json({ success: true, output: stdout.trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 15. POST /api/git/pull
app.post('/api/git/pull', async (req, res) => {
  const { repoPath } = req.body;
  if (!repoPath) return res.status(400).json({ error: 'Falta repoPath' });
  try {
    const { stdout } = await execAsync('git pull --rebase=false', { cwd: repoPath });
    res.json({ success: true, output: stdout.trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 16. POST /api/git/push
app.post('/api/git/push', async (req, res) => {
  const { repoPath } = req.body;
  if (!repoPath) return res.status(400).json({ error: 'Falta repoPath' });
  try {
    const { stdout } = await execAsync('git push', { cwd: repoPath });
    res.json({ success: true, output: stdout.trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// GET /api/git/branches — list local branches
app.get('/api/git/branches', async (req, res) => {
  const repoPath = req.query.path;
  if (!repoPath) return res.status(400).json({ error: 'Falta path' });
  try {
    // List all local branches with current marked by *
    const { stdout } = await execAsync('git branch --sort=-committerdate', { cwd: repoPath });
    const branches = stdout
      .split('\n')
      .filter(l => l.trim().length > 0)
      .map(l => ({
        name: l.replace(/^\*?\s+/, '').trim(),
        current: l.trim().startsWith('*')
      }));
    res.json({ branches });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/git/checkout — switch to a branch (or create and switch)
app.post('/api/git/checkout', async (req, res) => {
  const { repoPath, branch, create, stashChanges, currentBranch } = req.body;
  if (!repoPath || !branch) return res.status(400).json({ error: 'Faltan repoPath y branch' });
  try {
    // 1. If stashChanges is true, stash current changes
    if (stashChanges && currentBranch) {
      try {
        await execAsync(`git stash push --include-untracked -m "GitX-Stash: ${currentBranch}"`, { cwd: repoPath });
      } catch (e) {
        console.error('Stash failed:', e.message);
      }
    }

    // 2. Checkout the branch
    const cmd = create ? `git checkout -b "${branch}"` : `git checkout "${branch}"`;
    const checkoutResult = await execAsync(cmd, { cwd: repoPath });

    res.json({ 
      success: true, 
      output: (checkoutResult.stdout + checkoutResult.stderr).trim(),
      poppedStash: false
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/git/stash-pop — apply and discard a specific stash
app.post('/api/git/stash-pop', async (req, res) => {
  const { repoPath, stashId } = req.body;
  if (!repoPath || !stashId) {
    return res.status(400).json({ error: 'Faltan repoPath y stashId' });
  }
  try {
    // Important: Use double quotes around stashId to avoid globbing/brace expansion in zsh
    const { stdout, stderr } = await execAsync(`git stash pop "${stashId}"`, { cwd: repoPath });
    res.json({ success: true, output: (stdout + stderr).trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/git/stash-drop — drop a specific stash
app.post('/api/git/stash-drop', async (req, res) => {
  const { repoPath, stashId } = req.body;
  if (!repoPath || !stashId) {
    return res.status(400).json({ error: 'Faltan repoPath y stashId' });
  }
  try {
    // Important: Use double quotes around stashId to avoid globbing/brace expansion in zsh
    const { stdout, stderr } = await execAsync(`git stash drop "${stashId}"`, { cwd: repoPath });
    res.json({ success: true, output: (stdout + stderr).trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper to modify a diff, keeping only selected line indices as changes
function parseAndModifyDiff(diffText, selectedLineIndices) {
  const selectedIndices = selectedLineIndices.map(x => parseInt(x));
  const lines = diffText.trim().split('\n');
  const resultLines = [];
  let changeIndex = 0;
  
  let currentHunk = null;
  let hunkLines = [];
  let delta = 0; // Accumulated new line shift

  const flushHunk = () => {
    if (!currentHunk) return;
    let oldCount = 0;
    let newCount = 0;
    const processedLines = [];

    hunkLines.forEach(line => {
      if (line.startsWith('-')) {
        const isStaged = selectedIndices.includes(changeIndex);
        if (isStaged) {
          processedLines.push(line);
          oldCount++;
        } else {
          // Convert to context line: prepend a space to the original line content (without the '-' marker)
          processedLines.push(' ' + line.slice(1));
          oldCount++;
          newCount++;
        }
        changeIndex++;
      } else if (line.startsWith('+')) {
        const isStaged = selectedIndices.includes(changeIndex);
        if (isStaged) {
          processedLines.push(line);
          newCount++;
        } else {
          // Omitted entirely
        }
        changeIndex++;
      } else if (line.startsWith('\\')) {
        // Warning line, keep as is
        processedLines.push(line);
      } else {
        // Context line (empty, starts with space, or leading space stripped)
        let formattedLine = line;
        if (!line.startsWith(' ')) {
          formattedLine = ' ' + line;
        }
        processedLines.push(formattedLine);
        oldCount++;
        newCount++;
      }
    });

    // Check if hunk has any actual additions or deletions
    const hasChanges = processedLines.some(l => l.startsWith('+') || l.startsWith('-'));

    if (hasChanges) {
      // Recalculate newStart using accumulated delta
      const adjustedNewStart = currentHunk.newStart + delta;
      // Reconstruct hunk header
      const header = `@@ -${currentHunk.oldStart},${oldCount} +${adjustedNewStart},${newCount} @@`;
      resultLines.push(header);
      resultLines.push(...processedLines);
    }

    // Update delta for subsequent hunks (must still be updated even if hunk is omitted!)
    delta += (newCount - currentHunk.newLen);
    
    currentHunk = null;
    hunkLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('@@')) {
      flushHunk();
      const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      if (match) {
        currentHunk = {
          oldStart: parseInt(match[1]),
          oldLen: parseInt(match[2] || '1'),
          newStart: parseInt(match[3]),
          newLen: parseInt(match[4] || '1')
        };
      } else {
        currentHunk = { oldStart: 1, oldLen: 1, newStart: 1, newLen: 1 };
      }
    } else if (currentHunk) {
      hunkLines.push(line);
    } else {
      // Keep diff headers
      resultLines.push(line);
    }
  }
  flushHunk();
  return resultLines.join('\n') + '\n';
}

// POST /api/git/stage-file — stage a whole file
app.post('/api/git/stage-file', async (req, res) => {
  const { repoPath, filePath } = req.body;
  if (!repoPath || !filePath) return res.status(400).json({ error: 'Faltan repoPath y filePath' });
  try {
    await execAsync(`git add -- "${filePath}"`, { cwd: repoPath });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/git/unstage-file — unstage a whole file
app.post('/api/git/unstage-file', async (req, res) => {
  const { repoPath, filePath } = req.body;
  if (!repoPath || !filePath) return res.status(400).json({ error: 'Faltan repoPath y filePath' });
  try {
    try {
      await execAsync(`git reset HEAD -- "${filePath}"`, { cwd: repoPath });
    } catch (e) {
      await execAsync(`git rm --cached -r --ignore-unmatch -- "${filePath}"`, { cwd: repoPath }).catch(() => {});
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/git/stage-lines — stage specific lines using patches
app.post('/api/git/stage-lines', async (req, res) => {
  const { repoPath, filePath, selectedLineIndices } = req.body;
  if (!repoPath || !filePath || !Array.isArray(selectedLineIndices)) {
    return res.status(400).json({ error: 'Faltan parámetros: repoPath, filePath o selectedLineIndices' });
  }

  try {
    let diffText = '';
    try {
      const { stdout: status } = await execAsync(`git status --porcelain "${filePath}"`, { cwd: repoPath });
      
      if (status.includes('??')) {
        // Track file with intent-to-add so git diff HEAD works
        await execAsync(`git add -N -- "${filePath}"`, { cwd: repoPath });
      }
      
      const { stdout } = await execAsync(`git diff HEAD -- "${filePath}"`, { cwd: repoPath });
      diffText = stdout;
    } catch (e) {
      return res.status(500).json({ error: `Error obteniendo diff: ${e.message}` });
    }

    if (!diffText.trim()) {
      return res.json({ success: true, message: 'Sin diferencias' });
    }

    const modifiedPatch = parseAndModifyDiff(diffText, selectedLineIndices);

    // Reset index first to clear any previous staging state for this file
    try {
      await execAsync(`git reset HEAD -- "${filePath}"`, { cwd: repoPath });
    } catch (e) {
      await execAsync(`git rm --cached -r --ignore-unmatch -- "${filePath}"`, { cwd: repoPath }).catch(() => {});
    }

    // Apply the custom patch to index
    const applyProcess = exec(`git apply --cached -`, { cwd: repoPath });
    
    const applyPromise = new Promise((resolve, reject) => {
      let stderr = '';
      applyProcess.stderr.on('data', (data) => { stderr += data; });
      applyProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(stderr || `git apply falló con código ${code}`));
        }
      });
    });

    applyProcess.stdin.write(modifiedPatch);
    applyProcess.stdin.end();

    await applyPromise;

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});





// GET /api/git/merge-preview — get commits that would be merged, and check conflicts
app.get('/api/git/merge-preview', async (req, res) => {
  const { path: repoPath, current, source } = req.query;
  if (!repoPath || !current || !source) {
    return res.status(400).json({ error: 'Faltan parámetros: path, current, source son requeridos' });
  }
  try {
    // 1. Get commits that would be merged
    const { stdout: commitsOut } = await execAsync(`git log "${current}".."${source}" --oneline`, { cwd: repoPath });
    const commits = commitsOut.split('\n').filter(line => line.trim().length > 0);

    if (commits.length === 0) {
      return res.json({ commits: [], conflicts: false, message: 'Las ramas ya están fusionadas.' });
    }

    // 2. Check if clean merge is possible
    let conflicts = false;
    try {
      // Find merge base
      const { stdout: mergeBase } = await execAsync(`git merge-base "${current}" "${source}"`, { cwd: repoPath });
      const base = mergeBase.trim();
      
      // Run git merge-tree
      const { stdout: treeOut } = await execAsync(`git merge-tree "${base}" "${current}" "${source}"`, { cwd: repoPath });
      if (treeOut.includes('conflict') || treeOut.includes('Conflict') || treeOut.includes('CONFLICT') || treeOut.includes('changed in both')) {
        conflicts = true;
      }
    } catch (e) {
      conflicts = true;
    }

    res.json({
      commits,
      conflicts,
      message: conflicts ? 'Existen conflictos potenciales de fusión.' : 'Listo para fusionar automáticamente.'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/git/merge — execute merge
app.post('/api/git/merge', async (req, res) => {
  const { repoPath, sourceBranch } = req.body;
  if (!repoPath || !sourceBranch) {
    return res.status(400).json({ error: 'Faltan campos: repoPath y sourceBranch son requeridos' });
  }
  try {
    const { stdout, stderr } = await execAsync(`git merge "${sourceBranch}"`, { cwd: repoPath });
    res.json({ success: true, output: (stdout + stderr).trim() });
  } catch (e) {
    const isConflict = e.message.includes('Conflict') || e.message.includes('CONFLICT') || e.message.includes('merge failed') || e.message.includes('conflict');
    res.json({
      success: false,
      conflicts: isConflict,
      message: e.message,
      output: e.stderr || e.stdout || ''
    });
  }
});

// 13. POST /api/git/commit — stage files and commit
// GET /api/git/last-commit — get the last commit subject and body
app.get('/api/git/last-commit', async (req, res) => {
  const repoPath = req.query.path;
  if (!repoPath) return res.status(400).json({ error: 'Falta path' });
  try {
    const { stdout: title } = await execAsync('git log -1 --format="%s"', { cwd: repoPath });
    const { stdout: body } = await execAsync('git log -1 --format="%b"', { cwd: repoPath });
    res.json({
      title: title.trim(),
      description: body.trim()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/git/undo-commit — soft reset last commit
app.post('/api/git/undo-commit', async (req, res) => {
  const { repoPath } = req.body;
  if (!repoPath) return res.status(400).json({ error: 'Falta repoPath' });
  try {
    const { stdout } = await execAsync('git reset --soft HEAD~1', { cwd: repoPath });
    res.json({ success: true, output: stdout.trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 13. POST /api/git/commit — stage files and commit
app.post('/api/git/commit', async (req, res) => {
  const { repoPath, title, description, files, amend } = req.body;

  if (!repoPath || !title) {
    return res.status(400).json({ error: 'Faltan campos: repoPath y title son requeridos' });
  }

  const isAmend = !!amend;

  if (!isAmend && (!files || files.length === 0)) {
    return res.status(400).json({ error: 'No hay archivos seleccionados para commitear' });
  }

  try {
    // Note: With real-time staging, files and lines are already staged in the index.
    // We do not run 'git add' here to preserve partial (line-level) staging.


    // Build commit message
    const message = description
      ? `${title}\n\n${description}`
      : title;

    // Commit
    const commitCmd = isAmend
      ? `git commit --amend -m ${JSON.stringify(message)}`
      : `git commit -m ${JSON.stringify(message)}`;

    const { stdout } = await execAsync(commitCmd, { cwd: repoPath });

    res.json({ success: true, output: stdout.trim() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor API de GitX Desktop corriendo en http://localhost:${PORT}`);
});
