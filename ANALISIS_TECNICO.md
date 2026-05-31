# 🛠️ Análisis Técnico Detallado: GitX (Git Profile Manager)

Este documento presenta un análisis de arquitectura y especificación técnica detallada del proyecto **GitX**, un gestor de perfiles Git multiplataforma con detección automática de perfiles por directorio (a nivel de repositorio), automatización de claves SSH/GPG y un plugin de integración para Visual Studio Code.

---

## 📌 1. Arquitectura General y Concepto Core

El principal problema que resuelve **GitX** es la gestión de múltiples identidades Git (nombre, correo electrónico, claves de firma GPG y claves SSH) en una misma máquina de desarrollo. Esto es típico cuando un desarrollador trabaja en proyectos personales (ej: GitHub personal), proyectos de su empresa (ej: GitHub corporativo) y proyectos de clientes externos (ej: GitLab corporativo o Bitbucket).

Para solucionar esto, GitX implementa una solución de **dos capas**:
1. **Configuración local de Git (`.git/config`):** Sobrescribe dinámicamente las directivas de usuario (`user.name`, `user.email`, `user.signingkey`) a nivel local en el repositorio actual para evitar contaminación con la configuración global (`~/.gitconfig`).
2. **Enrutamiento SSH Virtualizado (`~/.ssh/config`):** Resuelve la colisión de claves SSH mediante alias de host (ej: `github.com-trabajo` frente a `github.com-personal`), asociando automáticamente cada alias con la clave privada SSH (`IdentityFile`) correspondiente de forma aislada.

### Diagrama de Flujo de Operaciones

```mermaid
graph TD
    A[Repositorio Git Local] --> B{¿Modo auto activado?}
    B -- Sí --> C[GitX lee ruta del repositorio]
    C --> D[Busca coincidencia más específica en ~/.gitx/config.json]
    D --> E{¿Coincidencia encontrada?}
    E -- Sí --> F[Aplica user.name / user.email locales en .git/config]
    E -- No --> G[Mantiene perfil actual o global]
    B -- No --> H[Usa configuración por defecto o manual]
    
    I[Clonado/Remoto inteligente] --> J[Transforma HTTPS / SSH standard a alias virtualizado]
    J --> K[git@github.com-perfil:usuario/repo.git]
    K --> L[SSH consulta ~/.ssh/config]
    L --> M[Aplica IdentityFile correspondiente al perfil]
```

---

## 📂 2. Estructura y Distribución de Archivos

El repositorio está estructurado de manera modular para separar la interfaz de línea de comandos (CLI), el núcleo de lógica, los scripts del ciclo de vida y la extensión para VS Code.

```
/Users/alex/Documents/personal/
├── 📦 Proyecto Principal (CLI)
│   ├── bin/
│   │   └── gitx                # Script wrapper que importa el bundle de la CLI compilada
│   ├── src/
│   │   ├── commands/           # Controladores de subcomandos de la CLI
│   │   │   ├── auto.ts         # Lógica de emparejamiento automático de directorios
│   │   │   ├── doctor.ts       # Módulo de diagnóstico del entorno (Git, SSH, GPG)
│   │   │   ├── migrate.ts      # Importación de configuraciones Git globales existentes
│   │   │   ├── profile.ts      # CRUD de perfiles y operaciones de intercambio (switch)
│   │   │   ├── remote.ts       # Clonación y transformación dinámica de URLs de remotos
│   │   │   └── unlink.ts       # Eliminación de configuraciones de GitX en repos o global
│   │   ├── cli.ts              # Punto de entrada de la CLI (Commander.js)
│   │   ├── config.ts           # Administrador del almacenamiento de configuración local
│   │   ├── git.ts              # Capa de abstracción/ejecución para comandos de Git
│   │   ├── platform.ts         # Adaptaciones específicas para SO (macOS, Linux, Windows)
│   │   ├── ssh.ts              # Gestor de criptografía SSH y actualización de ssh-config
│   │   ├── types.ts            # Definición de interfaces TypeScript
│   │   └── index.ts            # Exportación de la API de desarrollo de GitX
│   ├── dist/                   # Transpilación final a Javascript (ES Modules)
│   ├── completions/            # Scripts de autocompletado para Bash y Zsh
│   ├── scripts/                # Scripts auxiliares para el proceso de post-instalación
│   ├── package.json            # Metadatos de NPM, scripts y dependencias
│   └── tsconfig.json           # Configuración del compilador TypeScript (ES2022 / Node16)
│
└── 🎨 Extensión de VS Code
    └── vscode-extension/
        ├── src/
        │   └── extension.ts    # Módulo VS Code para la barra de estado e intercambio rápido
        ├── package.json        # Manifiesto de la extensión de VS Code
        └── tsconfig.json       # Configuración de compilación para la extensión
```

---

## 💻 3. Análisis Técnico del Core del Sistema

### 3.1. Gestión de Estado y Configuración (`src/config.ts`)
La configuración persistente se almacena localmente en la máquina del usuario bajo la ruta `~/.gitx/config.json`. 

El esquema de base de datos JSON de este archivo (`GitXConfig` definido en [types.ts](file:///Users/alex/Documents/personal/src/types.ts)) consta de:
* **`profiles`**: Un objeto asociativo de tipo clave-valor, donde la clave es el nombre del perfil (ej. `personal`) y el valor contiene la estructura `GitProfile` (`name`, `email`, `sshKey`, `signingKey`).
* **`folderProfiles`**: Un arreglo de objetos `{ path: string, profile: string }` que asocia rutas de directorios absolutas a perfiles concretos.
* **`defaultProfile`**: Nombre del perfil global por defecto (String).

El método crucial en [config.ts](file:///Users/alex/Documents/personal/src/config.ts) es la resolución jerárquica de rutas en el sistema de archivos:
```typescript
async getFolderProfile(path: string): Promise<string | undefined> {
  const config = await this.load();
  let bestMatch: FolderProfile | undefined;
  let bestMatchLength = 0;

  for (const fp of config.folderProfiles) {
    if (path.startsWith(fp.path) && fp.path.length > bestMatchLength) {
      bestMatch = fp;
      bestMatchLength = fp.path.length;
    }
  }
  return bestMatch?.profile;
}
```
* **Principio de resolución:** Este algoritmo recorre los directorios configurados y selecciona el emparejamiento con el prefijo más largo (`bestMatchLength`). Esto permite anidación de perfiles (ej: tener un perfil general de trabajo en `~/workspace` y uno específico de un cliente en `~/workspace/cliente-x`).

---

### 3.2. Gestión e Integración Criptográfica SSH (`src/ssh.ts`)
Para evitar colisiones cuando varias cuentas acceden al mismo proveedor de Git (ej: GitHub), GitX implementa una técnica de redireccionamiento de hosts virtuales en el archivo de configuración SSH (`~/.ssh/config`).

1. **Generación automática:** Utiliza criptografía moderna de curva elíptica generating claves `ed25519` a través del comando nativo:
   ```bash
   ssh-keygen -t ed25519 -C "[email]" -f "~/.ssh/id_ed25519_[profileName]" -N ""
   ```
2. **Actualización de `~/.ssh/config`:** Inserta entradas específicas para redireccionar los hosts:
   ```text
   # [profileName] - GitHub
   Host github.com-[profileName]
     HostName github.com
     User git
     IdentityFile ~/.ssh/id_ed25519_[profileName]
     IdentitiesOnly yes
   ```
   * El parámetro `IdentitiesOnly yes` es vital: le indica al cliente de SSH que use **únicamente** la clave definida mediante `IdentityFile`, evitando que intente autenticarse con otras claves cargadas en el agente SSH (lo que a menudo provoca rechazos por exceso de intentos de autenticación: *Too many authentication failures*).
3. **Automatización de `ssh-agent`:** Intenta iniciar el agente SSH mediante `eval "$(ssh-agent -s)"` en entornos Unix y añade la clave privada automáticamente mediante `ssh-add [path]`.

---

### 3.3. Intercepción y Transformación de Remotos (`src/commands/remote.ts`)
Para que el ruteo SSH virtual funcione, las URLs de los repositorios locales clonados deben reescribirse para apuntar al host virtual en lugar del host estándar.

En [remote.ts](file:///Users/alex/Documents/personal/src/commands/remote.ts), el método `transformURL` se encarga de reescribir tanto las URLs tipo SSH como las de tipo HTTPS:

| Formato Original | Perfil | Formato Transformado |
| :--- | :--- | :--- |
| `git@github.com:user/repo.git` | `work` | `git@github.com-work:user/repo.git` |
| `https://github.com/user/repo.git` | `personal` | `git@github.com-personal:user/repo.git` |
| `git@gitlab.com:user/repo.git` | `cliente` | `git@gitlab.com-cliente:user/repo.git` |

Cuando el desarrollador ejecuta `gitx clone <url> --profile <nombre>`, la herramienta:
1. Resuelve el perfil y transforma la URL.
2. Clona el repositorio con el comando transformado.
3. Se desplaza al directorio recién creado.
4. Vincula esa ruta del directorio en `~/.gitx/config.json` para habilitar la detección automática.
5. Inyecta la configuración local `user.name` y `user.email` dentro de `.git/config` del repositorio clonado.

---

### 3.4. Detección Dinámica (`src/commands/auto.ts` & Git Hooks)
El comando `gitx auto --enable` registra la raíz del repositorio Git actual dentro de la base de datos de GitX. 

Para que este proceso sea reactivo y funcione de la misma forma que herramientas como `nvm` o `direnv`, GitX ofrece integración a través del hook de Git `post-checkout`. Esto permite evaluar y reaplicar la configuración correspondiente en cada transición de rama o cambio de directorio Git:

```bash
# Integración mediante Hooks
echo '#!/bin/sh\ngitx hook --silent' > .git/hooks/post-checkout
chmod +x .git/hooks/post-checkout
```

Al dispararse, `gitx hook` ejecuta en segundo plano `autoCmd.applyProfile()`, comparando silenciosamente el estado actual en `.git/config` local con el perfil definido en GitX y actualizándolo en milisegundos si difiere.

---

### 3.5. Diagnósticos Automatizados (`src/commands/doctor.ts`)
El subcomando `gitx doctor` implementa un flujo de diagnóstico secuencial que retorna un informe tipado (`DoctorCheckResult`):

```typescript
export interface DoctorCheckResult {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  fix?: () => Promise<void>;
}
```

Cada módulo de verificación encapsula una función correctora (`fix`):
* **Verificación de Git:** Comprueba la presencia del ejecutable en las variables de entorno.
* **Integridad de Configuración:** Alerta si no se han inicializado las variables globales de Git requeridas.
* **Integridad de Claves SSH:** Analiza el directorio `~/.ssh/`, detecta claves sin agregar al agente SSH actual y permite inyectarlas mediante `ssh-add` en su rutina de corrección.
* **Verificaciones de Conectividad:** Realiza handshakes de SSH silenciosos contra servidores remotos (ej: `ssh -T git@github.com`).
* **Configuración GPG:** Detecta si existen claves de firma GPG en la máquina local para firmar criptográficamente commits de forma transparente.

---

## 🛠️ 4. Flujos de Trabajo Extendidos (Scripts y VS Code)

### 4.1. Extension para Visual Studio Code (`vscode-extension/`)
Ubicada en `vscode-extension/src/extension.ts`, esta extensión interactúa de manera reactiva con la CLI de GitX.

1. **Monitoreo Reactivo:** Configura un `vscode.workspace.createFileSystemWatcher` escuchando los cambios en `~/.gitx/config.json`. Cada vez que el desarrollador interactúa con la CLI (añadiendo, editando o eliminando perfiles), la extensión de VS Code actualiza su estado interno sin necesidad de reiniciar el editor.
2. **Detección del Workspace:** Lee `vscode.workspace.workspaceFolders?.[0]` para obtener la ruta física. Determina si es un repositorio Git, calcula la raíz del repositorio y busca la coincidencia del perfil.
3. **Barra de Estado Contextual:** Muestra el perfil actual en la barra de estado con colores dinámicos:
   * **Verde / Estándar:** Perfil correctamente asociado y emparejado de forma automática.
   * **Amarillo (`statusBarItem.warningBackground`):** Configuración Git manual presente en el directorio, pero el repositorio no está enlazado en el modo auto de GitX.
   * **Rojo (`statusBarItem.errorBackground`):** No se detectó configuración ni perfil para el repositorio actual.
4. **Intercambiador Rápido:** Al hacer clic en la barra de estado, ejecuta un QuickPick listando todos los perfiles de `config.json`. Si el usuario selecciona uno, la extensión abre un terminal dedicado e invoca de forma transparente `gitx switch <perfil>`.

### 4.2. Autocompletado del Shell (`completions/`)
El autocompletado en tabulación para terminales Unix se soporta mediante dos implementaciones:
* **Zsh (`gitx-completion.zsh`):** Implementa el sistema de autocompletado moderno de Zsh utilizando la función `compdef`. Resuelve en tiempo real los comandos disponibles y consulta la lista de perfiles guardados directamente leyendo el JSON de configuración para el subcomando `gitx switch`.
* **Bash (`gitx-completion.bash`):** Utiliza la utilidad integrada `complete` y `compgen` para responder a tabulaciones de subcomandos.

El script de post-instalación (`postinstall.js`) y `install-completion.sh` copian estos scripts a los directorios de autocompletado estándar (`~/.oh-my-zsh/completions/` o `/etc/bash_completion.d/`) dependiendo del shell activo del usuario.

---

## ⚙️ 5. Pila Tecnológica e Infraestructura

* **Lenguaje:** TypeScript transpilado a JavaScript moderno ES Modules (ESM) para soportar importaciones dinámicas (`import()`) nativas.
* **Procesamiento de Comandos CLI:** `commander` versión `^11.1.0`. Permite modularizar los comandos y manejar flags/opciones fuertemente tipados.
* **Interacciones por Consola:** `inquirer` versión `^9.2.12` para desplegar interfaces interactivas por consola (selección de listas, campos opcionales, confirmaciones booleanas).
* **Diseño e Interfaz de Terminal:** `chalk` (`^5.3.0`) para formateo cromático de la terminal y `ora` (`^7.0.1`) para desplegar loaders visuales síncronos en tareas bloqueantes (ej: pruebas de red o generación de claves SSH).
* **Interoperabilidad del S.O.:** Módulo nativo `child_process` envuelto en utilidades asíncronas (`promisify(exec)`) para ejecutar llamadas directas al binario de Git local y la utilidad de SSH de manera eficiente.

---

## 🛠️ 6. Guía de Construcción y Despliegue en Desarrollo

Para compilar, depurar y enlazar el entorno de desarrollo localmente:

1. **Instalación de Dependencias del Proyecto:**
   ```bash
   npm install
   ```
2. **Transpilación TypeScript (Modo Watcher para desarrollo):**
   ```bash
   npm run dev
   ```
   Esto mantiene el compilador de TypeScript observando los archivos en `./src` y transpilando los cambios automáticamente a la carpeta `./dist`.
3. **Compilación de Producción:**
   ```bash
   npm run build
   ```
   Este comando compila el proyecto y ejecuta el script `set-executable.js` para asegurar que el archivo `dist/cli.js` tenga los permisos Unix necesarios (`chmod +x`).
4. **Instalación Global Local (npm link):**
   ```bash
   npm link
   ```
   Esto creará un enlace simbólico del binario global en tu sistema para apuntar al ejecutable `bin/gitx` de este directorio de desarrollo, permitiendo usar el comando `gitx` en cualquier terminal del sistema.
5. **Ejecución de Pruebas Unitarias:**
   ```bash
   npm test
   ```
