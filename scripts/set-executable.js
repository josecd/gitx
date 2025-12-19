// Cross-platform script to set executable permissions
import { promises as fs } from 'fs';
import { platform } from 'os';

const isWindows = platform() === 'win32';

async function setExecutable() {
  try {
    const cliPath = './dist/cli.js';
    
    if (!isWindows) {
      // En Unix/Linux/Mac, establecer permisos de ejecución
      await fs.chmod(cliPath, 0o755);
      console.log('✓ Permisos de ejecución establecidos');
    } else {
      // En Windows, los permisos se manejan diferente
      console.log('✓ En Windows (permisos no requeridos)');
    }
  } catch (error) {
    // Ignorar errores si el archivo no existe aún
  }
}

setExecutable();
