import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const platform = process.platform;
const arch = process.arch;

let triple = '';
let pkgTarget = '';

if (platform === 'darwin') {
  if (arch === 'arm64') {
    triple = 'aarch64-apple-darwin';
    pkgTarget = 'node18-macos-arm64';
  } else {
    triple = 'x86_64-apple-darwin';
    pkgTarget = 'node18-macos-x64';
  }
} else if (platform === 'win32') {
  triple = 'x86_64-pc-windows-msvc';
  pkgTarget = 'node18-win-x64';
} else if (platform === 'linux') {
  triple = 'x86_64-unknown-linux-gnu';
  pkgTarget = 'node18-linux-x64';
} else {
  console.error(`Plataforma no soportada: ${platform}`);
  process.exit(1);
}

const binariesDir = path.join(process.cwd(), 'src-tauri', 'binaries');
if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

const distServerDir = path.join(process.cwd(), 'dist-server');
if (!fs.existsSync(distServerDir)) {
  fs.mkdirSync(distServerDir, { recursive: true });
}

const ext = platform === 'win32' ? '.exe' : '';
const tempOutput = path.join(binariesDir, `gitx-backend-temp${ext}`);
const finalOutput = path.join(binariesDir, `gitx-backend-${triple}${ext}`);
const bundledServer = path.join(distServerDir, 'server.cjs');

try {
  console.log('Empaquetando dependencias con esbuild...');
  execSync(`npx esbuild server.js --bundle --platform=node --format=cjs --outfile="${bundledServer}"`, { stdio: 'inherit' });

  console.log(`Compilando backend con pkg para target: ${pkgTarget}...`);
  execSync(`npx pkg "${bundledServer}" --targets ${pkgTarget} --output "${tempOutput}"`, { stdio: 'inherit' });
  
  if (fs.existsSync(tempOutput)) {
    if (fs.existsSync(finalOutput)) {
      fs.unlinkSync(finalOutput);
    }
    fs.renameSync(tempOutput, finalOutput);
    console.log(`¡Backend compilado con éxito como sidecar en: ${finalOutput}!`);
  } else {
    throw new Error('No se generó el archivo temporal de pkg.');
  }

  // Limpiar archivo temporal bundled
  if (fs.existsSync(bundledServer)) {
    fs.unlinkSync(bundledServer);
  }
  if (fs.existsSync(distServerDir)) {
    fs.rmdirSync(distServerDir);
  }
} catch (err) {
  console.error('Error al compilar el backend:', err);
  process.exit(1);
}
