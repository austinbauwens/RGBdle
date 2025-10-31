#!/bin/bash

# Push to GitHub
echo "🚀 Pushing RGB Wordle to GitHub..."

cd "/Users/austinbauwens/Documents/Cursor Apps/October 31st"

git remote add origin https://github.com/austinbauwens/RGBdle.git 2>/dev/null || git remote set-url origin https://github.com/austinbauwens/RGBdle.git
git branch -M main

echo ""
echo "📤 Pushing to GitHub..."
echo "You may be prompted for your GitHub username and password/token."
echo "For password, use a Personal Access Token (not your GitHub password)."
echo "Generate one at: https://github.com/settings/tokens"
echo ""
git push -u origin main

echo ""
echo "✅ If push was successful, next step:"
echo "1. Go to https://github.com/austinbauwens/RGBdle/settings/pages"
echo "2. Under 'Source', select 'Deploy from a branch'"
echo "3. Select 'main' branch and '/ (root)' folder"
echo "4. Click 'Save'"
echo ""
echo "Your game will be live at: https://austinbauwens.github.io/RGBdle/"

