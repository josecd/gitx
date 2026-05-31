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
const PORT = 3001;

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

      // git diff --numstat
      const { stdout: numstatOut } = await execAsync('git diff --numstat', { cwd: repoPath }).catch(() => ({ stdout: '' }));
      const numstatLines = numstatOut.split('\n').filter(line => line.trim().length > 0);
      const statMap = new Map();
      numstatLines.forEach(line => {
        const [add, del, file] = line.split(/\s+/);
        statMap.set(file, { additions: parseInt(add) || 0, deletions: parseInt(del) || 0 });
      });

      changes = statusLines.map((line, idx) => {
        const statusCode = line.substring(0, 2).trim();
        const filePath = line.substring(3).trim();
        
        let status = 'modified';
        if (statusCode === 'A' || statusCode === '??') status = 'added';
        if (statusCode === 'D') status = 'deleted';

        const stats = statMap.get(filePath) || { additions: 0, deletions: 0 };

        return {
          id: `f_${idx}`,
          name: getBasename(filePath),
          path: filePath,
          status,
          additions: stats.additions || (status === 'added' ? 10 : 1),
          deletions: stats.deletions || (status === 'deleted' ? 10 : 0),
          type: 'code'
        };
      });
    } catch (e) {
      console.error('Error leyendo status:', e);
    }

    res.json({ commits, changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GET /api/repo-diff
app.get('/api/repo-diff', async (req, res) => {
  const repoPath = req.query.path;
  const filePath = req.query.file;

  if (!repoPath || !filePath) {
    return res.status(400).json({ error: 'Falta path o file' });
  }

  try {
    // Si el archivo es nuevo (untracked), obtenemos el contenido completo como adición
    // De lo contrario, hacemos un git diff
    let diff = '';
    try {
      const { stdout: status } = await execAsync(`git status --porcelain "${filePath}"`, { cwd: repoPath });
      
      if (status.includes('??')) {
        // Untracked, leer contenido
        const absolutePath = path.join(repoPath, filePath);
        const content = await fs.readFile(absolutePath, 'utf-8');
        diff = `@@ -0,0 +1,${content.split('\n').length} @@\n` + content.split('\n').map(line => `+${line}`).join('\n');
      } else {
        const { stdout } = await execAsync(`git diff HEAD -- "${filePath}"`, { cwd: repoPath });
        diff = stdout || 'Sin cambios detectados en el área de trabajo.';
      }
    } catch (e) {
      diff = `Error obteniendo diff de Git: ${e.message}`;
    }

    res.json({ diff });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. GET /api/commit-diff
app.get('/api/commit-diff', async (req, res) => {
  const repoPath = req.query.path;
  const commitHash = req.query.commit;

  if (!repoPath || !commitHash) {
    return res.status(400).json({ error: 'Falta path o commit' });
  }

  try {
    const { stdout: diff } = await execAsync(`git show --stat=80 ${commitHash}`, { cwd: repoPath });
    res.json({ diff });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor API de GitX Desktop corriendo en http://localhost:${PORT}`);
});
