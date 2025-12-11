# GitHub Setup Guide

This guide will walk you through setting up Git, creating a GitHub repository, and uploading your Texas Art Grants project.

## Prerequisites

- A GitHub account ([sign up here](https://github.com/signup) if you don't have one)
- Windows 10/11 (this guide is Windows-specific)

## Step 1: Install Git

### Option A: Download Git for Windows (Recommended)

1. Visit [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Download the latest version (64-bit)
3. Run the installer with these recommended settings:
   - **Editor**: Choose your preferred editor (VS Code, Notepad++, etc.)
   - **Default branch name**: `main`
   - **PATH environment**: "Git from the command line and also from 3rd-party software"
   - **Line ending conversions**: "Checkout Windows-style, commit Unix-style line endings"
   - **Terminal emulator**: "Use Windows' default console window"
   - **Default behavior**: "Git Credential Manager" (for easier GitHub authentication)

4. Complete the installation

### Option B: Install via Winget (Windows Package Manager)

If you have Winget installed:

```powershell
winget install --id Git.Git -e --source winget
```

### Verify Installation

Open PowerShell or Command Prompt and verify Git is installed:

```bash
git --version
```

You should see something like `git version 2.43.0` or similar.

## Step 2: Configure Git

Set up your Git identity (replace with your name and email):

```bash
git config --global user.name "yorge-dev"
git config --global user.email "admin@yorge.net"
```

Verify your configuration:

```bash
git config --list
```

## Step 3: Create GitHub Repository

1. Go to [https://github.com](https://github.com) and sign in
2. Click the **+** icon in the top right corner
3. Select **New repository**
4. Fill in the repository details:
   - **Repository name**: `txartgrants` (or your preferred name)
   - **Description**: "Texas Art Grants - A grants aggregation platform for artists and designers"
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** check "Add a README file" (we already have one)
   - **DO NOT** add .gitignore or license (we already have these)
5. Click **Create repository**

## Step 4: Initialize Local Git Repository

Open PowerShell or Command Prompt in your project directory:

```bash
cd C:\Users\User\Desktop\projects\txartgrants
```

Initialize Git:

```bash
git init
```

## Step 5: Stage and Commit Files

Check what files will be added:

```bash
git status
```

Add all files to staging:

```bash
git add .
```

Create your first commit:

```bash
git commit -m "Initial commit: Texas Art Grants project"
```

## Step 6: Connect to GitHub

Add your GitHub repository as the remote origin (replace `yourusername` with your GitHub username):

```bash
git remote add origin https://github.com/yourusername/txartgrants.git
```

Verify the remote was added:

```bash
git remote -v
```

## Step 7: Rename Branch to Main (if needed)

Ensure you're on the main branch:

```bash
git branch -M main
```

## Step 8: Push to GitHub

Push your code to GitHub:

```bash
git push -u origin main
```

**Note**: On first push, you may be prompted to authenticate:
- If using HTTPS: GitHub will prompt for username and password (use a Personal Access Token, not your account password)
- If using Git Credential Manager: It will open a browser window for authentication

### Creating a Personal Access Token (if needed)

If prompted for a password, you'll need a Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **Generate new token (classic)**
3. Give it a name like "txartgrants-local"
4. Select scopes: **repo** (full control of private repositories)
5. Click **Generate token**
6. Copy the token (you won't see it again!)
7. Use this token as your password when pushing

## Step 9: Verify Upload

1. Refresh your GitHub repository page
2. You should see all your project files
3. The README.md should be visible on the main page

## Troubleshooting

### "git is not recognized"

- Git is not installed or not in your PATH
- Restart your terminal after installing Git
- Verify installation: `git --version`

### "Authentication failed"

- Use a Personal Access Token instead of your GitHub password
- Or set up SSH keys for easier authentication (see below)

### "Repository not found"

- Check that the repository name matches exactly
- Verify you have access to the repository
- Check the remote URL: `git remote -v`

### "Failed to push some refs"

- Someone else may have pushed to the repository
- Pull first: `git pull origin main --rebase`
- Then push again: `git push origin main`

## Optional: Set Up SSH Authentication

For easier authentication without tokens:

1. Generate SSH key:
```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
```
Press Enter to accept default location.

2. Start SSH agent:
```bash
eval "$(ssh-agent -s)"
```

3. Add SSH key to agent:
```bash
ssh-add ~/.ssh/id_ed25519
```

4. Copy your public key:
```bash
cat ~/.ssh/id_ed25519.pub
```

5. Add to GitHub:
   - Go to GitHub → Settings → SSH and GPG keys
   - Click **New SSH key**
   - Paste your public key
   - Click **Add SSH key**

6. Change remote URL to SSH:
```bash
git remote set-url origin git@github.com:yourusername/txartgrants.git
```

## Next Steps

After uploading to GitHub:

1. **Set up branch protection** (recommended):
   - Go to repository Settings → Branches
   - Add rule for `main` branch
   - Enable "Require pull request reviews before merging"

2. **Add collaborators** (if needed):
   - Go to Settings → Collaborators
   - Add team members

3. **Set up deployment**:
   - See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel deployment instructions
   - Connect your GitHub repository to Vercel

4. **Configure GitHub Actions** (optional):
   - Set up CI/CD workflows
   - Add automated testing

## Common Git Commands

```bash
# Check status
git status

# Add files
git add .
git add filename.txt

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# Create new branch
git checkout -b feature-branch-name

# Switch branches
git checkout main

# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)


