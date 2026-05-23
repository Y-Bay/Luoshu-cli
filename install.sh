#!/usr/bin/env bash
#
# Luoshu CLI — one-shot installer
#
# Two ways to use:
#
#   A) Already cloned the repo:
#      cd Luoshu-cli && bash install.sh
#
#   B) Remote one-liner (clones to ~/Luoshu-cli):
#      bash -c "$(curl -fsSL https://raw.githubusercontent.com/Y-Bay/Luoshu-cli/main/install.sh)"
#
#      Override install path:
#      LUOSHU_INSTALL_DIR=/opt/luoshu bash -c "$(curl -fsSL ...)"
#

set -euo pipefail

REPO_URL="https://github.com/Y-Bay/Luoshu-cli.git"
DEFAULT_INSTALL_DIR="${LUOSHU_INSTALL_DIR:-$HOME/Luoshu-cli}"
MIN_NODE_MAJOR=22

# ---------- pretty output ----------
color() { printf '\033[%sm%s\033[0m' "$1" "$2"; }
ok()    { echo "$(color '32' '✓') $1"; }
err()   { echo "$(color '31' '✗') $1" >&2; }
step()  { echo "$(color '36' '→') $1"; }
hint()  { echo "  $(color '90' "$1")"; }

# ---------- checks ----------
check_prereqs() {
  step "Checking prerequisites…"

  if ! command -v git >/dev/null 2>&1; then
    err "git not found."
    hint "macOS: xcode-select --install"
    hint "Linux: apt install -y git  / yum install -y git"
    exit 1
  fi
  ok "git $(git --version | awk '{print $3}')"

  if ! command -v node >/dev/null 2>&1; then
    err "Node.js not found."
    hint "Install via nvm:"
    hint "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash"
    hint "  source ~/.nvm/nvm.sh && nvm install $MIN_NODE_MAJOR"
    exit 1
  fi

  local node_major
  node_major=$(node -v | sed 's/^v//' | cut -d. -f1)
  if [ "$node_major" -lt "$MIN_NODE_MAJOR" ]; then
    err "Node.js >= $MIN_NODE_MAJOR required (got $(node -v))"
    hint "Upgrade: nvm install $MIN_NODE_MAJOR && nvm use $MIN_NODE_MAJOR"
    exit 1
  fi
  ok "Node.js $(node -v)"

  if ! command -v npm >/dev/null 2>&1; then
    err "npm not found (should ship with Node.js)"
    exit 1
  fi
  ok "npm $(npm -v)"
}

# ---------- repo acquisition ----------
clone_or_use_existing() {
  # Detect: already inside the Luoshu repo?
  if [ -f package.json ] && grep -q '"luoshu-cli"' package.json 2>/dev/null; then
    step "Using current directory: $(pwd)"
    return
  fi

  if [ -d "$DEFAULT_INSTALL_DIR/.git" ]; then
    step "Updating existing checkout at ${DEFAULT_INSTALL_DIR}…"
    cd "$DEFAULT_INSTALL_DIR"
    git pull --ff-only origin main || {
      err "git pull failed. Aborting to avoid corrupting local state."
      exit 1
    }
  else
    step "Cloning to ${DEFAULT_INSTALL_DIR}…"
    # Use HTTP/1.1 + larger postBuffer + partial clone (blob:none).
    # GitHub on flaky networks (esp. through proxies) often returns
    # HTTP/2 stream CANCEL on big single-stream pulls; HTTP/1.1 is more
    # tolerant, and --filter=blob:none defers blob download until
    # checkout so the initial fetch is small (~5MB vs ~30MB+).
    if ! git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 \
        clone --filter=blob:none "$REPO_URL" "$DEFAULT_INSTALL_DIR"; then
      err "git clone failed. If a partial '$DEFAULT_INSTALL_DIR' was created, remove it:"
      hint "  rm -rf '$DEFAULT_INSTALL_DIR'"
      hint "Then retry. If still failing, set a proxy (e.g. clash):"
      hint "  git config --global http.proxy http://127.0.0.1:7897"
      hint "  git config --global https.proxy http://127.0.0.1:7897"
      exit 1
    fi
    cd "$DEFAULT_INSTALL_DIR"
  fi
  ok "Repo ready at $(pwd)"
}

# ---------- install + build ----------
do_install() {
  step "Installing dependencies (≈ 2-3 minutes, ~1452 packages)…"
  npm install --no-audit --no-fund 2>&1 | tail -20

  step "Bundling (esbuild + asset copy)…"
  npm run bundle 2>&1 | tail -3

  step "Linking 'luoshu' command globally…"
  npm link

  ok "Installed. 'luoshu' should now be on PATH."
}

# ---------- sanity ----------
verify() {
  step "Verifying…"
  if ! command -v luoshu >/dev/null 2>&1; then
    err "'luoshu' not on PATH. Restart shell or check 'npm bin -g'."
    exit 1
  fi
  ok "$(which luoshu)"
  ok "luoshu --version → $(luoshu --version)"
}

# ---------- next steps ----------
show_next() {
  echo
  echo "==========================================="
  ok "Luoshu CLI installed."
  echo "==========================================="
  echo
  echo "Quick start (DeepSeek example):"
  echo
  echo "  export OPENAI_API_KEY='sk-your-deepseek-key'"
  echo "  export OPENAI_BASE_URL='https://api.deepseek.com'"
  echo "  export OPENAI_MODEL='deepseek-chat'"
  echo
  echo "  luoshu                    # interactive TUI"
  echo "  luoshu -p 'hello'         # one-shot prompt"
  echo
  echo "Over SSH or 256-color terminal, force 24-bit color:"
  echo "  FORCE_COLOR=3 luoshu"
  echo
  echo "Source:  https://github.com/Y-Bay/Luoshu-cli"
  echo
}

# ---------- main ----------
main() {
  echo "==========================================="
  echo "  Luoshu CLI — one-shot installer"
  echo "==========================================="
  echo

  check_prereqs
  clone_or_use_existing
  do_install
  verify
  show_next
}

main "$@"
