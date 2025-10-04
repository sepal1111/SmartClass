// /src/services/appwrite.js
import { Client, Account } from 'appwrite';

const client = new Client();

client
    .setEndpoint('https://fra.cloud.appwrite.io/v1') 
    .setProject('68df74ca0030798d002b'); // 已填入您的專案 ID

export const account = new Account(client);

