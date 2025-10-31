#!/bin/bash

# RGB Wordle Deployment Script
# This script helps deploy the game to GitHub Pages

echo "🚀 Deploying RGB Wordle to GitHub..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
fi

# Add all files
echo "Adding files..."
git add .

# Check if there are changes to commit
if ! git diff --staged --quiet; then
    echo "Creating initial commit..."
    git commit -m "Initial commit: RGB Wordle game"
else
    echo "No changes to commit."
fi

# Check if remote is set
if ! git remote | grep -q "origin"; then
    echo ""
    echo "⚠️  No GitHub remote configured yet."
    echo "Please create a repository on GitHub first, then run:"
    echo ""
    echo "  git remote add origin https://github.com/YOUR_USERNAME/rgb-wordle.git"
    echo "  git branch -M main"
    echo "  git push -u origin main"
    echo ""
    echo "Then enable GitHub Pages in repository settings."
else
    echo ""
    echo "✅ Git repository is ready!"
    echo "Run 'git push' to push to GitHub."
fi

