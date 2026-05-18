// For production/standalone use live Railway backend by default; can be overridden via EXPO_PUBLIC_API_URL.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://madadgar-production.up.railway.app/api/v1';
