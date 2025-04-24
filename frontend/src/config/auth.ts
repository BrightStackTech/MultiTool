// Google OAuth configuration
export const GOOGLE_AUTH_CONFIG = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
    redirectUri: `${import.meta.env.VITE_SERVER_URL}/api/auth/google/callback`,
};

// Auth API endpoints
export const AUTH_ENDPOINTS = {
    googleAuth: '/api/auth/google',
    googleCallback: '/api/auth/google/callback',
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    logout: '/api/auth/logout',
}; 