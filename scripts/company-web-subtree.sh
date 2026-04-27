#!/usr/bin/env bash
# Creates a local branch where former web/ is the repo root, so you can
#   git push <company-remote> <branch>:<main|master>
# without a nested .git/ inside web/ while the monorepo keeps a single root .git/.

set -euo pipefail

if ! root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  echo "error: not a git repository. Run this from the monorepo (parent of web/ or from web/)." >&2
  exit 1
fi

cd "$root"

if [[ -d "web/.git" ]]; then
  echo "error: web/.git exists. Remove the nested repository or use git submodule; do not stack repos here." >&2
  exit 1
fi

if [[ ! -d web ]]; then
  echo "error: web/ directory not found at repository root: $root" >&2
  exit 1
fi
if ! git rev-parse --verify HEAD:web/ >/dev/null 2>&1; then
  echo "error: path web/ is not in the current commit (subtree needs history under web/)." >&2
  exit 1
fi

BRANCH_NAME="${1:-company-web-standalone}"
if [[ "$BRANCH_NAME" =~ [^a-zA-Z0-9/_.-] ]]; then
  echo "error: branch name should use safe characters only." >&2
  exit 1
fi

if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
  git branch -D "${BRANCH_NAME}"
fi

echo "Splitting prefix web/ into branch: ${BRANCH_NAME}"
git subtree split --prefix=web -b "${BRANCH_NAME}"

cat <<EOF

Done. Local branch ${BRANCH_NAME} has the former web/ as the repository root
(package.json at branch root, no monorepo parent folder).

Next (replace REMOTE and target branch as needed):
  git push REMOTE ${BRANCH_NAME}:main

To use a new remote (example):
  git remote add company <company-repo-url>
  git push company ${BRANCH_NAME}:main
EOF
