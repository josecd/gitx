# 🚀 GitX - Gestor de Perfiles Git

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

GitX es un gestor de perfiles Git con **detección automática por carpeta** (nivel nvm real). Cambia entre perfiles personales, de trabajo, o de diferentes clientes de forma automática según la carpeta en la que estés trabajando.

## ✨ Características Principales

### 🎯 Diferencial Fuerte (Nivel NVM Real)

- **🤖 `gitx auto`** - Detecta y aplica perfiles automáticamente por carpeta
- **🏥 `gitx doctor`** - Diagnostica y arregla problemas con SSH y Git
- **📦 `gitx migrate`** - Importa tu configuración existente de Git
- **🧹 `gitx unlink`** - Limpia configuraciones de repositorios
- **📊 `gitx status-bar`** - Plugin opcional para VS Code que muestra el perfil activo

### 🎨 Otras Características

- 🔄 **Cambio rápido** entre perfiles con `gitx switch`
- 📝 **Gestión completa** de perfiles (añadir, listar, eliminar)
- 🔐 **Soporte SSH** y claves GPG para firma de commits
- 🌍 **Configuración global y local** independiente
- 💼 **Ideal para freelancers** con múltiples clientes
- 👥 **Perfecto para equipos** con diferentes cuentas

## 📦 Instalación

### Requisitos Previos

- Node.js >= 18.0.0
- Git instalado y configurado
- npm o yarn

### Instalación Global

```bash
# Clonar el repositorio
git clone https://github.com/yourusername/gitx.git
cd gitx

# Instalar dependencias
npm install

# Compilar el proyecto
npm run build

# Instalar globalmente
npm link
```

### Instalación del Plugin de VS Code (Opcional)

```bash
cd vscode-extension
npm install
npm run compile
code --install-extension .
```

## 🚀 Inicio Rápido

### 1. Migrar tu configuración actual

El comando más fácil para empezar es importar tu configuración actual:

```bash
gitx migrate
```

Este comando:
- ✅ Detecta tu configuración global de Git
- ✅ Crea un perfil con tus datos
- ✅ Te pregunta si quieres activar el modo automático
- ✅ Lo configura como perfil predeterminado

### 2. Agregar más perfiles

```bash
gitx profile add
```

Te pedirá:
- Nombre del perfil (ej: `work`, `personal`, `cliente-x`)
- Tu nombre completo
- Tu email
- Clave GPG (opcional)

### 3. Activar el modo automático

```bash
# Dentro de un repositorio Git
gitx auto --enable
```

¡Listo! Ahora cada vez que entres a esta carpeta, se aplicará automáticamente el perfil correcto.

## 📚 Guía de Uso

### Comandos Principales

#### `gitx auto`

Gestiona la detección automática de perfiles por carpeta.

```bash
# Activar modo automático para el repositorio actual
gitx auto --enable

# Desactivar modo automático
gitx auto --disable

# Especificar una ruta diferente
gitx auto --enable --path /ruta/a/repo
```

**¿Cómo funciona?**
- GitX asocia carpetas con perfiles
- Cuando entras a una carpeta asociada, el perfil se aplica automáticamente
- Similar a cómo NVM cambia la versión de Node según `.nvmrc`

#### `gitx doctor`

Diagnostica problemas con tu configuración de Git y SSH.

```bash
# Ejecutar diagnóstico
gitx doctor

# Diagnosticar e intentar corregir automáticamente
gitx doctor --fix
```

**Verifica:**
- ✅ Instalación de Git
- ✅ Configuración de usuario
- ✅ Claves SSH disponibles
- ✅ Conexión a GitHub/GitLab
- ✅ Configuración GPG

#### `gitx migrate`

Importa tu configuración actual de Git a GitX.

```bash
gitx migrate
```

**Proceso interactivo:**
1. Lee tu configuración global de Git
2. Te pide un nombre para el perfil
3. Opcionalmente asocia claves SSH
4. Pregunta si establecer como predeterminado
5. Pregunta si activar modo automático

#### `gitx unlink`

Limpia la configuración de un repositorio.

```bash
# Limpiar repositorio actual
gitx unlink

# Limpiar sin confirmación
gitx unlink --force

# Limpiar configuración global
gitx unlink --global

# Limpiar un repositorio específico
gitx unlink --path /ruta/a/repo
```

#### `gitx switch <perfil>`

Cambia al perfil especificado.

```bash
# Cambiar perfil local (solo este repositorio)
gitx switch work

# Cambiar perfil global (todos los repositorios)
gitx switch personal --global
```

### Gestión de Perfiles

#### Listar perfiles

```bash
gitx list
# o
gitx profile list
```

**Salida:**
```
📋 Perfiles configurados:

★ personal
  Alex Developer <alex@personal.com>
  Auto: /Users/alex/projects/personal

○ work
  Alex Developer <alex@company.com>
  GPG: ABC123...
  Auto: /Users/alex/work/company

★ = perfil predeterminado
```

#### Agregar perfil

```bash
gitx profile add
```

#### Eliminar perfil

```bash
gitx profile remove work
```

#### Ver perfil actual

```bash
gitx profile current
```

**Salida:**
```
📍 Configuración actual (local):

Git config local:
  Nombre: Alex Developer
  Email: alex@company.com
  GPG: ABC123...

Modo auto: work

🌍 Configuración global:

Git config global:
  Nombre: Alex Developer
  Email: alex@personal.com

Perfil predeterminado: personal
```

## 🔧 Configuración Avanzada

### Archivo de Configuración

GitX guarda su configuración en `~/.gitx/config.json`:

```json
{
  "profiles": {
    "personal": {
      "name": "Alex Developer",
      "email": "alex@personal.com",
      "sshKey": "/Users/alex/.ssh/id_ed25519_personal"
    },
    "work": {
      "name": "Alex Developer",
      "email": "alex@company.com",
      "sshKey": "/Users/alex/.ssh/id_ed25519_work",
      "signingKey": "ABC123..."
    }
  },
  "folderProfiles": [
    {
      "path": "/Users/alex/projects/personal",
      "profile": "personal"
    },
    {
      "path": "/Users/alex/work",
      "profile": "work"
    }
  ],
  "defaultProfile": "personal"
}
```

### Integración con Git Hooks

Puedes hacer que GitX aplique automáticamente el perfil al hacer checkout:

```bash
# En tu repositorio
echo '#!/bin/sh\ngitx hook --silent' > .git/hooks/post-checkout
chmod +x .git/hooks/post-checkout
```

### Plugin de VS Code

El plugin `gitx-status-bar` muestra el perfil activo en la barra de estado:

**Características:**
- 📊 Muestra el perfil actual en la barra de estado
- 🔄 Se actualiza automáticamente al cambiar de carpeta
- 🎨 Colores de estado (verde = ok, amarillo = sin auto, rojo = sin config)
- 🖱️ Click para cambiar de perfil rápidamente

**Configuración:**

```json
{
  "gitx.showInStatusBar": true,
  "gitx.autoRefresh": true
}
```

## 💡 Casos de Uso

### Freelancer con Múltiples Clientes

```bash
# Crear perfil para cada cliente
gitx profile add  # cliente-a
gitx profile add  # cliente-b
gitx profile add  # personal

# Configurar cada carpeta de proyecto
cd ~/projects/cliente-a/proyecto1
gitx switch cliente-a
gitx auto --enable

cd ~/projects/cliente-b/proyecto1
gitx switch cliente-b
gitx auto --enable

# ¡Listo! GitX cambiará automáticamente según la carpeta
```

### Desarrollador con Trabajo y Proyectos Personales

```bash
# Migrar configuración personal
gitx migrate  # Crear perfil "personal"

# Agregar perfil de trabajo
gitx profile add  # work

# Configurar carpetas
cd ~/work
gitx switch work --global  # Todos los repos en ~/work
gitx auto --enable

cd ~/projects/personal
gitx switch personal
gitx auto --enable
```

### Equipo con Diferentes Cuentas

```bash
# Cada miembro tiene sus perfiles
gitx profile add  # github-personal
gitx profile add  # github-work
gitx profile add  # gitlab-client

# SSH keys diferentes para cada servicio
# GitX gestiona automáticamente qué clave usar
```

## 🐛 Solución de Problemas

### Mi perfil no se aplica automáticamente

1. Verifica que el modo automático esté activado:
   ```bash
   gitx auto --enable
   ```

2. Verifica que estés en un repositorio Git:
   ```bash
   git rev-parse --git-dir
   ```

3. Usa el hook de Git para aplicar automáticamente:
   ```bash
   gitx hook
   ```

### Problemas con SSH

Ejecuta el doctor para diagnosticar:

```bash
gitx doctor --fix
```

### No puedo conectarme a GitHub/GitLab

1. Verifica tus claves SSH:
   ```bash
   ssh-add -l
   ```

2. Agrega tu clave si no está:
   ```bash
   ssh-add ~/.ssh/id_ed25519
   ```

3. Prueba la conexión:
   ```bash
   ssh -T git@github.com
   ```

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Inspirado en [nvm](https://github.com/nvm-sh/nvm) para la funcionalidad de detección automática
- Comunidad de Git por las mejores prácticas
- Todos los contribuidores del proyecto

## 📞 Soporte

- 🐛 [Reportar un bug](https://github.com/yourusername/gitx/issues)
- 💡 [Solicitar una característica](https://github.com/yourusername/gitx/issues)
- 📧 Email: support@gitx.dev

---

**Hecho con ❤️ por desarrolladores, para desarrolladores**
