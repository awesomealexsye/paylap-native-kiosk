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
 * Returns true if server is reachable, false otherwise
 */
export const checkServerHealth = async (): Promise<ServerHealthStatus> => {
    try {
        const healthUrl = getRelayUrl('/health');
        console.log('🏥 Checking server health:', healthUrl);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(healthUrl, {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Server is online:', data);

            return {
                online: true,
                message: 'Relay server is running',
                url: healthUrl,
            };
        } else {
            return {
                online: false,
                message: 'Server responded with error',
                error: `HTTP ${response.status}`,
            };
        }
    } catch (error: any) {
        console.log('❌ Server health check failed:', error.message);

        return {
            online: false,
            message: 'Relay server is not reachable',
            error: error.message || 'Connection failed',
        };
    }
};

/**
 * Get server configuration details
 * Used to display current settings
 */
export const getServerConfig = async () => {
    try {
        const configUrl = getRelayUrl('/config');
        const response = await fetch(configUrl, {
            method: 'GET',
            timeout: 5000,
        });

        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.log('Failed to get server config:', error);
        return null;
    }
};
