// /src/store/auth.js
import { reactive, toRefs } from 'vue';
import { account } from '../services/appwrite';
import router from '../router';

// 建立一個響應式的狀態物件來存放使用者資訊
const state = reactive({
  user: null,
  isLoggedIn: false,
  isLoading: true, // 用於追蹤初始的認證狀態檢查
});

/**
 * 帶有指數退避重試機制的 API 呼叫包裝器
 * @param {Function} apiCall - 要執行的 Appwrite API 函式
 * @param {number} maxRetries - 最大重試次數
 * @returns {Promise<any>}
 */
const apiCallWithRetry = async (apiCall, maxRetries = 5) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await apiCall(); // 嘗試執行 API 呼叫
    } catch (error) {
      // 檢查是否為速率限制錯誤 (Appwrite 的速率限制錯誤碼為 429)
      if (error.code === 429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 計算延遲時間 (1s, 2s, 4s, ...)
        console.warn(`速率限制已超出，將在 ${delay / 1000} 秒後重試...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      } else {
        // 如果是其他錯誤或已達最大重試次數，則直接拋出錯誤
        throw error;
      }
    }
  }
};

/**
 * 檢查當前 Appwrite session 狀態
 */
const checkAuthStatus = async () => {
  try {
    // 使用重試機制包裝 API 呼叫
    const currentUser = await apiCallWithRetry(() => account.get());
    state.user = currentUser;
    state.isLoggedIn = true;
  } catch (error) {
    // 如果出錯 (例如 session 不存在)，則將狀態設為未登入
    state.user = null;
    state.isLoggedIn = false;
  } finally {
    // 無論成功或失敗，都表示初始檢查已完成
    state.isLoading = false;
  }
};

/**
 * 登入功能
 * @param {string} email
 * @param {string} password
 * @returns {Promise<boolean>}
 */
const login = async (email, password) => {
  try {
    // 使用重試機制包裝 API 呼叫
    await apiCallWithRetry(() => account.createEmailPasswordSession(email, password));
    // 登入成功後，立即更新全域的認證狀態
    await checkAuthStatus();
    // 狀態更新後，手動導航到主頁
    if (state.isLoggedIn) {
        router.push('/');
    }
    return true; // 表示登入成功
  } catch (error) {
    console.error('登入失敗:', error);
    return false; // 表示登入失敗
  }
};


/**
 * 登出功能
 */
const logout = async () => {
  try {
    // 使用重試機制包裝 API 呼叫
    await apiCallWithRetry(() => account.deleteSession('current'));
    state.user = null;
    state.isLoggedIn = false;
    // 導向至登入頁面
    router.push('/login');
  } catch (error) {
    console.error('登出失敗:', error);
  }
};

// 導出一個組合式函數，讓其他組件可以存取狀態和方法
export function useAuth() {
  return {
    ...toRefs(state),
    checkAuthStatus,
    login,
    logout,
  };
}

