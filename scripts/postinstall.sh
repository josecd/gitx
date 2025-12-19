#!/bin/bash

# GitX Post-Install Script
# Instala automáticamente el autocompletado después de npm install -g gitx

# Ejecutar en modo silencioso
set +e  # No fallar si algo sale mal

# Detectar el directorio de instalación del paquete
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPLETIONS_DIR="$(dirname "$SCRIPT_DIR")/completions"

# Detectar shell del usuario
SHELL_NAME=$(basename "$SHELL")

case "$SHELL_NAME" in
    zsh)
        # Determinar directorio de completions
        if [ -d "$HOME/.oh-my-zsh" ]; then
            COMPLETION_DIR="$HOME/.oh-my-zsh/completions"
        else
            COMPLETION_DIR="$HOME/.zsh/completion"
            mkdir -p "$COMPLETION_DIR" 2>/dev/null
            
            # Agregar a .zshrc solo si no existe
            if [ -f "$HOME/.zshrc" ] && ! grep -q "fpath=(~/.zsh/completion" "$HOME/.zshrc" 2>/dev/null; then
                cat >> "$HOME/.zshrc" << 'EOF'

# GitX completion
fpath=(~/.zsh/completion $fpath)
autoload -Uz compinit && compinit
EOF
            fi
        fi
        
        # Copiar archivo de completions
        if [ -f "$COMPLETIONS_DIR/gitx-completion.zsh" ]; then
            cp "$COMPLETIONS_DIR/gitx-completion.zsh" "$COMPLETION_DIR/_gitx" 2>/dev/null
            echo "✓ GitX: Autocompletado instalado para Zsh"
            echo "  Ejecuta: source ~/.zshrc"
        fi
        ;;
        
    bash)
        # Intentar directorios estándar
        if [ -d "/usr/local/etc/bash_completion.d" ] && [ -w "/usr/local/etc/bash_completion.d" ]; then
            cp "$COMPLETIONS_DIR/gitx-completion.bash" "/usr/local/etc/bash_completion.d/gitx" 2>/dev/null
            echo "✓ GitX: Autocompletado instalado para Bash"
        elif [ -d "$HOME/.bash_completion.d" ]; then
            cp "$COMPLETIONS_DIR/gitx-completion.bash" "$HOME/.bash_completion.d/gitx" 2>/dev/null
            echo "✓ GitX: Autocompletado instalado para Bash"
        else
            # Agregar a .bashrc
            mkdir -p "$HOME/.bash_completion.d" 2>/dev/null
            cp "$COMPLETIONS_DIR/gitx-completion.bash" "$HOME/.bash_completion.d/gitx" 2>/dev/null
            
            if [ -f "$HOME/.bashrc" ] && ! grep -q ".bash_completion.d/gitx" "$HOME/.bashrc" 2>/dev/null; then
                cat >> "$HOME/.bashrc" << 'EOF'

# GitX completion
[ -f ~/.bash_completion.d/gitx ] && source ~/.bash_completion.d/gitx
EOF
            fi
            echo "✓ GitX: Autocompletado instalado para Bash"
            echo "  Ejecuta: source ~/.bashrc"
        fi
        ;;
esac

exit 0  # Siempre salir con éxito para no bloquear npm install
