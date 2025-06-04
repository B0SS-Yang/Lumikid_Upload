// utils/api.ts

import axios from "axios";
import { API_URL } from "@/constants/API";
import { Int32 } from "react-native/Libraries/Types/CodegenTypes";
// ========== user system module (main.py) ==========
const API_BASE = API_URL  ; // 
const API_KEY = "cs46_learning_companion_secure_key_2024"; // ✅ used as x-api-key
const user_id = 1
const client = axios.create({
  baseURL: API_BASE,
  headers: {
    "x-api-key": API_KEY,
  },
});
let globalUserId = 1;
export const register = (data: {
  email: string;
  password: string;
  type: string;
}) => client.post("/register", data);

export const verifyCode = (data: { email: string; code: string }) =>
  client.post("/verify-code", data);

export const saveUserInfo = (data: {
  name: string;
  role: string;
  age: string;
  gender: string;
  avatar: string;
  interests: string[];
  language: string;
  user_id: string;
}) => client.post("/save-user-info", data);

export const sendMessageToAssistant = (data: {
  message: string;
  user_id: string;
  age: number;
  language?: string;
  interests?: string[];
  conversation_id?: string;
  context?: { role: string; content: string }[];
}) => client.post("/conversations", data);

// ========== ✅ chat module (main_chat.py service: 8001) ==========

const chatBaseUrl = API_BASE; // ✅ chat service port

export const sendMessageToAI = async (text: string, chatId: string, userId: Int32) => {
  const body = {
    age: 5,
    id: parseInt(chatId),
    interests: ["books", "reading"],
    language: "en",
    message: text,
    user_id: userId
  };

  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "cs46_learning_companion_secure_key_2024",
    },
    body: JSON.stringify(body),
  });

  const responseData = await response.json();
  console.log('📥 original API response:', responseData);
  
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return responseData;
};

// ========== 📜 chat history: get conversation history ==========
export const getConversationHistory = async (conversation_id: string) => {
  const res = await axios.get(
    `${API_BASE}/conversation-history/${conversation_id}`,
    {
      headers: {
        "x-api-key": API_KEY,
      },
    }
  );
  return res.data; // { messages: [...], conversation_id: "..." }
};

// ========== 🔍 vector search: keyword search (library) ==========
export const vectorSearch = async (query: string, user_id = "test123") => {
  const res = await axios.post(
    `${API_BASE}/vector-search`,
    {
      query,
      user_id,
      age_group: "3-7",
      max_results: 3,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    }
  );
  return res.data; 
};

// ========== 📦 offline content sync interface ==========
export const syncOfflineContent = async (user_id: string, content_ids: string[], last_sync_time: string) => {
  const res = await axios.post(
    `${API_BASE}/offline-content-management`,
    {
      user_id,
      content_ids,
      last_sync_time,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    }
  );
  return res.data; // return matched content
};
