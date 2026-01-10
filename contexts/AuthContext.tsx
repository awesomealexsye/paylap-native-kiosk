/**
 * Auth Context - Global authentication state management
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User, Gym } from '../types/auth';
import authService from '../services/authService';
import gymService from '../services/gymService';

interface AuthContextType extends AuthState {
    login: (mobile: string) => Promise<{ success: boolean; message: string }>;
    verifyOTP: (mobile: string, otp: string) => Promise<{ success: boolean; message: string; userId?: number }>;
    selectGym: (gym: Gym) => Promise<void>;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        isLoading: true,
        isAuthenticated: false,
        user: null,
        token: null,
        selectedGym: null,
    });

    // Load auth state on mount
    useEffect(() => {
        loadAuthState();
    }, []);

    const loadAuthState = async () => {
        try {
            const token = await authService.getAuthToken();
            const user = await authService.getCurrentUser();
            const selectedGym = await gymService.getSelectedGym();

            setAuthState({
                isLoading: false,
                isAuthenticated: !!(token && user),
                user,
                token,
                selectedGym,
            });

            console.log('✅ Auth state loaded:', { isAuthenticated: !!(token && user), user, selectedGym });
        } catch (error) {
            console.error('❌ Error loading auth state:', error);
            setAuthState({
                isLoading: false,
                isAuthenticated: false,
                user: null,
                token: null,
                selectedGym: null,
            });
        }
    };

    const login = async (mobile: string): Promise<{ success: boolean; message: string }> => {
        const response = await authService.login(mobile);
        return {
            success: response.status,
            message: response.message,
        };
    };

    const verifyOTP = async (
        mobile: string,
        otp: string
    ): Promise<{ success: boolean; message: string; userId?: number }> => {
        const response = await authService.verifyOTP(mobile, otp);

        if (response.status && response.data && response.jwt_token) {
            setAuthState({
                isLoading: false,
                isAuthenticated: true,
                user: response.data,
                token: response.jwt_token,
                selectedGym: authState.selectedGym, // Keep existing gym if any
            });

            return {
                success: true,
                message: response.message,
                userId: response.data.id,
            };
        }

        return {
            success: false,
            message: response.message,
        };
    };

    const selectGym = async (gym: Gym): Promise<void> => {
        await gymService.saveSelectedGym(gym);
        setAuthState((prev) => ({
            ...prev,
            selectedGym: gym,
        }));
        console.log('✅ Gym selected in context:', gym.name);
    };

    const logout = async (): Promise<void> => {
        await authService.logout();
        await gymService.clearSelectedGym();
        setAuthState({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
            selectedGym: null,
        });
        console.log('👋 Logged out from context');
    };

    const refreshAuth = async (): Promise<void> => {
        await loadAuthState();
    };

    return (
        <AuthContext.Provider
            value={{
                ...authState,
                login,
                verifyOTP,
                selectGym,
                logout,
                refreshAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
