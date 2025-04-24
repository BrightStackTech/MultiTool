import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/api';
import { toast } from 'react-toastify';

// Define user type
type User = {
    id: string;
    username: string;
    email: string;
    googleId?: string;
    profilePicture?: string;
    saveFilesToDashboard?: boolean;
};

// Define auth context type
type AuthContextType = {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    googleAuth: (token: string, isSignup?: boolean) => Promise<void>;
    logout: () => void;
    handleTokenExpiration: () => void;
    updatePreferences: (preferences: { saveFilesToDashboard: boolean }) => Promise<void>;
    updateUser: (user: User) => void; // <-- Add this
};

// Create context with default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props type
type AuthProviderProps = {
    children: ReactNode;
};

// Auth Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const updateUser = (newUser: User) => {
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    // Check for stored authentication on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
        }

        setIsLoading(false);
    }, []);

    // Set up listener for token expiration events
    useEffect(() => {
        const handleTokenExpiredEvent = () => {
            handleTokenExpiration();
        };

        // Add event listener
        window.addEventListener('auth:token-expired', handleTokenExpiredEvent);

        // Clean up
        return () => {
            window.removeEventListener('auth:token-expired', handleTokenExpiredEvent);
        };
    }, [navigate]);

    // Handle token expiration
    const handleTokenExpiration = () => {
        console.log('Token expired, logging out user');

        // Show a message to the user
        toast.info('Your session has expired. Please log in again.');

        // Log the user out
        logout();

        // Redirect to login page
        navigate('/login');
    };

    // Login function
    const login = async (email: string, password: string) => {
        try {
            const response = await authApi.login(email, password);

            setUser(response.user);
            setToken(response.token);

            // Store auth data in localStorage
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('token', response.token);

            navigate('/dashboard');
        } catch (error) {
            throw error;
        }
    };

    // Register function
    const register = async (username: string, email: string, password: string) => {
        try {
            const response = await authApi.register(username, email, password);
            // Do NOT setUser or setToken here!
            // Just return the response message
            return response.message;
        } catch (error) {
            throw error;
        }
    };

    // Google auth function
    const googleAuth = async (googleToken: string, isSignup = false) => {
        try {
            const response = await authApi.googleAuth(googleToken, isSignup);

            setUser(response.user);
            setToken(response.token);

            // Store auth data in localStorage
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('token', response.token);

            navigate('/dashboard');
        } catch (error) {
            throw error;
        }
    };

    // Logout function
    const logout = () => {
        // Clear state
        setUser(null);
        setToken(null);

        // Clear localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        // Redirect to home
        navigate('/');
    };

    // Update user preferences
    const updatePreferences = async (preferences: { saveFilesToDashboard: boolean }) => {
        try {
            if (!token || !user) {
                throw new Error('You must be logged in to update preferences');
            }

            const response = await authApi.updatePreferences(preferences, token);

            // Update user state with the new preferences
            const updatedUser = {
                ...user,
                saveFilesToDashboard: preferences.saveFilesToDashboard
            };

            setUser(updatedUser);

            // Update in localStorage
            localStorage.setItem('user', JSON.stringify(updatedUser));

            return response;
        } catch (error: any) {
            // Check if the error is due to token expiration
            if (error.response && error.response.status === 401 &&
                error.response.data && error.response.data.error === 'Token expired') {
                handleTokenExpiration();
            }

            console.error('Failed to update preferences:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user,
                login,
                register,
                googleAuth,
                logout,
                handleTokenExpiration,
                updatePreferences,
                updateUser // <-- Add this
            }}
        >
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

export default AuthContext; 