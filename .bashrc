# ~/.bashrc: executed by bash(1) for non-login shells.
# see /usr/share/doc/bash/examples/startup-files (in the package bash-doc)
# for examples
export EMAIL_HOME_ADDRESS=529349029@qq.com
export EMAIL_POLL_INTERVAL=120
export HERMES_YOLO_MODE=1
export HERMES_TUI=1
export EXA_API_KEY="17a718a2-07d5-4b39-b1d0-b4a9512b2920"
export FIRECRAWL_API_KEY="fc-c6c92e365b214958b5d75f44cba570e4"
export TAVILY_API_KEY="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"
export ETHERSCAN_API_KEY=V7FZXDJ7X4KQMFUUKUWGBQQG4DJI1PY1NA
export EMAIL_ADDRESS=529349029@qq.com
export EMAIL_PASSWORD=hpfoojtyzowibgcf
export EMAIL_IMAP_HOST=imap.qq.com
export EMAIL_SMTP_HOST=smtp.qq.com
export EMAIL_ALLOWED_USERS=529349029@qq.com,13667272511@163.com
export RUSTUP_DIST_SERVER="https://rsproxy.cn"
export RUSTUP_UPDATE_ROOT="https://rsproxy.cn/rustup"
export OBSIDIAN_VAULT_PATH=/home/administrator/ObsidianVault
export UV_PROJECT_ENVIRONMENT="/home/administrator/projects/python_first/.venv"
# If not running interactively, don't do anything
[ -z "$PS1" ] && return
# don't put duplicate lines or lines starting with space in the history.
# See bash(1) for more options
HISTCONTROL=ignoreboth

# append to the history file, don't overwrite it
shopt -s histappend

# for setting history length see HISTSIZE and HISTFILESIZE in bash(1)
HISTSIZE=1000
HISTFILESIZE=2000

# check the window size after each command and, if necessary,
# update the values of LINES and COLUMNS.
shopt -s checkwinsize

# If set, the pattern "**" used in a pathname expansion context will
# match all files and zero or more directories and subdirectories.
#shopt -s globstar

# make less more friendly for non-text input files, see lesspipe(1)
[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

# set variable identifying the chroot you work in (used in the prompt below)
if [ -z "${debian_chroot:-}" ] && [ -r /etc/debian_chroot ]; then
    debian_chroot=$(cat /etc/debian_chroot)
fi

# set a fancy prompt (non-color, unless we know we "want" color)
case "$TERM" in
    xterm-color|*-256color) color_prompt=yes;;
esac

# uncomment for a colored prompt, if the terminal has the capability; turned
# off by default to not distract the user: the focus in a terminal window
# should be on the output of commands, not on the prompt
#force_color_prompt=yes

if [ -n "$force_color_prompt" ]; then
    if [ -x /usr/bin/tput ] && tput setaf 1 >&/dev/null; then
	# We have color support; assume it's compliant with Ecma-48
	# (ISO/IEC-6429). (Lack of such support is extremely rare, and such
	# a case would tend to support setf rather than setaf.)
	color_prompt=yes
    else
	color_prompt=
    fi
fi

if [ "$color_prompt" = yes ]; then
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\u@\h:\w\$ '
fi
unset color_prompt force_color_prompt

# If this is an xterm set the title to user@host:dir
case "$TERM" in
xterm*|rxvt*)
    PS1="\[\e]0;${debian_chroot:+($debian_chroot)}\u@\h: \w\a\]$PS1"
    ;;
*)
    ;;
esac

# enable color support of ls and also add handy aliases
if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=auto'
    #alias dir='dir --color=auto'
    #alias vdir='vdir --color=auto'

    alias grep='grep --color=auto'
    alias fgrep='fgrep --color=auto'
    alias egrep='egrep --color=auto'
fi

# colored GCC warnings and errors
#export GCC_COLORS='error=01;31:warning=01;35:note=01;36:caret=01;32:locus=01:quote=01'

# some more ls aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'

# Add an "alert" alias for long running commands.  Use like so:
#   sleep 10; alert
alias alert='notify-send --urgency=low -i "$([ $? = 0 ] && echo terminal || echo error)" "$(history|tail -n1|sed -e '\''s/^\s*[0-9]\+\s*//;s/[;&|]\s*alert$//'\'')"'

# Alias definitions.
# You may want to put all your additions into a separate file like
# ~/.bash_aliases, instead of adding them here directly.
# See /usr/share/doc/bash-doc/examples in the bash-doc package.

if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi

# enable programmable completion features (you don't need to enable
# this, if it's already enabled in /etc/bash.bashrc and /etc/profile
# sources /etc/bash.bashrc).
if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi

# OpenClaw Completion
source "/home/administrator/.openclaw/completions/openclaw.bash"
. "$HOME/.cargo/env"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion


# Proxy and Foundry settings平时不使用代理了，需要时候再配置,source  ~/.bashrc
#export http_proxy=http://127.0.0.1:7890
#export https_proxy=http://127.0.0.1:7890

#export PATH="$HOME/.hermes/node/bin:$PATH"
alias python=python3


# 强制把 NVM 的路径加到 PATH 的最前面
#export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node | grep -v 'alias' | head -n 1)/bin:$PATH"


# 强制将 NVM 路径置顶，覆盖所有后续修改
# 注释掉自动选择: if [ -d "$HOME/.nvm/versions/node" ]; then
# 注释掉自动选择:   NVM_NODE_PATH=$(ls -d $HOME/.nvm/versions/node/* | grep -v 'alias' | head -n 1)
# 注释掉自动选择:   export PATH="$NVM_NODE_PATH/bin:$PATH"
# 注释掉自动选择: fi
# 注释掉自动选择: 
# pnpm
export PNPM_HOME="/home/administrator/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end

export PATH=$HOME/.foundry/bin:$HOME/.local/bin:$PATH
# Security tools PATH


# Solana and Rust PATH
# Solana and Rust PATH (append, don't overwrite)
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

# 仅手动打开终端时自动进入项目目录，不影响程序与脚本运行
if [[ $- == *i* ]]; then
    cd "$HOME/workspace"
fi



export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
