// /appwrite/functions/rename-and-upload/src/index.js
/*
  'req' variable has:
    'headers' - object with request headers
    'payload' - object with request body
    'variables' - object with function variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200

  In production, you can safely remove the console.log() statement.
*/
module.exports = async (req, res) => {
  console.log('rename-and-upload function was triggered.');
  
  // TODO:
  // 1. 從 req.variables 取得 Google API 密鑰與教師的 Access Token。
  // 2. 從 req.payload 取得檔案、學生資訊、目標資料夾 ID。
  // 3. 實作 Google Drive API 的檔案上傳與重新命名邏輯。
  // 4. 回傳成功或失敗的 JSON 結果。

  res.json({
    success: true,
    message: 'Function executed. Awaiting full implementation.',
  });
};
