// File Path: /client/src/utils/api.js

/**
 * 一個封裝了 fetch 的輔助函式，會自動附加 JWT token 到請求標頭中。
 * @param {string} url - 要請求的 API 端點路徑 (例如：'/api/students')
 * @param {object} [options={}] - fetch 函式的選項 (例如：method, headers, body)
 * @returns {Promise<Response>} - 返回 fetch 的 Promise 物件
 */
export const authFetch = (url, options = {}) => {
  // *** 修正開始 ***
  // 從 localStorage 讀取儲存的 token
  // 優先讀取學生 token，若無則讀取教師 token
  const token = localStorage.getItem('studentToken') || localStorage.getItem('teacherToken');
  // *** 修正結束 ***

  // 設定預設標頭
  const defaultHeaders = {
    ...options.headers,
  };

  // 如果 token 存在，就將它加入到 Authorization 標頭中
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  // 判斷如果 body 是 FormData 的實例，就不要設定 Content-Type
  // 瀏覽器會自動為 FormData 設定正確的 multipart/form-data 標頭
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const finalOptions = {
    ...options,
    headers: defaultHeaders,
  };

  // 使用更新後的選項執行 fetch
  return fetch(url, finalOptions);
};

