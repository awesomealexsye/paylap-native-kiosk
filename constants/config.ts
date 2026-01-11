/**
 * Configuration for Gym Kiosk App
 */

// Dynamic base URL - can be updated from settings
let currentRelayUrl = 'http://localhost:3000';

export const config = {
    // Laravel API Configuration
    laravel: {
        baseUrl: 'https://api.paylapfitness.com',
        loginEndpoint: '/api/auth/login',
        otpVerifyEndpoint: '/api/auth/otp-verify',
        gymListEndpoint: '/api/gym/list',
        memberListEndpoint: '/api/gym/members/list',
        kioskPasscodeEndpoint: '/api/user/kiosk-passcode',
        timeout: 10000, // 10 seconds
    },

    // Python Face Recognition API Configuration
    python: {
        // baseUrl: 'https://emil-prohibitive-stoically.ngrok-free.dev',
        baseUrl: 'https://pythonapi.paylapfitness.com',
        verifyFaceEndpoint: '/api/verify-face',
        syncMembersEndpoint: '/api/sync-members',
        cachedMembersEndpoint: '/api/debug/cache',
        timeout: 10000, // 10 seconds
    },

    // Local Relay Server Configuration (Offline - Local WiFi)
    relay: {
        // This IP should be configured per gym location
        // Can be set via QR code setup or settings screen
        get ip() {
            return currentRelayUrl.replace(/^https?:\/\//, '').split(':')[0];
        },
        port: 3000,
        unlockEndpoint: '/unlock',
        statusEndpoint: '/status',
        timeout: 10000, // Increased to 10 seconds to allow for slow WiFi relay connections
    },

    // Gym & Device Configuration
    // These will be set via QR code scan on first launch
    gym: {
        id: '', // e.g., "gym_12345"
        name: '', // e.g., "PayLap Fitness - Mumbai"
    },

    device: {
        id: '', // e.g., "kiosk_001"
        token: '', // Authentication token for API calls
    },

    // UI Configuration
    ui: {
        doorUnlockDuration: 3000, // 3 seconds
        welcomeMessageDuration: 5000, // 5 seconds
        cameraQuality: 0.7, // 0.7 for good balance of quality/size
    },
};

/**
 * Get relay server URL
 */
export const getRelayUrl = (endpoint: string) => {
    return `${currentRelayUrl}${endpoint}`;
};

/**
 * Get Laravel API URL
 */
export const getLaravelUrl = (endpoint: string) => {
    return `${config.laravel.baseUrl}${endpoint}`;
};

/**
 * Get Python API URL
 */
export const getPythonUrl = (endpoint: string) => {
    return `${config.python.baseUrl}${endpoint}`;
};

/**
 * Update relay base URL dynamically
 * Used from settings screen
 */
export const updateBaseUrl = (newUrl: string) => {
    // Remove trailing slash if present
    currentRelayUrl = newUrl.replace(/\/$/, '');
    console.log('✅ Relay URL updated to:', currentRelayUrl);
};

/**
 * Get current relay base URL
 */
export const getCurrentRelayUrl = () => {
    return currentRelayUrl;
};
