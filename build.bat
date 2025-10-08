@echo off
echo Starting SmartClass build and packaging process with PKG...
echo IMPORTANT: Make sure you are running this script in a Node.js v18 environment.
echo You can use 'nvm use 18.17.0' before running this script.
echo.
pause
echo.

echo [1/7] Cleaning up previous builds and modules...
if exist "release" (
    rmdir /s /q "release"
)
if exist "client\node_modules" (
    rmdir /s /q "client\node_modules"
)
if exist "client\package-lock.json" (
    del "client\package-lock.json"
)
if exist "server\node_modules" (
    rmdir /s /q "server\node_modules"
)
if exist "server\package-lock.json" (
    del "server\package-lock.json"
)
echo Cleanup complete.
echo.


echo [2/7] Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo Failed to install client dependencies.
    exit /b %errorlevel%
)
echo.

echo [3/7] Installing server dependencies...
cd ../server
call npm install
if %errorlevel% neq 0 (
    echo Failed to install server dependencies.
    exit /b %errorlevel%
)
echo.

echo [4/7] Building client application...
cd ../client
call npm run build
if %errorlevel% neq 0 (
    echo Failed to build client application.
    exit /b %errorlevel%
)
echo.

echo [5/7] Packaging server application for Windows with PKG...
cd ../server
call npx pkg server.js --targets node18-win-x64 --output ../release/bin/smart-class.exe
if %errorlevel% neq 0 (
    echo Failed to package server application.
    exit /b %errorlevel%
)
cd ..
echo.

echo [6/7] Copying required native modules...
if not exist "release\bin" mkdir "release\bin"
xcopy "server\node_modules\better-sqlite3\build\Release\better_sqlite3.node" "release\bin\" /Y /Q
if %errorlevel% neq 0 (
    echo Failed to copy database addon!
    exit /b %errorlevel%
)
rem Find and copy the bcrypt native module
for /r "server\node_modules\bcrypt" %%f in (*bcrypt_lib.node) do (
    echo Found bcrypt addon at: %%f
    xcopy "%%f" "release\bin\" /Y /Q
    goto :bcrypt_copied
)
echo WARNING: Could not find bcrypt_lib.node.
:bcrypt_copied
echo.

echo [7/7] Copying client build, data folders, and creating launcher...
xcopy "client\dist" "release\bin\dist\" /E /I /Y /Q
if exist "server\data" xcopy "server\data" "release\data\" /E /I /Y /Q
if not exist "release\uploads" mkdir "release\uploads"
if not exist "release\photos" mkdir "release\photos"
echo @echo off > release\smartclass.bat
echo echo Starting SmartClass Server...
echo cd /d %%~dp0\bin >> release\smartclass.bat
echo start smart-class.exe >> release\smartclass.bat
echo.

echo Build process completed successfully!
echo You can find the final application in the 'release' folder.
echo Please run 'smartclass.bat' to start the application.
pause

