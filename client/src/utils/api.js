// File Path: /client/src/utils/api.js

/**
 * 一個封裝了 fetch 的輔助函式，會自動附加 JWT token 到請求標頭中。
 * @param {string} url - 要請求的 API 端點路徑 (例如：'/api/students')
 * @param {object} [options={}] - fetch 函式的選項 (例如：method, headers, body)
 * @returns {Promise<Response>} - 返回 fetch 的 Promise 物件
 */
export const authFetch = (url, options = {}) => {
  // 從 localStorage 讀取儲存的 token
  const token = localStorage.getItem('teacherToken');

  // 設定預設標頭
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 如果 token 存在，就將它加入到 Authorization 標頭中
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const finalOptions = {
    ...options,
    headers: defaultHeaders,
  };

  // 使用更新後的選項執行 fetch
  return fetch(url, finalOptions);
};
