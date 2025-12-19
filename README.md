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

### 🚀 Automatización SSH

- **🔐 SSH automático** - Genera claves SSH ed25519 al crear perfiles
- **⚙️ Configuración inteligente** - Actualiza ~/.ssh/config automáticamente
- **🔑 Gestión de agente** - Agrega claves al ssh-agent automáticamente
- **🌐 Hosts personalizados** - Crea hosts como `github.com-personal` y `github.com-work`

### 📡 Gestión de Remotos

- **`gitx remote add`** - Agrega remotos con URLs inteligentes
- **`gitx remote fix`** - Corrige URLs de remotos existentes para usar el perfil correcto
- **`gitx clone`** - Clona repositorios con configuración automática del perfil

### ⚡ Comandos Rápidos

- **`gitx commit`** - Commit rápido con mensaje (equivalente a `git commit -am`)
- **`gitx publish`** - Push al remoto con tracking automático

### 🎨 Otras Características

- 🔄 **Cambio rápido** entre perfiles con `gitx switch`
- 📝 **Gestión completa** de perfiles (añadir, listar, eliminar)
- 🔐 **Soporte SSH** y claves GPG para firma de commits
- 🌍 **Configuración global y local** independiente
- 💼 **Ideal para freelancers** con múltiples clientes
- 👥 **Perfecto para equipos** con diferentes cuentas
- ⌨️ **Autocompletado shell** - Tab completion para bash y zsh (se instala automáticamente)

## 📦 Instalación

### Requisitos Previos

- Node.js >= 18.0.0
- Git instalado y configurado
- npm o yarn

### Instalación desde NPM (Recomendado)

```bash
# Instalación global desde npm
npm install -g gitx

# El autocompletado se instala automáticamente para tu shell
# Solo necesitas ejecutar:
source ~/.zshrc  # Para Zsh
source ~/.bashrc # Para Bash
```

### Instalación desde Código Fuente

```bash
# Clonar el repositorio
git clone https://github.com/josecd/gitx.git
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

**✨ Nuevo:** GitX ahora configura SSH automáticamente:
- ✅ Genera una clave SSH ed25519 para el perfil
- ✅ La agrega al ssh-agent
- ✅ Configura ~/.ssh/config con host personalizado (ej: `github.com-personal`)
- ✅ Te muestra la clave pública para copiarla a GitHub/GitLab

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

#### `gitx remote`

Gestión inteligente de remotos con transformación automática de URLs.

```bash
# Agregar remoto con URL inteligente
gitx remote add origin https://github.com/user/repo.git
# Transforma a: git@github.com-personal:user/repo.git (usando tu perfil actual)

# Corregir remoto existente para usar el perfil correcto
gitx remote fix origin
# Detecta el perfil y actualiza la URL para usar el host SSH correcto

# Listar remotos
gitx remote list
```

**¿Cómo funciona?**
- Detecta automáticamente el perfil activo
- Transforma URLs HTTPS a SSH con host personalizado
- Asegura que uses la clave SSH correcta para cada perfil
- Soporta GitHub, GitLab, Bitbucket y otros servicios

#### `gitx clone`

Clona repositorios y configura automáticamente el perfil.

```bash
# Clonar con perfil específico
gitx clone https://github.com/user/repo.git --profile work

# Clonar detectando el perfil de la carpeta actual
gitx clone https://github.com/user/repo.git

# Clonar a un directorio específico
gitx clone https://github.com/user/repo.git --path ~/projects/nuevo-proyecto
```

**Ventajas:**
- Transforma la URL automáticamente para usar tu clave SSH
- Configura el perfil en el repositorio clonado
- Activa el modo automático si estás en una carpeta asociada

#### `gitx commit` y `gitx publish`

Comandos rápidos para flujo de trabajo común.

```bash
# Commit rápido con stage automático
gitx commit "Agrega nueva función"
# Equivalente a: git add -A && git commit -m "Agrega nueva función"

# Publicar cambios al remoto
gitx publish
# Detecta la rama actual y hace push con --set-upstream si es necesario

# Combinación común:
gitx commit "Fix bug" && gitx publish
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

### Autocompletado Shell

GitX incluye autocompletado para bash y zsh que se instala automáticamente:

**Características:**
- ⌨️ Completado de comandos: `gitx <tab>`
- 🔄 Completado de subcomandos: `gitx profile <tab>`
- 📝 Completado de perfiles: `gitx switch <tab>` muestra tus perfiles
- 🚀 Completado de opciones: `gitx doctor --<tab>`

**Instalación manual (si es necesario):**

```bash
# Zsh
cp completions/gitx-completion.zsh ~/.oh-my-zsh/completions/_gitx
source ~/.zshrc

# Bash
sudo cp completions/gitx-completion.bash /usr/local/etc/bash_completion.d/gitx
source ~/.bashrc
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

# Agregar perfil de trabajo (SSH se configura automáticamente)
gitx profile add  # work
# GitX genera la clave SSH y muestra la pública para agregar a GitHub

# Configurar carpetas
cd ~/work
gitx switch work --global  # Todos los repos en ~/work
gitx auto --enable

# Clonar nuevo proyecto de trabajo con configuración automática
gitx clone https://github.com/company/project.git

cd ~/projects/personal
gitx switch personal
gitx auto --enable

# Workflow rápido
gitx commit "Nueva característica" && gitx publish
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

### Remoto usa HTTPS en lugar de SSH

Corrige los remotos para usar SSH con tu perfil:

```bash
# Ver remotos actuales
git remote -v

# Corregir para usar SSH con tu perfil
gitx remote fix origin

# Verificar
git remote -v
# Debería mostrar: git@github.com-personal:user/repo.git
```

### El autocompletado no funciona

```bash
# Verificar instalación
ls ~/.oh-my-zsh/completions/_gitx  # Zsh
ls ~/.bash_completion.d/gitx        # Bash

# Reinstalar manualmente
bash completions/install-completion.sh
source ~/.zshrc  # o ~/.bashrc
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

## � Enlaces

- 📦 [Paquete NPM](https://www.npmjs.com/package/gitx)
- 🐙 [Repositorio GitHub](https://github.com/josecd/gitx)
- 📖 [Ejemplos detallados](EXAMPLES.md)
- 🤝 [Guía de contribución](CONTRIBUTING.md)

## 📞 Soporte

- 🐛 [Reportar un bug](https://github.com/josecd/gitx/issues)
- 💡 [Solicitar una característica](https://github.com/josecd/gitx/issues)
- 📧 Email: jose-cordero.dz@hotmail.com

---

**Hecho con ❤️ por desarrolladores, para desarrolladores**
