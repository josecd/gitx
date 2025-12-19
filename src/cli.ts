#!/usr/bin/env node

import { Command } from 'commander';
import { AutoCommand } from './commands/auto.js';
import { DoctorCommand } from './commands/doctor.js';
import { MigrateCommand } from './commands/migrate.js';
import { UnlinkCommand } from './commands/unlink.js';
import { ProfileCommands } from './commands/profile.js';
import { RemoteCommand } from './commands/remote.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('gitx')
  .description('🚀 Gestor inteligente de perfiles Git con detección automática')
  .version('1.0.0');

// Auto command - detects and applies profile by folder
program
  .command('auto')
  .description('Detectar y aplicar perfil automáticamente por carpeta')
  .option('-p, --path <path>', 'Ruta del repositorio')
  .option('--enable', 'Activar modo automático')
  .option('--disable', 'Desactivar modo automático')
  .action(async (options) => {
    const autoCmd = new AutoCommand();
    await autoCmd.execute(options);
  });

// Doctor command - diagnoses and fixes git/ssh issues
program
  .command('doctor')
  .description('Diagnosticar y arreglar problemas con Git y SSH')
  .option('--fix', 'Intentar corregir problemas automáticamente')
  .action(async (options) => {
    const doctorCmd = new DoctorCommand();
    await doctorCmd.execute(options);
  });

// Migrate command - import existing git config
program
  .command('migrate')
  .description('Importar configuración existente de Git')
  .action(async () => {
    const migrateCmd = new MigrateCommand();
    await migrateCmd.execute();
  });

// Unlink command - clean repository config
program
  .command('unlink')
  .description('Limpiar configuración del repositorio')
  .option('-p, --path <path>', 'Ruta del repositorio')
  .option('-f, --force', 'No pedir confirmación')
  .option('-g, --global', 'Limpiar configuración global')
  .action(async (options) => {
    const unlinkCmd = new UnlinkCommand();
    await unlinkCmd.execute(options);
  });

// Profile commands
const profileCmd = program
  .command('profile')
  .description('Gestionar perfiles de Git');

profileCmd
  .command('add')
  .description('Agregar un nuevo perfil')
  .action(async () => {
    const profileCommands = new ProfileCommands();
    await profileCommands.add();
  });

profileCmd
  .command('list')
  .alias('ls')
  .description('Listar todos los perfiles')
  .action(async () => {
    const profileCommands = new ProfileCommands();
    await profileCommands.list();
  });

profileCmd
  .command('remove <name>')
  .alias('rm')
  .description('Eliminar un perfil')
  .action(async (name) => {
    const profileCommands = new ProfileCommands();
    await profileCommands.remove(name);
  });

profileCmd
  .command('current')
  .description('Mostrar perfil actual')
  .action(async () => {
    const profileCommands = new ProfileCommands();
    await profileCommands.current();
  });

// Switch command - change profile
program
  .command('switch <profile>')
  .description('Cambiar a un perfil específico')
  .option('-g, --global', 'Cambiar perfil global')
  .action(async (profile, options) => {
    const profileCommands = new ProfileCommands();
    await profileCommands.switch(profile, options);
  });

// List command (shortcut)
program
  .command('list')
  .alias('ls')
  .description('Listar todos los perfiles')
  .action(async () => {
    const profileCommands = new ProfileCommands();
    await profileCommands.list();
  });

// Hook command - for git hooks integration
program
  .command('hook')
  .description('Aplicar perfil automáticamente (para git hooks)')
  .option('--silent', 'No mostrar mensajes')
  .action(async (options) => {
    const autoCmd = new AutoCommand();
    const applied = await autoCmd.applyProfile();
    if (!applied && !options.silent) {
      // Profile not applied, but don't show error
    }
  });

// Remote commands - smart remote management
program
  .command('remote')
  .description('Gestionar remotes de Git con perfiles automáticos');

program
  .command('remote add <url>')
  .description('Agregar remote con host correcto según perfil')
  .option('-n, --name <name>', 'Nombre del remote', 'origin')
  .action(async (url, options) => {
    const remoteCmd = new RemoteCommand();
    await remoteCmd.add(url, options);
  });

program
  .command('remote fix')
  .description('Arreglar remotes existentes para usar el perfil actual')
  .action(async () => {
    const remoteCmd = new RemoteCommand();
    await remoteCmd.fix();
  });

program
  .command('clone <url>')
  .description('Clonar repositorio con perfil automático')
  .option('-d, --directory <dir>', 'Directorio de destino')
  .action(async (url, options) => {
    const remoteCmd = new RemoteCommand();
    await remoteCmd.clone(url, options);
  });

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.bold.cyan('🚀 GitX - Gestor inteligente de perfiles Git\n'));
  program.outputHelp();
  console.log(chalk.dim('\nComandos principales:'));
  console.log(chalk.dim('  gitx migrate      → Importar tu configuración actual'));
  console.log(chalk.dim('  gitx auto         → Activar detección automática'));
  console.log(chalk.dim('  gitx doctor       → Diagnosticar problemas'));
  console.log(chalk.dim('  gitx list         → Ver todos tus perfiles'));
  console.log(chalk.dim('  gitx clone <url>  → Clonar repo con perfil automático'));
  console.log(chalk.dim('\nEjemplos:'));
  console.log(chalk.dim('  gitx migrate'));
  console.log(chalk.dim('  gitx switch work'));
  console.log(chalk.dim('  gitx clone https://github.com/user/repo.git'));
  console.log(chalk.dim('  gitx remote fix'));
}
