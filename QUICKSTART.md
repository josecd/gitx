# 🚀 GitX - Inicio Rápido (5 minutos)

## Instalación Rápida

```bash
# 1. Navegar al proyecto
cd /Users/alex/Documents/personal

# 2. Ejecutar instalador
./install.sh

# O manualmente:
npm install && npm run build && npm link
```

## Configuración Inicial (2 minutos)

### Opción 1: Migrar configuración existente (Recomendado)

```bash
gitx migrate
```

Esto importa automáticamente tu configuración actual de Git y crea tu primer perfil.

### Opción 2: Crear perfil desde cero

```bash
gitx profile add
```

## Uso Básico

### Ver tus perfiles

```bash
gitx list
```

### Cambiar de perfil

```bash
# En un repositorio específico
gitx switch trabajo

# Globalmente (todos los repositorios)
gitx switch personal --global
```

### Activar modo automático

```bash
# Dentro de un repositorio
gitx auto --enable
```

¡Listo! Ahora el perfil se aplicará automáticamente cuando entres a esta carpeta.

## Flujo de Trabajo Típico

### Para Freelancers

```bash
# 1. Crear perfiles para cada cliente
gitx profile add  # cliente-a
gitx profile add  # cliente-b
gitx profile add  # personal

# 2. En cada proyecto del cliente
cd ~/projects/cliente-a/app
gitx switch cliente-a
gitx auto --enable

cd ~/projects/cliente-b/website  
gitx switch cliente-b
gitx auto --enable

# 3. ¡Trabajar normalmente!
# GitX cambiará automáticamente el perfil según la carpeta
```

### Para Desarrolladores con Trabajo y Proyectos Personales

```bash
# 1. Migrar perfil actual
gitx migrate  # → "personal"

# 2. Agregar perfil de trabajo
gitx profile add  # → "trabajo"

# 3. Configurar carpetas
cd ~/work/company-project
gitx switch trabajo
gitx auto --enable

cd ~/projects/my-side-project
gitx switch personal
gitx auto --enable
```

## Comandos Esenciales

| Comando | Descripción |
|---------|-------------|
| `gitx migrate` | Importar config actual |
| `gitx list` | Ver todos los perfiles |
| `gitx switch <perfil>` | Cambiar perfil |
| `gitx auto --enable` | Activar auto-detección |
| `gitx doctor` | Diagnosticar problemas |
| `gitx profile current` | Ver perfil actual |

## Verificar Todo Funciona

```bash
# 1. Ver perfiles disponibles
gitx list

# 2. Ver perfil actual
gitx profile current

# 3. Verificar configuración de Git
git config user.name
git config user.email

# 4. Diagnosticar sistema
gitx doctor
```

## Próximos Pasos

- 📖 Lee el [README completo](README.md) para características avanzadas
- 💡 Revisa [ejemplos de uso](EXAMPLES.md) para casos específicos
- 🔧 Instala el [plugin de VS Code](vscode-extension/) (opcional)
- 🏥 Ejecuta `gitx doctor` para verificar tu configuración

## Solución Rápida de Problemas

### "gitx: command not found"

```bash
npm link
# o
sudo npm link
```

### El perfil no se aplica automáticamente

```bash
# Asegúrate de estar en un repo Git
git rev-parse --git-dir

# Activa el modo automático
gitx auto --enable

# Verifica la configuración
gitx profile current
```

### Problemas con SSH

```bash
gitx doctor --fix
```

## ¿Necesitas Ayuda?

```bash
gitx --help          # Ayuda general
gitx <comando> --help  # Ayuda de comando específico
```

---

**¡Disfruta de GitX!** 🎉

Si encuentras útil esta herramienta, dale una ⭐ en GitHub.
