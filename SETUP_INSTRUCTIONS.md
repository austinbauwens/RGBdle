# Quick Setup Instructions

## ⚠️ Important: Install Xcode Command Line Tools First

When you run `xcode-select --install`, a dialog will appear. **You must click "Install"** in that dialog to complete the installation. This cannot be automated.

## After Xcode Tools Are Installed:

### 1. Run the deploy script:
```bash
./deploy.sh
```

### 2. Create GitHub Repository:
1. Go to [github.com/new](https://github.com/new)
2. Repository name: `rgb-wordle`
3. Visibility: **Public**
4. **DO NOT** check "Add a README file" (we already have one)
5. Click "Create repository"

### 3. Connect and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/rgb-wordle.git
git branch -M main
git push -u origin main
```
(Replace `YOUR_USERNAME` with your GitHub username)

### 4. Enable GitHub Pages:
1. In your repo: **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main**, Folder: **/ (root)**
4. Click **Save**

## Your game will be live at:
`https://YOUR_USERNAME.github.io/rgb-wordle/`

---

## Alternative: Manual File Upload

If you prefer not to use git, you can:
1. Create a new repository on GitHub
2. Use the "Upload files" button
3. Drag and drop all files from this folder
4. Enable GitHub Pages as described above

