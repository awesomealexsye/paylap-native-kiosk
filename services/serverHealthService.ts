/**
 * Server Health Check Utility
 * Checks if the relay server is running on localhost
 */

import { config, getRelayUrl } from '../constants/config';

export interface ServerHealthStatus {
    online: boolean;
    message: string;
    url?: string;
    error?: string;
}

/**
 * Check if relay server is accessible
 */
export const checkServerHealth = async (): Promise<ServerHealthStatus> => {
    // Try /status first as per config, fallback to /health
    const endpoints = ['/status', '/health'];
    let lastError = '';

    for (const endpoint of endpoints) {
        try {
            const healthUrl = getRelayUrl(endpoint);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(healthUrl, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return { online: true, message: 'Relay is Online', url: healthUrl };
            }
        } catch (error: any) {
            lastError = error.message;
        }
    }

    return { online: false, message: 'Relay Offline', error: lastError || 'Connection failed' };
};

/**
 * Check if Python API server is accessible
 */
export const checkPythonHealth = async (): Promise<ServerHealthStatus> => {
    // Try /api/health first, fallback to root /
    const endpoints = ['/api/health', '/'];
    let lastError = '';

    for (const endpoint of endpoints) {
        try {
            const baseUrl = config.python.baseUrl.replace(/\/$/, '');
            const healthUrl = endpoint === '/' ? baseUrl : `${baseUrl}${endpoint}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(healthUrl, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return { online: true, message: 'Python API is Online', url: healthUrl };
            }
        } catch (error: any) {
            lastError = error.message;
            console.log(`Python health check failed for ${endpoint}:`, error.message);
        }
    }

    return { online: false, message: 'Python API Offline', error: lastError || 'Connection failed' };
};

/**
 * Check if Laravel API server is accessible
 */
export const checkLaravelHealth = async (): Promise<ServerHealthStatus> => {
    // Laravel usually doesn't have /api/health by default. 
    // Try /api or root / which usually returns 200 or 401 (still means server is up)
    const endpoints = ['/api/health', '/api', '/'];
    let lastError = '';

    for (const endpoint of endpoints) {
        try {
            const baseUrl = config.laravel.baseUrl.replace(/\/$/, '');
            const healthUrl = endpoint === '/' ? baseUrl : `${baseUrl}${endpoint}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(healthUrl, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Even if it returns 401 or 404, if it's not a connection error, the server might be up.
            // But usually we want a success response for "Health".
            if (response.ok || response.status === 401) {
                return { online: true, message: 'Laravel API is Online', url: healthUrl };
            }
        } catch (error: any) {
            lastError = error.message;
            console.log(`Laravel health check failed for ${endpoint}:`, error.message);
        }
    }

    return { online: false, message: 'Laravel API Offline', error: lastError || 'Connection failed' };
};

/**
 * Get server configuration details
 * Used to display current settings
 */
export const getServerConfig = async () => {
    try {
        const configUrl = getRelayUrl('/config');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(configUrl, {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.log('Failed to get server config:', error);
        return null;
    }
};
