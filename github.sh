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
    git checkout -f -b "$BRANCH" --track origin/"$BRANCH"
else
    echo "Git repo detected; checking for updates..."

    PULL_OUTPUT=$(git pull origin "$BRANCH")
    echo "$PULL_OUTPUT"

    if [[ "$PULL_OUTPUT" == *"Already up to date."* ]]; then
        echo "No new files found; already running latest code."
    else
        echo "New files detected and pulled"
    fi
fi

echo "Wait 10 sec..."
sleep 10

echo "Start program index.js..."
node index.js