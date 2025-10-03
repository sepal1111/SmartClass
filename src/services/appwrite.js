// /src/services/appwrite.js
import { Client, Account, Databases, Storage, Functions } from 'appwrite';

const client = new Client();

// 從環境變數讀取 Appwrite 設定，若無則使用預設值
// 請記得在 Vercel 或您的部署環境中設定這些變數
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '68df74ca0030798d002b';
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';

client
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export default client;
