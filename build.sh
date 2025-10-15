#!/bin/bash

# 讓腳本在遇到任何錯誤時立即停止，以避免產生不完整的封裝
set -e

echo "正在開始 SmartClass 的 macOS 封裝程序..."
echo "重要：請確保您正在 Node.js v18 環境下執行此腳本。"
echo ""
read -p "請按任意鍵繼續..."
echo ""

echo "[1/7] 清理舊的建置檔案與模組..."
rm -rf "release"
rm -rf "client/node_modules"
rm -f "client/package-lock.json"
rm -rf "server/node_modules"
rm -f "server/package-lock.json"
echo "清理完成。"
echo ""


echo "[2/7] 安裝前端依賴套件..."
cd client
npm install
cd ..
echo ""

echo "[3/7] 安裝後端依賴套件..."
cd server
npm install
cd ..
echo ""

echo "[4/7] 建置前端應用程式..."
cd client
npm run build
cd ..
echo ""

echo "[5/7] 使用 PKG 封裝後端應用程式 (for macOS)..."
cd server

# --- 關鍵修改：選擇符合您 Mac 電腦的目標 ---
# 如果您使用的是 Apple Silicon (M1/M2/M3) 晶片，請使用 arm64
npx pkg server.js --targets node18-macos-arm64 --output ../release/bin/smart-class

# 如果您使用的是 Intel 晶片，請註解上面那行，並取消註解下面這行
# npx pkg server.js --targets node18-macos-x64 --output ../release/bin/smart-class

cd ..
echo ""

echo "[6/7] 複製必要的原生模組..."
mkdir -p "release/bin"
# 複製 better-sqlite3 模組
cp "server/node_modules/better-sqlite3/build/Release/better_sqlite3.node" "release/bin/"
# 尋找並複製 bcrypt 模組
# 使用 head -n 1 避免 find 找到多個結果時出錯
BcryptPath=$(find server/node_modules/bcrypt -name "*bcrypt_lib.node" | head -n 1)
if [ -f "$BcryptPath" ]; then
    echo "找到 bcrypt 插件於: $BcryptPath"
    cp "$BcryptPath" "release/bin/"
else
    echo "警告：找不到 bcrypt_lib.node 檔案。"
fi
echo ""

echo "[7/7] 複製前端檔案、資料夾並建立啟動器..."
cp -R "client/dist" "release/bin/dist"
# *** 關鍵修正：移除複製 server/data 的步驟 ***
# 執行檔首次啟動時，database.js 會自動在 bin 目錄下建立 data 資料夾
mkdir -p "release/bin/uploads"
mkdir -p "release/bin/photos"

# 建立一個可雙擊執行的 .command 啟動腳本
echo "#!/bin/bash" > release/smartclass.command
echo "DIR=\$(cd \"\$(dirname \"\$0\")\" && pwd)" >> release/smartclass.command
echo "cd \"\$DIR/bin\"" >> release/smartclass.command
echo "./smart-class" >> release/smartclass.command

# 賦予啟動腳本執行權限
chmod +x release/smartclass.command

echo ""
echo "封裝程序已成功完成！"
echo "您可以在 'release' 資料夾中找到最終的應用程式。"
echo "請雙擊 'smartclass.command' 來啟動應用程式。"
read -p "請按任意鍵結束..."

