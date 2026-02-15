#!/bin/bash

# MindDrop Deployment Script
# Run this script to deploy to GitHub and Vercel

echo "🚀 MindDrop Deployment Script"
echo "=============================="

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not installed. Install with: winget install GitHub.cli"
    exit 1
fi

# Check gh auth status
echo ""
echo "📋 Checking GitHub authentication..."
if ! gh auth status &> /dev/null; then
    echo "❌ Not logged into GitHub. Please run: gh auth login"
    echo "   Then re-run this script."
    exit 1
fi

# Get repository name
REPO_NAME="MindDrop2-Opencode"
echo "📦 Creating GitHub repository: $REPO_NAME"

# Create repository (ignore if exists)
gh repo create "$REPO_NAME" --public --source=. --push 2>/dev/null || {
    echo "ℹ️  Repository might already exist, pushing to existing remote..."
}

# Add Vercel remote if not present
echo ""
echo "🔗 Setting up Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo ""
echo "✅ Deployment ready!"
echo ""
echo "Next steps:"
echo "1. Go to https://vercel.com"
echo "2. Import your GitHub repository: $REPO_NAME"
echo "3. Configure:"
echo "   - Framework: Vite"
echo "   - Build: npm run build"
echo "   - Output: dist"
echo "4. Add environment variable: VITE_API_KEY"
echo "5. Deploy! 🚀"
