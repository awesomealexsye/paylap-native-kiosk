/**
 * Authentication Service - Login and OTP verification
 */

import { getLaravelUrl, config } from '../constants/config';
import {
    LoginRequest,
    LoginResponse,
    OTPVerifyRequest,
    OTPVerifyResponse,
    User,
    KioskPasscodeResponse,
} from '../types/auth';
import storageService from './storageService';

class AuthService {
    /**
     * Send login request with mobile number
     * Backend will send OTP via SMS
     */
    async login(mobile: string): Promise<LoginResponse> {
        try {
            const url = getLaravelUrl(config.laravel.loginEndpoint);
            const requestBody: LoginRequest = { mobile };

            console.log('🔐 Login API call:', url);
            console.log('📱 Mobile:', mobile);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
                },
                body: JSON.stringify(requestBody),
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

            // Get the text first to see what we're receiving
            const responseText = await response.text();
            console.log('📥 Response text (first 500 chars):', responseText.substring(0, 500));

            // Try to parse as JSON
            let data: LoginResponse;
            try {
                data = JSON.parse(responseText);
                console.log('📥 Parsed Login response:', data);
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                console.error('📄 Full response text:', responseText);
                return {
                    status: false,
                    message: 'Server returned invalid response. Please check server configuration.',
                };
            }

            return data;
        } catch (error) {
            console.error('❌ Login error:', error);
            return {
                status: false,
                message: 'Network error. Please check your connection.',
            };
        }
    }

    /**
     * Verify OTP and get auth token
     */
    async verifyOTP(mobile: string, otp: string): Promise<OTPVerifyResponse> {
        try {
            const url = getLaravelUrl(config.laravel.otpVerifyEndpoint);
            const requestBody: OTPVerifyRequest = { mobile, otp };

            console.log('🔐 OTP Verify API call:', url);
            console.log('📱 Mobile:', mobile, '| OTP:', otp);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
                },
                body: JSON.stringify(requestBody),
            });

            console.log('📡 Response status:', response.status);

            // Get the text first to see what we're receiving
            const responseText = await response.text();
            console.log('📥 Response text (first 500 chars):', responseText.substring(0, 500));

            // Try to parse as JSON
            let data: OTPVerifyResponse;
            try {
                data = JSON.parse(responseText);
                console.log('📥 Parsed OTP Verify response:', data);
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                console.error('📄 Full response text:', responseText);
                return {
                    status: false,
                    message: 'Server returned invalid response. Please check server configuration.',
                };
            }

            // If successful, save token and user data
            if (data.status && data.jwt_token && data.data) {
                await storageService.saveAuthToken(data.jwt_token);
                await storageService.saveUserData(data.data);
                console.log('✅ Auth data saved to storage');
            }

            return data;
        } catch (error) {
            console.error('❌ OTP verify error:', error);
            return {
                status: false,
                message: 'Network error. Please check your connection.',
            };
        }
    }

    /**
     * Get the kiosk passcode for the current authenticated user
     */
    async getKioskPasscode(): Promise<KioskPasscodeResponse> {
        try {
            const token = await this.getAuthToken();
            const user = await this.getCurrentUser();

            if (!token || !user) {
                return { status: false, kiosk_passcode: null };
            }

            // Using GET as per the curl example:
            // curl -G --location '${LARAVEL_SERVER_API_HOST}/api/user/kiosk-passcode'
            const baseUrl = getLaravelUrl(config.laravel.kioskPasscodeEndpoint);
            const url = `${baseUrl}?user_id=${user.id}&auth_key=${user.auth_key}`;

            console.log('🔐 Fetching Kiosk Passcode:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                },
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                return { status: false, kiosk_passcode: null };
            }

            const data = await response.json();
            console.log('📥 Kiosk Passcode response:', data);

            return data;
        } catch (error) {
            console.error('❌ Get kiosk passcode error:', error);
            return { status: false, kiosk_passcode: null };
        }
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        const token = await storageService.getAuthToken();
        const user = await storageService.getUserData();
        return !!(token && user);
    }

    /**
     * Get current user data from storage
     */
    async getCurrentUser(): Promise<User | null> {
        return await storageService.getUserData();
    }

    /**
     * Get current auth token from storage
     */
    async getAuthToken(): Promise<string | null> {
        return await storageService.getAuthToken();
    }

    /**
     * Logout - clear all auth data
     */
    async logout(): Promise<void> {
        await storageService.clearAuthData();
        console.log('👋 Logged out successfully');
    }

    /**
     * Validate phone number (client-side)
     * Must be exactly 10 digits
     */
    validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
        // Remove any non-digit characters
        const cleanPhone = phone.replace(/\D/g, '');

        if (cleanPhone.length === 0) {
            return { isValid: false, error: 'Phone number is required' };
        }

        if (cleanPhone.length !== 10) {
            return { isValid: false, error: 'Phone number must be exactly 10 digits' };
        }

        // Check if it starts with valid Indian mobile prefix (6-9)
        if (!/^[6-9]/.test(cleanPhone)) {
            return { isValid: false, error: 'Invalid phone number format' };
        }

        return { isValid: true };
    }

    /**
     * Validate OTP (client-side)
     * Must be exactly 4 digits
     */
    validateOTP(otp: string): { isValid: boolean; error?: string } {
        const cleanOTP = otp.replace(/\D/g, '');

        if (cleanOTP.length === 0) {
            return { isValid: false, error: 'OTP is required' };
        }

        if (cleanOTP.length !== 4) {
            return { isValid: false, error: 'OTP must be exactly 4 digits' };
        }

        return { isValid: true };
    }
}

export default new AuthService();
