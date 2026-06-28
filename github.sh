#!/bin/bash

GITHUB_USER="Fe4528"
REPO_NAME="JikanRewrite"
BRANCH="main"

cd "$(dirname "$0")" || exit

if [ ! -d ".git" ]; then
    echo "No .git folder found; initializing..."
    git init
    git remote add origin https://github.com/${GITHUB_USER}/${REPO_NAME}.git
    git fetch origin "$BRANCH"
    git checkout -b "$BRANCH" --track origin/"$BRANCH"
else
    echo "Git repo detected - pulling latest changes..."
    git pull origin "$BRANCH"
fi

echo "Starting index.js..."
node index.js