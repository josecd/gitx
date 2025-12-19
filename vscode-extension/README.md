# VS Code Extension: GitX Status Bar

Plugin opcional de VS Code que muestra el perfil Git activo en la barra de estado.

## Características

- 📊 **Status Bar Item**: Muestra el perfil activo en la esquina inferior izquierda
- 🔄 **Auto-refresh**: Se actualiza automáticamente al cambiar de carpeta
- 🎨 **Indicadores visuales**:
  - 🟢 Verde: Perfil con modo automático activado
  - 🟡 Amarillo: Perfil configurado pero sin modo automático
  - 🔴 Rojo: Sin perfil configurado
- 🖱️ **Quick switch**: Click en la barra para cambiar de perfil rápidamente

## Instalación

### Desde el código fuente

```bash
cd vscode-extension
npm install
npm run compile

# Instalar en VS Code
code --install-extension .
```

### Desde VSIX

```bash
cd vscode-extension
npm run package
code --install-extension gitx-status-bar-1.0.0.vsix
```

## Uso

La extensión se activa automáticamente cuando abres una carpeta que contenga un repositorio Git.

### Comandos

- **GitX: Switch Profile** - Abre el selector de perfiles
- **GitX: Refresh Status** - Actualiza manualmente la barra de estado

### Configuración

Abre VS Code Settings y busca "GitX":

```json
{
  "gitx.showInStatusBar": true,
  "gitx.autoRefresh": true
}
```

#### `gitx.showInStatusBar`

Tipo: `boolean`  
Default: `true`

Muestra u oculta el perfil en la barra de estado.

#### `gitx.autoRefresh`

Tipo: `boolean`  
Default: `true`

Actualiza automáticamente cuando cambias de carpeta.

## Desarrollo

### Estructura del proyecto

```
vscode-extension/
├── src/
│   └── extension.ts    # Código principal de la extensión
├── package.json        # Manifest de la extensión
├── tsconfig.json       # Configuración TypeScript
└── README.md          # Esta documentación
```

### Comandos de desarrollo

```bash
# Compilar
npm run compile

# Watch mode (desarrollo)
npm run watch

# Empaquetar
npm run package
```

### Debugging

1. Abre la carpeta `vscode-extension` en VS Code
2. Presiona F5 para abrir una nueva ventana con la extensión cargada
3. Abre una carpeta con un repositorio Git
4. Verás la barra de estado con tu perfil GitX

## Troubleshooting

### La extensión no se activa

Verifica que:
1. GitX esté instalado globalmente
2. Estés en una carpeta que contenga un repositorio Git
3. La configuración `gitx.showInStatusBar` esté en `true`

### La barra de estado no se actualiza

1. Ejecuta el comando "GitX: Refresh Status"
2. Verifica que `gitx.autoRefresh` esté en `true`
3. Cierra y vuelve a abrir la carpeta

## Licencia

MIT
