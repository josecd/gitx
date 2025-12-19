# GitX en Windows

## Instalación

```powershell
npm install -g gitx-profile-manager
```

## Requisitos

- Node.js >= 18.0.0
- Git para Windows (incluye Git Bash)
- OpenSSH (incluido en Windows 10/11)

## Configuración de SSH en Windows

### Habilitar ssh-agent

En PowerShell como Administrador:

```powershell
# Habilitar el servicio
Set-Service ssh-agent -StartupType Automatic

# Iniciar el servicio
Start-Service ssh-agent
```

### Verificar que funciona

```powershell
ssh-add -l
```

## Uso

GitX funciona igual en Windows que en Mac/Linux:

```bash
# Crear perfil
gitx profile add

# Cambiar perfil
gitx switch personal

# Clonar con perfil
gitx clone https://github.com/user/repo.git --profile work
```

## Autocompletado

### Git Bash

Los scripts de autocompletado bash funcionan en Git Bash:

```bash
cp /c/Users/TuUsuario/AppData/Roaming/npm/node_modules/gitx-profile-manager/completions/gitx-completion.bash ~/.bash_completion.d/gitx
source ~/.bashrc
```

### PowerShell

Para PowerShell, considera usar [posh-git](https://github.com/dahlbyk/posh-git) o [oh-my-posh](https://ohmyposh.dev/).

## Notas

- Los permisos de archivos se manejan automáticamente en Windows
- ssh-agent debe estar corriendo para agregar claves automáticamente
- Usa rutas con `/` o `\\` según el shell (Git Bash vs CMD/PowerShell)

## Solución de problemas

### "ssh-agent no está corriendo"

```powershell
Start-Service ssh-agent
```

### "ssh-keygen no encontrado"

Instala Git para Windows que incluye OpenSSH.

### Permisos de archivos .ssh

Windows maneja los permisos diferente. GitX detecta esto automáticamente.
