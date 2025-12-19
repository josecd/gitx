# Guía de Contribución

¡Gracias por tu interés en contribuir a GitX! 🎉

## Cómo Contribuir

### Reportar Bugs

Si encuentras un bug:

1. Verifica que el bug no haya sido reportado en [Issues](https://github.com/yourusername/gitx/issues)
2. Abre un nuevo issue con:
   - Título descriptivo
   - Pasos para reproducir el bug
   - Comportamiento esperado vs comportamiento actual
   - Versión de GitX, Node.js, Git y sistema operativo
   - Logs relevantes (si aplica)

### Sugerir Nuevas Características

Para proponer nuevas funcionalidades:

1. Abre un issue con el tag "enhancement"
2. Describe la característica y el problema que resuelve
3. Proporciona ejemplos de uso
4. Explica por qué sería útil para otros usuarios

### Pull Requests

1. **Fork el repositorio**
   ```bash
   git clone https://github.com/yourusername/gitx.git
   cd gitx
   ```

2. **Crea una rama para tu feature**
   ```bash
   git checkout -b feature/mi-nueva-caracteristica
   ```

3. **Haz tus cambios**
   - Sigue las convenciones de código existentes
   - Agrega tests si es aplicable
   - Actualiza la documentación

4. **Compila y prueba**
   ```bash
   npm run build
   npm test
   ```

5. **Commit tus cambios**
   ```bash
   git commit -m "feat: agregar nueva característica"
   ```

   Usamos [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` nueva característica
   - `fix:` corrección de bug
   - `docs:` cambios en documentación
   - `style:` formato de código
   - `refactor:` refactorización
   - `test:` agregar o modificar tests
   - `chore:` tareas de mantenimiento

6. **Push a tu fork**
   ```bash
   git push origin feature/mi-nueva-caracteristica
   ```

7. **Abre un Pull Request**
   - Describe los cambios realizados
   - Referencia issues relacionados
   - Incluye screenshots si aplica

## Estructura del Proyecto

```
gitx/
├── src/
│   ├── commands/      # Comandos CLI
│   │   ├── auto.ts
│   │   ├── doctor.ts
│   │   ├── migrate.ts
│   │   ├── unlink.ts
│   │   └── profile.ts
│   ├── cli.ts         # Punto de entrada CLI
│   ├── config.ts      # Gestor de configuración
│   ├── git.ts         # Wrapper de Git
│   ├── types.ts       # Definiciones TypeScript
│   └── index.ts       # Exportaciones principales
├── vscode-extension/  # Plugin de VS Code
├── dist/              # Código compilado
└── docs/              # Documentación adicional
```

## Guías de Estilo

### TypeScript

- Usa TypeScript estricto
- Define tipos explícitos
- Evita `any` cuando sea posible
- Usa async/await sobre callbacks

### Nombres

- **Archivos**: kebab-case (`git-manager.ts`)
- **Clases**: PascalCase (`GitManager`)
- **Funciones**: camelCase (`getCurrentConfig`)
- **Constantes**: UPPER_SNAKE_CASE (`CONFIG_DIR`)

### Código

```typescript
// ✅ Bueno
async function getCurrentConfig(): Promise<GitConfig> {
  const config = await loadConfig();
  return config;
}

// ❌ Malo
async function getCurrentConfig() {
  return await loadConfig();
}
```

### Mensajes de Usuario

- Usa emojis para mejorar la experiencia
- Usa chalk para colorear (verde=éxito, rojo=error, amarillo=advertencia)
- Proporciona mensajes de ayuda útiles
- Incluye sugerencias de solución en errores

```typescript
// ✅ Bueno
console.log(chalk.green('✓ Perfil creado exitosamente'));
console.log(chalk.dim('Usa: gitx switch <profile> para cambiar'));

// ❌ Malo
console.log('Profile created');
```

## Tests

Actualmente estamos trabajando en agregar tests. Si quieres contribuir:

1. Agrega tests unitarios en `__tests__/`
2. Usa Jest como framework
3. Asegura al menos 80% de cobertura
4. Incluye tests de integración para comandos principales

```typescript
describe('ConfigManager', () => {
  it('should load config correctly', async () => {
    const manager = new ConfigManager();
    const config = await manager.load();
    expect(config).toBeDefined();
  });
});
```

## Documentación

- Actualiza README.md si cambias funcionalidad
- Agrega ejemplos en EXAMPLES.md para nuevas características
- Documenta funciones públicas con JSDoc
- Actualiza CHANGELOG.md

```typescript
/**
 * Loads the GitX configuration from disk.
 * Creates a default config if none exists.
 * @returns Promise resolving to the configuration
 */
async load(): Promise<GitXConfig> {
  // ...
}
```

## Proceso de Review

1. Todos los PRs requieren al menos una aprobación
2. Los checks de CI deben pasar
3. El código debe seguir las guías de estilo
4. La documentación debe estar actualizada

## Código de Conducta

- Sé respetuoso y constructivo
- Acepta críticas constructivas
- Enfócate en lo mejor para la comunidad
- Ayuda a otros contribuidores

## Preguntas

Si tienes preguntas:

- Abre un issue con el tag "question"
- Únete a nuestras discusiones en GitHub
- Contacta a los mantenedores

## Licencia

Al contribuir, aceptas que tu código se publicará bajo la licencia MIT del proyecto.

---

¡Gracias por hacer GitX mejor! 🚀
