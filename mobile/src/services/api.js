import axios from 'axios';
import { API_BASE_URL } from '../config';

const BASE_URL = API_BASE_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ChatService = {
  sendRequest: async (userId, message) => {
    try {
      const response = await apiClient.post('/chat/request', {
        user_id: userId,
        message: message,
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
};
