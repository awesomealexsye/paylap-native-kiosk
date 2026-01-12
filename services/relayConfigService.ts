/**
 * Relay Config Service
 * Handles updating relay device configuration via API
 */

import { getRelayUrl } from '../constants/config';

export interface RelayConfig {
    device_id?: string;
    local_key?: string;
    local_ip?: string;
}

export interface RelayConfigResponse {
    success: boolean;
    message?: string;
    config?: {
        device_id: string;
        local_key: string;
        local_ip: string;
        version: string;
    };
    reconnecting?: boolean;
    error?: string;
    errors?: string[];
}

/**
 * Update relay device configuration
 */
export async function updateRelayConfig(config: RelayConfig): Promise<RelayConfigResponse> {
    try {
        const url = getRelayUrl('/config');

        console.log('🔧 Updating relay config:', url);

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('❌ Server returned non-JSON response:', contentType);
            const text = await response.text();
            console.error('Response body:', text.substring(0, 200));

            return {
                success: false,
                error: 'Relay server is not responding correctly. Please check if the Node.js server is running at ' + url
            };
        }

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Server returned error:', response.status, data);
        }

        return data;
    } catch (error: any) {
        console.error('❌ Failed to update relay config:', error);

        // Handle specific error types
        if (error.name === 'AbortError' || error.message?.includes('timeout')) {
            return {
                success: false,
                error: 'Request timeout. Please check if the relay server is running.'
            };
        }

        if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
            return {
                success: false,
                error: 'Cannot connect to relay server. Please verify the server URL in settings and ensure the Node.js server is running.'
            };
        }

        if (error.message?.includes('JSON Parse')) {
            return {
                success: false,
                error: 'Relay server returned invalid response. The server may not be running or the endpoint may not exist.'
            };
        }

        return {
            success: false,
            error: error.message || 'Network error. Please check if the relay server is running.'
        };
    }
}

