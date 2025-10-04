// /src/services/firebase.js
import { initializeApp as fbInitializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 注意：請務必將以下設定替換為您自己的 Firebase 專案設定！
const firebaseConfig = {
  apiKey: "AIzaSyCuXN6n9jUxDdXdMJOuMvR0As8dArWFlHM",
  authDomain: "classroom-manager-app.firebaseapp.com",
  projectId: "classroom-manager-app",
  storageBucket: "classroom-manager-app.firebasestorage.app",
  messagingSenderId: "761251200545",
  appId: "1:761251200545:web:1c48003ee1e03be4ad2d60"
};

let app;
let auth;
let db;

export const initializeApp = () => {
  if (!app) {
    app = fbInitializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized.");
  }
  return { app, auth, db };
}

// 導出實例以供其他模組使用
export { auth, db };

