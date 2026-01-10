/**
 * Authentication Type Definitions
 */

// User interface
export interface User {
    id: number;
    name: string;
    email: string | null;
    mobile?: string;
    address?: string | null;
    profile_image?: string;
    auth_key: string;
}

// Gym interface
export interface Gym {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    logo_url?: string;
    logo_path?: string;
    members_count?: number;
    trainers_count?: number;
    city?: string;
    state?: string;
    pincode?: string;
    google_address?: string;
    gst?: string;
}

// Login API
export interface LoginRequest {
    mobile: string;
}

export interface LoginResponse {
    status: boolean;
    message: string;
}

// OTP Verify API
export interface OTPVerifyRequest {
    mobile: string;
    otp: string;
}

export interface OTPVerifyResponse {
    status: boolean;
    message: string;
    data?: User;
    jwt_token?: string;
}

// Gym List API
export interface GymListRequest {
    user_id: number;
}

export interface GymListResponse {
    status: boolean;
    message: string;
    data?: Gym[];
}

// Auth State
export interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    selectedGym: Gym | null;
}

// Storage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: '@kiosk_auth_token',
    USER_DATA: '@kiosk_user_data',
    SELECTED_GYM: '@kiosk_selected_gym',
} as const;
