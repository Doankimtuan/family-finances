#!/usr/bin/env bash
#
# setup-agent-skills.sh — initialize/verify the canonical Agent Skills system.
#
# Canonical source of truth: .agents/skills/ and .agents/instructions/PROJECT.md
# Codex, Cursor, ZCode, and Zed discover .agents/skills/ natively, so this
# script mostly VERIFIES native discovery and only creates symlinks for tools
# with their own skill directory (CommandCode per-skill links, established
# repo pattern).
#
# Usage:
#   ./scripts/setup-agent-skills.sh              # setup all tools + verify
#   ./scripts/setup-agent-skills.sh codex        # one tool: codex|cursor|zcode|zed|commandcode
#   ./scripts/setup-agent-skills.sh verify       # validation only
#
# Idempotent: safe to run any number of times. Never overwrites real files;
# only creates or refreshes project-owned symlinks (links pointing into
# .agents/skills/). Works on macOS (bash 3.2) and Linux.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AGENTS_SKILLS="$REPO_ROOT/.agents/skills"
COMMANDCODE_SKILLS="$REPO_ROOT/.commandcode/skills"

# First-party canonical skills (must match .agents/README.md; never listed in
# skills-lock.json).
FIRST_PARTY_SKILLS=(
  code-quality
  typescript-quality
  react-quality
  nextjs-architecture
  form-architecture
  error-handling
  testing-quality
  refactor-review
)

FAILURES=0

log() { printf '  [ok]   %s\n' "$*"; }
info() { printf '  [--]   %s\n' "$*"; }
warn() { printf '  [WARN] %s\n' "$*"; FAILURES=$((FAILURES + 1)); }

require_canonical_root() {
  if [ ! -d "$AGENTS_SKILLS" ]; then
    echo "FATAL: canonical skills root $AGENTS_SKILLS does not exist." >&2
    exit 1
  fi
}

# ensure_link <link_path> <relative_target>
# Creates or refreshes only links whose target is inside .agents/skills/.
ensure_link() {
  link_path="$1"
  rel_target="$2"

  if [ -L "$link_path" ]; then
    current="$(readlink "$link_path")"
    case "$current" in
      *.agents/skills/*)
        if [ "$current" = "$rel_target" ]; then
          log "link already correct: ${link_path#$REPO_ROOT/} -> $rel_target"
        else
          rm "$link_path"
          ln -s "$rel_target" "$link_path"
          log "refreshed project link: ${link_path#$REPO_ROOT/} -> $rel_target"
        fi
        return 0
        ;;
      *)
        warn "foreign symlink exists, left untouched: ${link_path#$REPO_ROOT/} -> $current"
        return 0
        ;;
    esac
  fi

  if [ -e "$link_path" ]; then
    warn "real file/dir exists, not overwritten: ${link_path#$REPO_ROOT/}"
    return 0
  fi

  mkdir -p "$(dirname "$link_path")"
  ln -s "$rel_target" "$link_path"
  log "created link: ${link_path#$REPO_ROOT/} -> $rel_target"
}

setup_codex() {
  echo "== Codex =="
  require_canonical_root
  if grep -q '.agents/instructions/PROJECT.md' "$REPO_ROOT/AGENTS.md" 2>/dev/null; then
    log "root AGENTS.md points to canonical instructions"
  else
    warn "root AGENTS.md does not reference .agents/instructions/PROJECT.md"
  fi
  info "codex-cli discovers .agents/skills natively (repo root); no extra wiring"
}

setup_cursor() {
  echo "== Cursor =="
  require_canonical_root
  rule="$REPO_ROOT/.cursor/rules/agent-skills.mdc"
  if [ -f "$rule" ]; then
    log "adapter rule present: .cursor/rules/agent-skills.mdc"
  else
    mkdir -p "$REPO_ROOT/.cursor/rules"
    cat > "$rule" <<'RULE_EOF'
---
description: Canonical AI instructions and Agent Skills live in .agents/ — load relevant skills before implementing
alwaysApply: true
---

# Agent Skills System (canonical)

Canonical project AI instructions live in:

- `.agents/instructions/PROJECT.md`

Reusable skills live in:

- `.agents/skills/`

Cursor loads `.agents/skills/` natively as Agent Skills. Before implementing
code, read `PROJECT.md` and apply the relevant skills — at minimum
`code-quality` and `typescript-quality`, plus framework skills as listed in
`PROJECT.md`, and `refactor-review` before finishing a refactor.

Do not copy skill bodies into `.cursor/`; this rule is only a pointer.
RULE_EOF
    log "created adapter rule: .cursor/rules/agent-skills.mdc"
  fi
  info "Cursor discovers .agents/skills natively; existing rules untouched"
}

setup_zcode() {
  echo "== ZCode =="
  require_canonical_root
  info "ZCode discovers project .agents/skills natively; no extra wiring"
  info "project skills are deliberately NOT linked into user-level dirs"
}

setup_zed() {
  echo "== Zed =="
  require_canonical_root
  if command -v zed >/dev/null 2>&1 || [ -d "/Applications/Zed.app" ]; then
    info "Zed detected; it reads <worktree>/.agents/skills in trusted worktrees"
  else
    info "Zed not installed; convention prepared (.agents/skills is native path)"
  fi
}

setup_commandcode() {
  echo "== CommandCode =="
  require_canonical_root
  mkdir -p "$COMMANDCODE_SKILLS"
  for skill in "${FIRST_PARTY_SKILLS[@]}"; do
    if [ -d "$AGENTS_SKILLS/$skill" ]; then
      ensure_link "$COMMANDCODE_SKILLS/$skill" "../../.agents/skills/$skill"
    else
      warn "canonical skill missing: .agents/skills/$skill"
    fi
  done
  info "pre-existing curated links for other skills are preserved"
}

verify_skills() {
  echo "== Verify: canonical skills =="
  for skill_dir in "$AGENTS_SKILLS"/*/; do
    [ -d "$skill_dir" ] || continue
    skill="$(basename "$skill_dir")"
    skill_file="$skill_dir/SKILL.md"
    if [ ! -f "$skill_file" ]; then
      warn "$skill/SKILL.md missing"
      continue
    fi
    first_line="$(head -n 1 "$skill_file")"
    if [ "$first_line" != "---" ]; then
      warn "$skill/SKILL.md does not start with frontmatter ---"
      continue
    fi
    fm_name="$(sed -n '2,/^---$/p' "$skill_file" | sed -n 's/^name:[[:space:]]*//p' | head -n 1 | tr -d '\"')"
    if [ "$fm_name" != "$skill" ]; then
      warn "$skill/SKILL.md frontmatter name '$fm_name' != folder name"
      continue
    fi
    if ! sed -n '2,/^---$/p' "$skill_file" | grep -q '^description:'; then
      warn "$skill/SKILL.md frontmatter has no description"
      continue
    fi
    log "$skill: frontmatter valid"
  done
}

verify_links() {
  echo "== Verify: symlinks =="
  found_any=0
  for link in "$COMMANDCODE_SKILLS"/*; do
    [ -L "$link" ] || continue
    found_any=1
    if [ -e "$link" ]; then
      log "$(basename "$link") -> $(readlink "$link") resolves"
    else
      warn "broken link: ${link#$REPO_ROOT/} -> $(readlink "$link")"
    fi
  done
  [ "$found_any" = 1 ] || info "no tool symlinks present"
}

verify_pointers() {
  echo "== Verify: instruction pointers =="
  if [ -f "$REPO_ROOT/.agents/instructions/PROJECT.md" ]; then
    log ".agents/instructions/PROJECT.md present"
  else
    warn ".agents/instructions/PROJECT.md missing"
  fi
  if grep -q '.agents/skills' "$REPO_ROOT/AGENTS.md" 2>/dev/null; then
    log "root AGENTS.md references the skills system"
  else
    warn "root AGENTS.md does not reference .agents/skills"
  fi
  if [ -f "$REPO_ROOT/.cursor/rules/agent-skills.mdc" ]; then
    log ".cursor/rules/agent-skills.mdc present"
  else
    warn ".cursor/rules/agent-skills.mdc missing (run: $0 cursor)"
  fi
  if [ -f "$REPO_ROOT/skills-lock.json" ]; then
    for skill in "${FIRST_PARTY_SKILLS[@]}"; do
      if grep -q "\"$skill\"" "$REPO_ROOT/skills-lock.json"; then
        warn "$skill must not be listed in skills-lock.json (first-party skill)"
      fi
    done
    log "first-party skills not locked as external"
  fi
}

run_verify() {
  require_canonical_root
  verify_skills
  verify_links
  verify_pointers
}

usage() {
  sed -n '3,16p' "$0" | sed 's/^# \{0,1\}//'
}

case "${1:-all}" in
  codex) setup_codex ;;
  cursor) setup_cursor ;;
  zcode) setup_zcode ;;
  zed) setup_zed ;;
  commandcode) setup_commandcode ;;
  verify) run_verify ;;
  all)
    setup_codex
    setup_cursor
    setup_zcode
    setup_zed
    setup_commandcode
    run_verify
    ;;
  -h|--help|help) usage ;;
  *)
    echo "Unknown target: $1" >&2
    usage >&2
    exit 2
    ;;
esac

echo
if [ "$FAILURES" -gt 0 ]; then
  echo "RESULT: $FAILURES warning(s)/failure(s) — review above."
  exit 1
fi
echo "RESULT: OK"
