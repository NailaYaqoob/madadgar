// For Android Emulator use 10.0.2.2; for physical devices/local web use local Wi-Fi IP; for production use EXPO_PUBLIC_API_URL.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.12:8000/api/v1';
