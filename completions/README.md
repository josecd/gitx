# GitX Shell Completion

Scripts de autocompletado para GitX en bash y zsh.

## Instalación

### Para Zsh (macOS default)

```bash
# Opción 1: Manual
mkdir -p ~/.zsh/completion
cp completions/gitx-completion.zsh ~/.zsh/completion/_gitx

# Agregar a ~/.zshrc
echo 'fpath=(~/.zsh/completion $fpath)' >> ~/.zshrc
echo 'autoload -Uz compinit && compinit' >> ~/.zshrc

# Recargar shell
source ~/.zshrc
```

```bash
# Opción 2: Usar Oh My Zsh
cp completions/gitx-completion.zsh ~/.oh-my-zsh/completions/_gitx
source ~/.zshrc
```

### Para Bash

```bash
# Copiar el script
sudo cp completions/gitx-completion.bash /usr/local/etc/bash_completion.d/gitx

# O agregar manualmente a ~/.bashrc
echo 'source /path/to/completions/gitx-completion.bash' >> ~/.bashrc

# Recargar
source ~/.bashrc
```

## Script de instalación automática

```bash
# Ejecutar desde el directorio del proyecto
./install-completion.sh
```

## Uso

Después de instalar, puedes usar tab para autocompletar:

```bash
gitx <tab>          # Muestra todos los comandos
gitx p<tab>         # Autocompleta profile/publish
gitx profile <tab>  # Muestra add/list/remove/current
gitx switch <tab>   # Muestra tus perfiles disponibles
gitx auto --<tab>   # Muestra --enable/--disable/--path
```

## Desinstalar

### Zsh
```bash
rm ~/.zsh/completion/_gitx
# o
rm ~/.oh-my-zsh/completions/_gitx
```

### Bash
```bash
sudo rm /usr/local/etc/bash_completion.d/gitx
```
