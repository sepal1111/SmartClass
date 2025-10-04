// /src/store/auth.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { auth } from '@/services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from "firebase/auth";

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);

  const isAuthenticated = computed(() => !!user.value);
  const userEmail = computed(() => user.value?.email);

  // 監聽 Firebase 認證狀態變化
  onAuthStateChanged(auth, (firebaseUser) => {
    user.value = firebaseUser;
  });

  // 註冊
  async function register(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user.value = userCredential.user;
      return true;
    } catch (error) {
      console.error("註冊失敗:", error.message);
      return false;
    }
  }

  // 登入
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      user.value = userCredential.user;
      return true;
    } catch (error) {
      console.error("登入失敗:", error.message);
      return false;
    }
  }
  
  // 登出
  async function logout() {
    try {
      await signOut(auth);
      user.value = null;
    } catch (error) {
      console.error("登出失敗:", error.message);
    }
  }

  return { user, isAuthenticated, userEmail, register, login, logout };
});

