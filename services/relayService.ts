/**
 * Relay Service - Controls magnetic door lock via local HTTP server
 * Works 100% offline on local WiFi network
 */

import axios from 'axios';
import { config, getRelayUrl } from '../constants/config';

export interface RelayResponse {
    success: boolean;
    message: string;
    error?: string;
}

export interface RelayStatus {
    status: string;
    relay?: string;
}

/**
 * Unlock the door via relay
 * Sends HTTP POST to local relay server
 * Server handles auto-locking automatically
 */
export const unlockDoor = async (): Promise<RelayResponse> => {
    try {
        const url = getRelayUrl(config.relay.unlockEndpoint);
        console.log('🔓 Unlocking door via:', url);

        const response = await axios.post<RelayResponse>(
            url,
            {},
            { timeout: config.relay.timeout }
        );

        console.log('✅ Relay response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Relay unlock failed:', error.message);
        return {
            success: false,
            message: 'Failed to unlock door',
            error: error.message,
        };
    }
};

/**
 * Check relay server status
 * Used to verify relay server is accessible before attempting unlock
 */
export const checkRelayStatus = async (): Promise<RelayStatus | null> => {
    try {
        const url = getRelayUrl(config.relay.statusEndpoint);
        const response = await axios.get<RelayStatus>(url, {
            timeout: config.relay.timeout,
        });

        console.log('📡 Relay status:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Relay status check failed:', error.message);
        return null;
    }
};
