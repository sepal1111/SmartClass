@echo off
echo Starting SmartClass build and packaging process...
echo This may take a few minutes.

echo.
echo [1/8] Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo Client dependency installation failed!
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo [2/8] Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Server dependency installation failed!
    pause
    exit /b %errorlevel%
)
echo Installing 'pkg' for packaging...
call npm install pkg --save-dev
if %errorlevel% neq 0 (
    echo Pkg installation failed!
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo [3/8] Building client application...
cd client
call npm run build
if %errorlevel% neq 0 (
    echo Client build failed!
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo [4/8] Packaging server application for Windows...
cd server
call npx pkg . --output ../release/smart-class.exe
if %errorlevel% neq 0 (
    echo Server packaging failed!
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo [5/8] Copying native addons for database...
if not exist "release" mkdir "release"
xcopy "server\node_modules\better-sqlite3\build\Release\better_sqlite3.node" "release\" /Y /Q
if %errorlevel% neq 0 (
    echo Failed to copy database addon! Make sure server dependencies are installed.
    pause
    exit /b %errorlevel%
)

echo.
echo [6/8] Copying native addons for password hashing...
REM The location of bcrypt_lib.node can change. Search for it recursively and copy it.
pushd server\node_modules\bcrypt
for /r %%f in (*.node) do (
    echo Found bcrypt native addon at: %%f
    xcopy "%%f" "..\..\..\release\" /Y /Q
)
popd
REM Check if the file was actually copied
if not exist "release\bcrypt_lib.node" (
    echo ERROR: Failed to find and copy bcrypt_lib.node! Build process cannot continue.
    pause
    exit /b 1
)

echo.
echo [7/8] Copying client build to release directory...
xcopy "client\dist" "release\dist\" /E /I /Y /Q
if %errorlevel% neq 0 (
    echo Failed to copy client build files!
    pause
    exit /b %errorlevel%
)

echo.
echo [8/8] Copying data folders to release directory...
if exist "server\data" (
    echo      Copying database...
    xcopy "server\data" "release\data\" /E /I /Y /Q
)
if exist "server\photos" (
    echo      Copying photos...
    xcopy "server\photos" "release\photos\" /E /I /Y /Q
)
if exist "server\uploads" (
    echo      Copying uploads...
    xcopy "server\uploads" "release\uploads\" /E /I /Y /Q
)

echo.
echo =======================================================
echo  Build complete!
echo  The final application is located in the 'release' folder.
echo =======================================================
echo.
pause

