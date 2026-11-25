#!/bin/bash

set -e

GITHUB_USER="Fe4528"
REPO_NAME="JikanRewrite"
BRANCH="main"
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

cd "$(dirname "$0")" || exit 1

if [ ! -d ".git" ]; then
    echo "No .git folder found; initializing..."
    git init
fi

if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$REPO_URL"
else
    git remote add origin "$REPO_URL"
fi

echo "Fetching latest changes from GitHub..."
git fetch origin "+refs/heads/${BRANCH}:refs/remotes/origin/${BRANCH}"

echo "Synchronizing local repository with origin/${BRANCH}..."
git checkout -f -B "$BRANCH" "origin/$BRANCH"
git reset --hard "origin/$BRANCH"

echo "Repository successfully synchronized."
echo "Current commit: $(git rev-parse --short HEAD)"

echo "Wait 10 sec..."
sleep 10

echo "Starting program index.js..."
node index.js
