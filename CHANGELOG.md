# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-19

### Añadido

#### Características Principales
- ✨ **gitx auto** - Detección automática de perfiles por carpeta (nivel nvm real)
- 🏥 **gitx doctor** - Diagnóstico y reparación automática de problemas Git/SSH
- 📦 **gitx migrate** - Importación de configuración existente de Git
- 🧹 **gitx unlink** - Limpieza de configuraciones de repositorios
- 📊 **gitx status-bar** - Plugin de VS Code para visualizar perfil activo

#### Gestión de Perfiles
- Crear, listar, eliminar y cambiar entre perfiles
- Soporte para perfiles locales y globales
- Configuración de perfil predeterminado
- Asociación de carpetas con perfiles específicos

#### Características Técnicas
- Soporte para múltiples claves SSH
- Firma de commits con GPG
- Validación de configuración completa
- Sistema de hooks para automatización

#### Documentación
- README completo con ejemplos de uso
- Guía de instalación paso a paso
- Documentación de casos de uso comunes
- Ejemplos detallados para diferentes escenarios

#### VS Code Extension
- Indicador visual en la barra de estado
- Cambio rápido de perfiles desde VS Code
- Actualización automática al cambiar carpetas
- Configuración personalizable

### Características de Seguridad
- Validación de emails y nombres de perfil
- Manejo seguro de claves SSH y GPG
- Confirmaciones para operaciones destructivas
- Modo --force para operaciones sin confirmación

### Características de Usabilidad
- Interfaz interactiva con inquirer
- Mensajes coloridos con chalk
- Spinners de progreso con ora
- Mensajes de error descriptivos y útiles

---

[1.0.0]: https://github.com/yourusername/gitx/releases/tag/v1.0.0
