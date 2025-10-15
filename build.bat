@echo off
rem *** 關鍵修正：切換命令提示字元的代碼頁至 UTF-8 (65001) 以正確顯示中文 ***
chcp 65001 > nul

echo 正在開始 SmartClass Windows 版本的建置與封裝程序...
echo 重要：請確保您在 Node.js v18 環境下執行此腳本。
echo.
pause
echo.

echo [1/7] 正在清理舊的建置檔案與模組...
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
echo 清理完成。
echo.

echo [2/7] 正在安裝前端依賴套件...
cd client
call npm install
cd ..
if %errorlevel% neq 0 (
    echo 安裝前端依賴套件失敗。
    exit /b %errorlevel%
)
echo.

echo [3/7] 正在安裝後端依賴套件...
cd server
call npm install
cd ..
if %errorlevel% neq 0 (
    echo 安裝後端依賴套件失敗。
    exit /b %errorlevel%
)
echo.

echo [4/7] 正在建置前端應用程式...
cd client
call npm run build
cd ..
if %errorlevel% neq 0 (
    echo 建置前端應用程式失敗。
    exit /b %errorlevel%
)
echo.

echo [5/7] 正在使用 PKG 封裝後端應用程式 (for Windows)...
cd server
call npx pkg server.js --targets node18-win-x64 --output ../release/bin/smart-class.exe
cd ..
if %errorlevel% neq 0 (
    echo 封裝後端應用程式失敗。
    exit /b %errorlevel%
)
echo.

echo [6/7] 正在複製必要的原生模組...
if not exist "release\bin" mkdir "release\bin"
xcopy "server\node_modules\better-sqlite3\build\Release\better_sqlite3.node" "release\bin\" /Y /Q
if %errorlevel% neq 0 (
    echo 複製資料庫插件失敗！
    exit /b %errorlevel%
)
rem 尋找並複製 bcrypt 原生模組
for /r "server\node_modules\bcrypt" %%f in (*bcrypt_lib.node) do (
    echo 找到 bcrypt 插件於: %%f
    xcopy "%%f" "release\bin\" /Y /Q
    goto :bcrypt_copied
)
echo 警告：找不到 bcrypt_lib.node 檔案。
:bcrypt_copied
echo.

echo [7/7] 正在複製前端建置檔案、建立資料夾並建立啟動器...
xcopy "client\dist" "release\bin\dist\" /E /I /Y /Q

rem 執行檔首次啟動時，database.js 會自動在 bin 目錄下建立 data 資料夾與資料庫檔案。
if not exist "release\bin\uploads" mkdir "release\bin\uploads"
if not exist "release\bin\photos" mkdir "release\bin\photos"

echo @echo off > release\smartclass.bat
echo echo 正在啟動智慧班級伺服器... >> release\smartclass.bat
echo cd /d %%~dp0\bin >> release\smartclass.bat
echo start smart-class.exe >> release\smartclass.bat
echo.

echo 封裝程序已成功完成！
echo 您可以在 'release' 資料夾中找到最終的應用程式。
echo 請執行 'smartclass.bat' 來啟動應用程式。
pause

