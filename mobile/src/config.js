// Production backend on Google Cloud Run — overridable via EXPO_PUBLIC_API_URL.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://madadgar-backend-120966766782.asia-south1.run.app/api/v1';
