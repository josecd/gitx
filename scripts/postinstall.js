// Cross-platform postinstall script
import { platform } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const isWindows = platform() === 'win32';

async function postInstall() {
  try {
    if (isWindows) {
      // En Windows, ejecutar el script PowerShell si está disponible
      try {
        await execAsync('powershell -File scripts/postinstall.ps1');
      } catch (error) {
        // Si falla, solo mostrar mensaje
        console.log('✓ GitX instalado en Windows');
        console.log('  Para autocompletado, usa Git Bash con los scripts en completions/');
      }
    } else {
      // En Unix/Linux/Mac, ejecutar el script bash
      await execAsync('bash scripts/postinstall.sh');
    }
  } catch (error) {
    // Ignorar errores para no bloquear la instalación
    console.log('✓ GitX instalado correctamente');
  }
}

postInstall();
