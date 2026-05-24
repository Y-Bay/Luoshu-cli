#!/usr/bin/env bash
#
# Luoshu CLI — one-shot installer
#
#   Remote:
#     bash -c "$(curl -fsSL https://raw.githubusercontent.com/Y-Bay/Luoshu-cli/main/install.sh)"
#
#   Local (from inside a checked-out repo):
#     bash install.sh
#
#   Environment knobs:
#     LUOSHU_INSTALL_DIR   target dir for clone (default: ~/Luoshu-cli)
#     LUOSHU_VERBOSE=1     stream npm output instead of suppressing it
#     LUOSHU_NO_COLOR=1    disable ANSI colors
#

set -euo pipefail

REPO_URL="https://github.com/Y-Bay/Luoshu-cli.git"
DEFAULT_INSTALL_DIR="${LUOSHU_INSTALL_DIR:-$HOME/Luoshu-cli}"
MIN_NODE_MAJOR=22
VERBOSE="${LUOSHU_VERBOSE:-0}"

TOTAL_STEPS=4
LOG_FILE="$(mktemp -t luoshu-install.XXXXXX)"
START_TS=$(date +%s)

# ---------- color / output ----------
if [ -t 1 ] && [ -z "${LUOSHU_NO_COLOR:-}" ] && [ "${TERM:-}" != "dumb" ]; then
  C_RESET=$'\033[0m'
  C_DIM=$'\033[2m'
  C_BOLD=$'\033[1m'
  C_RED=$'\033[31m'
  C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'
  C_BLUE=$'\033[34m'
  C_MAGENTA=$'\033[35m'
  C_CYAN=$'\033[36m'
else
  C_RESET=''; C_DIM=''; C_BOLD=''; C_RED=''; C_GREEN=''
  C_YELLOW=''; C_BLUE=''; C_MAGENTA=''; C_CYAN=''
fi

# Lower-level emitters
emit()  { printf '%s\n' "$*"; }
plain() { printf '  %s\n' "$*"; }
ok()    { printf '  %s✓%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn()  { printf '  %s!%s %s\n' "$C_YELLOW" "$C_RESET" "$*"; }
fail()  { printf '  %s✗%s %s\n' "$C_RED" "$C_RESET" "$*" >&2; }
hint()  { printf '    %s%s%s\n' "$C_DIM" "$*" "$C_RESET"; }
note()  { printf '  %s%s%s\n' "$C_DIM" "$*" "$C_RESET"; }

step_header() {
  # $1 = step number, $2 = title, $3 = optional subtitle
  local n=$1 title=$2 sub=${3:-}
  echo
  printf '%s[%s/%s]%s %s%s%s' "$C_CYAN" "$n" "$TOTAL_STEPS" "$C_RESET" "$C_BOLD" "$title" "$C_RESET"
  [ -n "$sub" ] && printf ' %s%s%s' "$C_DIM" "$sub" "$C_RESET"
  echo
}

section() {
  echo
  printf '%s%s%s\n' "$C_MAGENTA" "$1" "$C_RESET"
}

banner() {
  cat <<EOF

${C_BOLD}${C_BLUE}      _____            _              ${C_CYAN}┌─────────────────────┐${C_RESET}
${C_BOLD}${C_BLUE}     |  |  |_ _ ___ ___| |_ _ _        ${C_CYAN}│  洛书 · Luoshu CLI  │${C_RESET}
${C_BOLD}${C_BLUE}     |  |  | | | . |_ -|   | | |       ${C_CYAN}│  v0.1.0  ·  installer ${C_RESET}${C_CYAN}│${C_RESET}
${C_BOLD}${C_BLUE}     |_____|___|___|___|_|_|___|       ${C_CYAN}└─────────────────────┘${C_RESET}

${C_DIM}  Source: https://github.com/Y-Bay/Luoshu-cli${C_RESET}
EOF
}

# Run a long-running command. Streams output if VERBOSE=1, else captures.
# On failure, prints the last 30 lines of captured output.
run_cmd() {
  local label=$1; shift
  if [ "$VERBOSE" = "1" ]; then
    if "$@"; then return 0; else return $?; fi
  fi
  if "$@" >"$LOG_FILE" 2>&1; then
    return 0
  else
    local rc=$?
    echo
    fail "$label failed (exit $rc). Tail of output:"
    echo "${C_DIM}---------- $LOG_FILE ----------${C_RESET}"
    tail -30 "$LOG_FILE" | sed "s/^/  ${C_DIM}│${C_RESET} /"
    echo "${C_DIM}-------------------------------${C_RESET}"
    return $rc
  fi
}

# Run command with a spinner. Same fail-and-tail semantics as run_cmd.
SPIN_CHARS='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
run_with_spinner() {
  local label=$1; shift
  if [ ! -t 1 ] || [ "$VERBOSE" = "1" ]; then
    run_cmd "$label" "$@"
    return $?
  fi

  # Run command in background, spin in foreground.
  "$@" >"$LOG_FILE" 2>&1 &
  local pid=$!
  local start ts elapsed i=0
  start=$(date +%s)
  printf '  ' # spinner indent

  while kill -0 "$pid" 2>/dev/null; do
    ts=$(date +%s); elapsed=$((ts - start))
    local ch=${SPIN_CHARS:$((i % ${#SPIN_CHARS})):1}
    printf '\r  %s%s%s %s %s(%ds)%s   ' \
      "$C_CYAN" "$ch" "$C_RESET" "$label" "$C_DIM" "$elapsed" "$C_RESET"
    i=$((i + 1))
    sleep 0.1
  done

  wait "$pid"
  local rc=$?
  ts=$(date +%s); elapsed=$((ts - start))
  if [ "$rc" = "0" ]; then
    printf '\r  %s✓%s %s %s(%ds)%s\033[K\n' \
      "$C_GREEN" "$C_RESET" "$label" "$C_DIM" "$elapsed" "$C_RESET"
  else
    printf '\r  %s✗%s %s %s(%ds, exit %d)%s\033[K\n' \
      "$C_RED" "$C_RESET" "$label" "$C_DIM" "$elapsed" "$rc" "$C_RESET"
    echo "${C_DIM}---------- $LOG_FILE ----------${C_RESET}"
    tail -30 "$LOG_FILE" | sed "s/^/  ${C_DIM}│${C_RESET} /"
    echo "${C_DIM}-------------------------------${C_RESET}"
  fi
  return $rc
}

# ---------- pre-flight ----------
preflight() {
  section "[ Pre-flight ]"

  if ! command -v git >/dev/null 2>&1; then
    fail "git not found."
    hint "macOS:  xcode-select --install"
    hint "Linux:  apt install -y git  /  yum install -y git"
    exit 1
  fi
  ok "git $(git --version | awk '{print $3}')"

  if ! command -v node >/dev/null 2>&1; then
    fail "Node.js not found."
    hint "Install via nvm:"
    hint "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash"
    hint "  source ~/.nvm/nvm.sh && nvm install $MIN_NODE_MAJOR"
    exit 1
  fi
  local node_major
  node_major=$(node -v | sed 's/^v//' | cut -d. -f1)
  if [ "$node_major" -lt "$MIN_NODE_MAJOR" ]; then
    fail "Node.js >= $MIN_NODE_MAJOR required (got $(node -v))"
    hint "Upgrade: nvm install $MIN_NODE_MAJOR && nvm use $MIN_NODE_MAJOR"
    exit 1
  fi
  ok "Node.js $(node -v)"

  if ! command -v npm >/dev/null 2>&1; then
    fail "npm not found (should ship with Node.js)"
    exit 1
  fi
  ok "npm $(npm -v)"
}

# ---------- step 1: clone / pull ----------
step_clone() {
  if [ -f package.json ] && grep -q '"luoshu-cli"' package.json 2>/dev/null; then
    step_header 1 "Using current Luoshu repo" "$(pwd)"
    ok "Repo: $(pwd)"
    return
  fi

  if [ -d "$DEFAULT_INSTALL_DIR/.git" ]; then
    step_header 1 "Updating existing checkout" "${DEFAULT_INSTALL_DIR}"
    cd "$DEFAULT_INSTALL_DIR"
    if ! run_with_spinner "git pull --ff-only origin main" \
        git pull --ff-only origin main; then
      fail "git pull failed. Aborting to avoid corrupting local state."
      exit 1
    fi
    ok "Updated to $(git rev-parse --short HEAD)"
  else
    step_header 1 "Cloning Luoshu-cli" "(partial clone, ~5MB initial)"
    note "→ target: $DEFAULT_INSTALL_DIR"
    if ! run_with_spinner "git clone" \
        git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 \
        clone --filter=blob:none "$REPO_URL" "$DEFAULT_INSTALL_DIR"; then
      echo
      fail "git clone failed."
      hint "Remove any partial directory and retry:"
      hint "  rm -rf '$DEFAULT_INSTALL_DIR'"
      hint "If you're behind a flaky network/proxy, configure git:"
      hint "  git config --global http.proxy http://127.0.0.1:7897"
      hint "  git config --global https.proxy http://127.0.0.1:7897"
      exit 1
    fi
    cd "$DEFAULT_INSTALL_DIR"
    ok "Cloned at $(git rev-parse --short HEAD)"
  fi
}

# ---------- step 2: npm install ----------
step_npm_install() {
  step_header 2 "Installing dependencies" "(~2-3 min, ~1452 packages)"
  if ! run_with_spinner "npm install" \
      npm install --no-audit --no-fund --progress=false; then
    echo
    fail "npm install failed."
    hint "Common fixes:"
    hint "  1. Slow registry → switch to a mirror:"
    hint "     npm config set registry https://registry.npmmirror.com"
    hint "  2. Stale cache → clean and retry:"
    hint "     npm cache clean --force"
    hint "  3. Permission errors on $HOME/.npm → fix ownership:"
    hint "     sudo chown -R \$(id -u):\$(id -g) ~/.npm"
    exit 1
  fi
  ok "Installed $(ls node_modules 2>/dev/null | wc -l | tr -d ' ') top-level packages"
}

# ---------- step 3: bundle ----------
step_bundle() {
  step_header 3 "Bundling" "(esbuild + asset copy)"
  if ! run_with_spinner "npm run bundle" npm run bundle; then
    echo
    fail "Bundle failed. See log above. Common causes:"
    hint "  · Out-of-memory: NODE_OPTIONS=\"--max-old-space-size=4096\" npm run bundle"
    hint "  · Disk space: df -h \$(pwd)"
    exit 1
  fi
  if [ -f dist/cli.js ]; then
    local sz
    sz=$(du -h dist/cli.js | awk '{print $1}')
    ok "Bundle ready: dist/cli.js ($sz)"
  else
    ok "Bundle ready"
  fi
}

# ---------- step 4 helpers ----------

# Ephemeral paths: anything the OS or the user is likely to wipe. Linking
# from these leaves the global `luoshu` as a dangling symlink later.
is_ephemeral_path() {
  case "$1" in
    /tmp/*|/private/tmp/*|/var/tmp/*|/var/folders/*) return 0 ;;
    *) return 1 ;;
  esac
}

# `npm link` does NOT clean up a pre-existing global symlink whose target
# no longer exists. The resulting dangling link silently shadows future
# installs — `which luoshu` returns "not found" with no hint why. Detect
# and remove it before linking.
cleanup_stale_global_link() {
  local global_root link_path bin_path stale_target
  global_root=$(npm root -g 2>/dev/null) || return 0
  link_path="$global_root/luoshu-cli"
  bin_path="$(npm prefix -g 2>/dev/null)/bin/luoshu"

  # `-L` checks it's a symlink; `! -e` is true when the link target is gone.
  if [ -L "$link_path" ] && [ ! -e "$link_path" ]; then
    stale_target=$(readlink "$link_path" 2>/dev/null || echo "<unreadable>")
    warn "Stale global symlink detected:"
    hint "  luoshu-cli → $stale_target  (target missing)"
    hint "  Cleaning up so the new link can take over..."
    rm -f "$link_path" "$bin_path"
    ok "Removed stale global registration."
  fi
}

# ---------- step 4: npm link ----------
step_link() {
  step_header 4 "Registering 'luoshu' command" "(global symlink via npm link)"

  cleanup_stale_global_link

  if is_ephemeral_path "$(pwd)"; then
    warn "Installing from an ephemeral path: $(pwd)"
    hint "If this directory is later deleted, 'luoshu' will become a"
    hint "dangling symlink and silently fail. Re-run with a stable path:"
    hint "  LUOSHU_INSTALL_DIR=\$HOME/Luoshu-cli bash install.sh"
  fi

  # --ignore-scripts skips the package's `prepare` hook, which would
  # otherwise re-run build+bundle (already done in step 3) and can fail
  # with TS5055 on relinks when dist/ already contains generated .d.ts files.
  if ! run_with_spinner "npm link" npm link --ignore-scripts; then
    echo
    fail "npm link failed."
    hint "Try with sudo if global path is root-owned:"
    hint "  sudo npm link --ignore-scripts"
    exit 1
  fi

  if ! command -v luoshu >/dev/null 2>&1; then
    fail "'luoshu' not on PATH after link. Try restarting your shell."
    hint "Or check: npm bin -g"
    exit 1
  fi
  ok "$(which luoshu)"
  ok "luoshu --version → $(luoshu --version)"
}

# ---------- finale ----------
show_done() {
  local end_ts elapsed
  end_ts=$(date +%s); elapsed=$((end_ts - START_TS))
  local mins=$((elapsed / 60))
  local secs=$((elapsed % 60))

  echo
  echo "${C_GREEN}${C_BOLD}╭────────────────────────────────────────────────────────────╮${C_RESET}"
  echo "${C_GREEN}${C_BOLD}│  ✓  Luoshu CLI installed in ${mins}m${secs}s.                          │${C_RESET}"
  echo "${C_GREEN}${C_BOLD}╰────────────────────────────────────────────────────────────╯${C_RESET}"
  echo
  printf '  %sQuick start (DeepSeek example):%s\n' "$C_BOLD" "$C_RESET"
  echo
  echo "    ${C_CYAN}export${C_RESET} OPENAI_API_KEY='sk-your-deepseek-key'"
  echo "    ${C_CYAN}export${C_RESET} OPENAI_BASE_URL='https://api.deepseek.com'"
  echo "    ${C_CYAN}export${C_RESET} OPENAI_MODEL='deepseek-chat'"
  echo
  echo "    ${C_GREEN}luoshu${C_RESET}                    ${C_DIM}# interactive TUI${C_RESET}"
  echo "    ${C_GREEN}luoshu${C_RESET} -p ${C_YELLOW}'hello'${C_RESET}         ${C_DIM}# one-shot prompt${C_RESET}"
  echo
  printf '  %sIf colors look banded over SSH:%s  %sFORCE_COLOR=3 luoshu%s\n' \
    "$C_BOLD" "$C_RESET" "$C_GREEN" "$C_RESET"
  echo
  printf '  %sDocs:%s  https://github.com/Y-Bay/Luoshu-cli\n' "$C_DIM" "$C_RESET"
  echo
}

# ---------- cleanup on exit ----------
cleanup() { rm -f "$LOG_FILE" 2>/dev/null || true; }
trap cleanup EXIT

# ---------- main ----------
main() {
  banner
  preflight
  step_clone
  step_npm_install
  step_bundle
  step_link
  show_done
}

main "$@"
