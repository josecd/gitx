# Ejemplos de Uso de GitX

## Ejemplo 1: Freelancer con múltiples clientes

```bash
# Paso 1: Migrar configuración personal existente
$ gitx migrate
✓ Perfil "personal" creado exitosamente
✓ Perfil "personal" establecido como predeterminado

# Paso 2: Agregar perfiles para cada cliente
$ gitx profile add
? Nombre del perfil: cliente-acme
? Nombre completo: Juan Pérez
? Email: juan@acme.com
? Clave GPG (opcional): 

✓ Perfil "cliente-acme" creado exitosamente

$ gitx profile add
? Nombre del perfil: cliente-tech
? Nombre completo: Juan Pérez
? Email: juan@techcorp.com
? Clave GPG (opcional): 

✓ Perfil "cliente-tech" creado exitosamente

# Paso 3: Configurar repositorios
$ cd ~/proyectos/acme/website
$ gitx switch cliente-acme
✓ Perfil local cambiado a: cliente-acme
? ¿Activar modo automático para este repositorio? Yes
✓ Modo automático activado

$ cd ~/proyectos/tech/app
$ gitx switch cliente-tech
✓ Perfil local cambiado a: cliente-tech
? ¿Activar modo automático para este repositorio? Yes
✓ Modo automático activado

# Paso 4: Verificar
$ gitx list
📋 Perfiles configurados:

★ personal
  Juan Pérez <juan@personal.com>

○ cliente-acme
  Juan Pérez <juan@acme.com>
  Auto: /Users/juan/proyectos/acme/website

○ cliente-tech
  Juan Pérez <juan@techcorp.com>
  Auto: /Users/juan/proyectos/tech/app
```

## Ejemplo 2: Desarrollador con trabajo y proyectos personales

```bash
# Configuración inicial
$ gitx migrate
? ¿Qué nombre quieres darle a este perfil? work
✓ Perfil "work" creado exitosamente

$ gitx profile add
? Nombre del perfil: personal
? Nombre completo: María García
? Email: maria@gmail.com
✓ Perfil "personal" creado exitosamente

# Configurar carpeta de trabajo completa
$ cd ~/work
$ gitx switch work --global
✓ Perfil global cambiado a: work

# Ahora todos los repos en ~/work usarán el perfil "work"

# Configurar proyectos personales
$ cd ~/proyectos/mi-blog
$ gitx switch personal
$ gitx auto --enable
✓ Modo automático activado

$ cd ~/proyectos/side-project
$ gitx switch personal
$ gitx auto --enable
✓ Modo automático activado
```

## Ejemplo 3: Diagnosticar problemas

```bash
$ gitx doctor
🏥 GitX Doctor - Diagnóstico del sistema

📋 Resultados:

✓ Instalación de Git
  git version 2.39.0

✓ Configuración global de Git
  María García <maria@gmail.com>

⚠️ Claves SSH
  2 clave(s) encontrada(s), pero no agregadas al agente SSH

❌ Conexión SSH a GitHub
  No se pudo conectar

✓ Conexión SSH a GitLab
  Conectado correctamente

⚠️ GPG (firma de commits)
  No se encontraron claves GPG (opcional)

❌ Se encontraron errores que requieren atención
Usa: gitx doctor --fix para intentar corregirlos automáticamente

$ gitx doctor --fix
🔧 Aplicando correcciones...

✓ Claves SSH corregido
✓ Conexión SSH a GitHub corregido
```

## Ejemplo 4: Limpieza de repositorio

```bash
# Ver configuración actual
$ gitx profile current
📍 Configuración actual (local):

Git config local:
  Nombre: María García
  Email: maria@oldcompany.com
  GPG: ABC123

Modo auto: old-work

# Limpiar configuración local
$ gitx unlink
⚠️  Limpieza de repositorio local

Repositorio: /Users/maria/old-projects/app

Configuración actual:
  Nombre: María García
  Email: maria@oldcompany.com
  GPG: ABC123

Modo automático:
  Perfil asociado: old-work

? ¿Deseas eliminar toda la configuración de este repositorio? Yes

✓ Configuración local de Git eliminada
✓ Asociación de modo automático eliminada

🎉 Repositorio limpio
```

## Ejemplo 5: Cambio rápido de perfiles

```bash
# Situación: Necesitas hacer un commit rápido con otro perfil

# Ver perfil actual
$ gitx profile current
📍 Configuración actual (local):
  Email: maria@company.com

# Cambiar temporalmente
$ gitx switch personal
✓ Perfil local cambiado a: personal

# Hacer tus commits
$ git commit -m "Update README"

# Volver al perfil anterior
$ gitx switch work
✓ Perfil local cambiado a: work
```

## Ejemplo 6: Migración desde configuración manual

```bash
# Tienes Git configurado manualmente
$ git config --global user.name
John Doe
$ git config --global user.email
john@example.com

# Migrar a GitX
$ gitx migrate
📦 GitX Migrate - Importar configuración existente

Configuración global encontrada:
  Nombre: John Doe
  Email: john@example.com

? ¿Qué nombre quieres darle a este perfil? main
? ¿Deseas asociar una clave SSH a este perfil? Yes
? Selecciona la clave SSH: /Users/john/.ssh/id_ed25519
? ¿Deseas establecer este perfil como predeterminado? Yes
? ¿Deseas activar el modo automático para este repositorio? Yes

✓ Perfil "main" creado exitosamente
✓ Perfil "main" establecido como predeterminado
✓ Modo automático activado para: /Users/john/project

🎉 Migración completada
```

## Ejemplo 7: Uso del plugin de VS Code

```
1. Instalar el plugin
2. Abrir VS Code en un proyecto Git
3. Ver en la barra de estado: 
   
   [barra inferior]
   🌿 work

4. Click en "work" para cambiar de perfil
   
   Selector aparece con opciones:
   ★ work - John Doe <john@company.com> • Currently active
   ○ personal - John Doe <john@personal.com>
   ○ client-a - John Doe <john@clienta.com>

5. Seleccionar "personal"
   
   Terminal se abre automáticamente con:
   $ gitx switch personal
   ✓ Perfil local cambiado a: personal
   
   Barra de estado se actualiza:
   🌿 personal
```

## Ejemplo 8: Integración con Git Hooks

```bash
# Configurar hook post-checkout
$ cd mi-proyecto
$ cat > .git/hooks/post-checkout << 'EOF'
#!/bin/sh
# Auto-aplicar perfil GitX después de checkout
gitx hook --silent
EOF

$ chmod +x .git/hooks/post-checkout

# Ahora al hacer checkout, el perfil se aplica automáticamente
$ git checkout main
🔄 Perfil aplicado automáticamente: work
   John Doe <john@company.com>

$ git checkout feature/personal-experiment
🔄 Perfil aplicado automáticamente: personal
   John Doe <john@personal.com>
```

## Ejemplo 9: Troubleshooting común

```bash
# Problema: El perfil no se aplica automáticamente

# Verificar configuración
$ gitx profile current
📍 Configuración actual (local):
No hay configuración local

Modo auto: (ninguno)

# Solución: Activar modo automático
$ gitx auto --enable
⚠️  No se encontró un perfil configurado para esta carpeta
Usa: gitx switch <profile> para configurar un perfil

$ gitx switch work
✓ Perfil local cambiado a: work
? ¿Activar modo automático para este repositorio? Yes
✓ Modo automático activado

# Verificar nuevamente
$ gitx profile current
📍 Configuración actual (local):

Git config local:
  Nombre: John Doe
  Email: john@company.com

Modo auto: work

✓ ¡Problema resuelto!
```
