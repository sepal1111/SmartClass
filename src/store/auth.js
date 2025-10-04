// /src/store/auth.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { account } from '../services/appwrite';
import router from '../router'; // 引入 router

export const useAuth = defineStore('auth', () => {
  const user = ref(null);
  const isLoading = ref(true);
  const isLoggedIn = ref(false);

  const checkAuthStatus = async () => {
    isLoading.value = true;
    try {
      const currentUser = await account.get();
      user.value = currentUser;
      isLoggedIn.value = true;
    } catch (error) {
      user.value = null;
      isLoggedIn.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  const login = async (email, password) => {
    try {
      await account.createEmailSession(email, password);
      await checkAuthStatus();
      return true;
    } catch (error) {
      console.error('登入失敗:', error);
      return false;
    }
  };

  // 登出邏輯
  const logout = async () => {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('登出 API 呼叫失敗:', error);
    } finally {
      // 無論 API 成功或失敗，都強制清理前端狀態並導向登入頁
      user.value = null;
      isLoggedIn.value = false;
      router.push({ name: 'Login' });
    }
  };

  return {
    user,
    isLoading,
    isLoggedIn,
    checkAuthStatus,
    login,
    logout,
  };
});

