#compdef gitx

# GitX zsh completion script

_gitx() {
    local line state

    _arguments -C \
        "1: :->cmds" \
        "*::arg:->args"

    case "$state" in
        cmds)
            _values 'gitx commands' \
                'auto[Detectar y aplicar perfil automáticamente]' \
                'doctor[Diagnosticar y arreglar problemas]' \
                'migrate[Importar configuración existente]' \
                'unlink[Limpiar configuración del repositorio]' \
                'profile[Gestionar perfiles]' \
                'switch[Cambiar a un perfil específico]' \
                'list[Listar todos los perfiles]' \
                'clone[Clonar repositorio con perfil automático]' \
                'remote[Gestionar remotes con perfiles]' \
                'commit[Add + commit en uno]' \
                'publish[Add + commit + push en uno]' \
                'hook[Aplicar perfil automáticamente]' \
                'commands[Mostrar lista detallada de comandos]'
            ;;
        args)
            case $line[1] in
                profile)
                    _values 'profile commands' \
                        'add[Agregar nuevo perfil]' \
                        'list[Listar perfiles]' \
                        'ls[Listar perfiles]' \
                        'remove[Eliminar perfil]' \
                        'rm[Eliminar perfil]' \
                        'current[Mostrar perfil actual]'
                    ;;
                remote)
                    _values 'remote commands' \
                        'add[Agregar remote con host correcto]' \
                        'fix[Arreglar remotes existentes]'
                    ;;
                switch|remove|rm)
                    # Get profile names from config
                    if [[ -f ~/.gitx/config.json ]]; then
                        local profiles=(${(f)"$(cat ~/.gitx/config.json | grep -o '"[^"]*":' | grep -v profiles | grep -v folderProfiles | grep -v defaultProfile | tr -d '":' | tr '\n' ' ')"})
                        _values 'profiles' $profiles
                    fi
                    ;;
                auto)
                    _arguments \
                        '--enable[Activar modo automático]' \
                        '--disable[Desactivar modo automático]' \
                        '--path[Ruta del repositorio]:path:_files -/'
                    ;;
                doctor)
                    _arguments \
                        '--fix[Intentar corregir automáticamente]'
                    ;;
                unlink)
                    _arguments \
                        '--force[No pedir confirmación]' \
                        '--global[Limpiar configuración global]' \
                        '--path[Ruta del repositorio]:path:_files -/'
                    ;;
                publish)
                    _arguments \
                        '(-m --message)'{-m,--message}'[Mensaje del commit]:message:' \
                    ;;
                clone)
                    _arguments \
                        '(-d --directory)'{-d,--directory}'[Directorio destino]:directory:_files -/' \
                        '1:url:'
                    ;;
                commit)
                    _arguments \
                        '1:message:'
                    ;;
            esac
            ;;
    esac
}

_gitx "$@"
