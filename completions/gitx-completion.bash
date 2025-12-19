#!/bin/bash

# GitX bash completion script
_gitx_completion() {
    local cur prev opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    # Main commands
    local commands="auto doctor migrate unlink profile switch list clone remote commit publish hook commands"
    
    # Profile subcommands
    local profile_cmds="add list ls remove rm current"
    
    # Remote subcommands
    local remote_cmds="add fix"

    case "${COMP_CWORD}" in
        1)
            COMPREPLY=( $(compgen -W "${commands}" -- ${cur}) )
            return 0
            ;;
        2)
            case "${prev}" in
                profile)
                    COMPREPLY=( $(compgen -W "${profile_cmds}" -- ${cur}) )
                    return 0
                    ;;
                remote)
                    COMPREPLY=( $(compgen -W "${remote_cmds}" -- ${cur}) )
                    return 0
                    ;;
                switch|remove|rm)
                    # Get profile names from gitx config
                    if [ -f ~/.gitx/config.json ]; then
                        local profiles=$(cat ~/.gitx/config.json | grep -o '"[^"]*":' | grep -v profiles | grep -v folderProfiles | grep -v defaultProfile | tr -d '":' | tr '\n' ' ')
                        COMPREPLY=( $(compgen -W "${profiles}" -- ${cur}) )
                    fi
                    return 0
                    ;;
                auto)
                    COMPREPLY=( $(compgen -W "--enable --disable --path" -- ${cur}) )
                    return 0
                    ;;
                doctor)
                    COMPREPLY=( $(compgen -W "--fix" -- ${cur}) )
                    return 0
                    ;;
                unlink)
                    COMPREPLY=( $(compgen -W "--force --global --path" -- ${cur}) )
                    return 0
                    ;;
                publish)
                    COMPREPLY=( $(compgen -W "--message -m" -- ${cur}) )
                    return 0
                    ;;
                clone)
                    COMPREPLY=( $(compgen -W "--directory -d" -- ${cur}) )
                    return 0
                    ;;
            esac
            ;;
    esac

    return 0
}

complete -F _gitx_completion gitx
