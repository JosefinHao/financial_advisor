#!/bin/bash

# Frontend Deployment Script
# This script builds and deploys the React frontend

set -e  # Exit on any error

echo "🚀 Starting frontend deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "client/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Navigate to client directory
cd client

print_status "Installing dependencies..."
npm install

print_status "Building for production..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    print_error "Build failed! No build directory created."
    exit 1
fi

print_status "Build completed successfully!"

# Check build size
BUILD_SIZE=$(du -sh build | cut -f1)
print_status "Build size: $BUILD_SIZE"

# List build contents
print_status "Build contents:"
ls -la build/

print_status "✅ Frontend build completed!"
echo ""
echo "📋 Next steps:"
echo "1. Upload the 'build' folder to your hosting provider"
echo "2. Configure your domain to point to the build files"
echo "3. Ensure your backend API is accessible at: https://financial-advisor-4yle.onrender.com"
echo ""
echo "🌐 Deployment options:"
echo "- Netlify: Drag and drop the 'build' folder"
echo "- Vercel: Connect your GitHub repo and set root directory to 'client'"
echo "- GitHub Pages: Run 'npm run deploy' (requires gh-pages package)"
echo "- Any static hosting: Upload the 'build' folder contents"
echo ""
echo "🔧 For local testing:"
echo "npx serve -s build" 