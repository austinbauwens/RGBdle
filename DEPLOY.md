# Deployment Instructions

## Deploy to GitHub Pages

Follow these steps to deploy the RGB Wordle game to GitHub:

### 1. Initialize Git Repository (if not already done)

```bash
cd "/Users/austinbauwens/Documents/Cursor Apps/October 31st"
git init
```

### 2. Add All Files

```bash
git add .
```

### 3. Create Initial Commit

```bash
git commit -m "Initial commit: RGB Wordle game"
```

### 4. Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Name it `rgb-wordle` (or any name you prefer)
4. Set it to Public (for free GitHub Pages)
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### 5. Connect Local Repository to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/rgb-wordle.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### 6. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings"
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Select "main" branch and "/ (root)" folder
6. Click "Save"

Your game will be live at: `https://YOUR_USERNAME.github.io/rgb-wordle/`

### Alternative: Using GitHub CLI

If you have GitHub CLI installed:

```bash
gh repo create rgb-wordle --public --source=. --remote=origin --push
gh repo edit YOUR_USERNAME/rgb-wordle --enable-pages
```

