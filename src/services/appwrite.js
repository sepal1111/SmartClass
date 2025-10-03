// /src/services/appwrite.js
import { Client, Account } from 'appwrite';

const client = new Client();

client
    // **重要**：請將此處的 URL 替換為您在 Appwrite 控制台複製的真實 API 端點
    // 根據錯誤訊息，您的端點很可能是 'https://fra.cloud.appwrite.io/v1'
    .setEndpoint('https://fra.cloud.appwrite.io/v1') 
    .setProject('68df74ca0030798d002b'); // 已更新為您提供的專案 ID

export const account = new Account(client);