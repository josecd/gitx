#!/bin/bash

# GitX Completion Installation Script

echo "🔧 Instalando autocompletado de GitX..."

# Detect shell
SHELL_NAME=$(basename "$SHELL")

case "$SHELL_NAME" in
    zsh)
        echo "✓ Detectado: Zsh"
        
        # Check if Oh My Zsh is installed
        if [ -d "$HOME/.oh-my-zsh" ]; then
            echo "✓ Oh My Zsh detectado"
            COMPLETION_DIR="$HOME/.oh-my-zsh/completions"
        else
            echo "✓ Usando directorio estándar"
            COMPLETION_DIR="$HOME/.zsh/completion"
            mkdir -p "$COMPLETION_DIR"
            
            # Add to .zshrc if not already there
            if ! grep -q "fpath=(~/.zsh/completion" "$HOME/.zshrc" 2>/dev/null; then
                echo "" >> "$HOME/.zshrc"
                echo "# GitX completion" >> "$HOME/.zshrc"
                echo "fpath=(~/.zsh/completion \$fpath)" >> "$HOME/.zshrc"
                echo "autoload -Uz compinit && compinit" >> "$HOME/.zshrc"
                echo "✓ Configuración agregada a ~/.zshrc"
            fi
        fi
        
        cp "$(dirname "$0")/gitx-completion.zsh" "$COMPLETION_DIR/_gitx"
        echo "✓ Archivo de completado instalado: $COMPLETION_DIR/_gitx"
        
        echo ""
        echo "🎉 Instalación completada!"
        echo "Ejecuta: source ~/.zshrc"
        echo "O reinicia tu terminal"
        ;;
        
    bash)
        echo "✓ Detectado: Bash"
        
        # Try different locations
        if [ -d "/usr/local/etc/bash_completion.d" ]; then
            COMPLETION_DIR="/usr/local/etc/bash_completion.d"
            sudo cp "$(dirname "$0")/gitx-completion.bash" "$COMPLETION_DIR/gitx"
        elif [ -d "/etc/bash_completion.d" ]; then
            COMPLETION_DIR="/etc/bash_completion.d"
            sudo cp "$(dirname "$0")/gitx-completion.bash" "$COMPLETION_DIR/gitx"
        else
            # Fallback: add to .bashrc
            if ! grep -q "gitx-completion.bash" "$HOME/.bashrc" 2>/dev/null; then
                echo "" >> "$HOME/.bashrc"
                echo "# GitX completion" >> "$HOME/.bashrc"
                echo "source $(pwd)/completions/gitx-completion.bash" >> "$HOME/.bashrc"
                echo "✓ Configuración agregada a ~/.bashrc"
            fi
        fi
        
        echo "✓ Archivo de completado instalado"
        echo ""
        echo "🎉 Instalación completada!"
        echo "Ejecuta: source ~/.bashrc"
        ;;
        
    *)
        echo "❌ Shell no soportado: $SHELL_NAME"
        echo "Shells soportados: zsh, bash"
        exit 1
        ;;
esac

echo ""
echo "📝 Ahora puedes usar:"
echo "  gitx <tab>          → Ver todos los comandos"
echo "  gitx switch <tab>   → Ver tus perfiles"
echo "  gitx profile <tab>  → Ver subcomandos"
