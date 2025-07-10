@echo off
REM Frontend Deployment Script for Windows
REM This script builds and deploys the React frontend

echo 🚀 Starting frontend deployment...

REM Check if we're in the right directory
if not exist "client\package.json" (
    echo [ERROR] Please run this script from the project root directory
    pause
    exit /b 1
)

REM Navigate to client directory
cd client

echo [INFO] Installing dependencies...
call npm install

echo [INFO] Building for production...
call npm run build

REM Check if build was successful
if not exist "build" (
    echo [ERROR] Build failed! No build directory created.
    pause
    exit /b 1
)

echo [INFO] Build completed successfully!

REM Get build size
for /f "tokens=*" %%i in ('dir build /s ^| find "File(s)"') do set BUILD_INFO=%%i
echo [INFO] Build info: %BUILD_INFO%

echo [INFO] Build contents:
dir build

echo ✅ Frontend build completed!
echo.
echo 📋 Next steps:
echo 1. Upload the 'build' folder to your hosting provider
echo 2. Configure your domain to point to the build files
echo 3. Ensure your backend API is accessible at: https://financial-advisor-4yle.onrender.com
echo.
echo 🌐 Deployment options:
echo - Netlify: Drag and drop the 'build' folder
echo - Vercel: Connect your GitHub repo and set root directory to 'client'
echo - GitHub Pages: Run 'npm run deploy' (requires gh-pages package)
echo - Any static hosting: Upload the 'build' folder contents
echo.
echo 🔧 For local testing:
echo npx serve -s build
echo.
pause 