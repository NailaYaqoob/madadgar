import axios from 'axios';
import { Platform } from 'react-native';

// For Android Emulator, localhost is 10.0.2.2. For physical device, it must be your machine's local IP.
// Update this to your local Wi-Fi IP address if testing on a physical phone with Expo Go.
const BASE_URL = 'http://192.168.1.12:8000/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
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
