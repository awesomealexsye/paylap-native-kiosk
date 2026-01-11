/**
 * Sync Service - Handles member synchronization with Python API
 */

import { getPythonUrl, config } from '../constants/config';

export interface CachedMember {
    id: number;
    name: string;
    gym_id: number;
    has_encoding: boolean;
}

export interface CacheStatusResponse {
    count: number;
    last_sync_time: string | null;
    members: CachedMember[];
}

export interface SyncResponse {
    success: boolean;
    members_synced: number;
    timestamp: string;
    message: string;
    error?: string;
}

class SyncService {
    /**
     * Trigger manual member sync on Python server
     */
    async syncMembers(token: string, gymId?: number): Promise<SyncResponse> {
        try {
            let url = getPythonUrl(config.python.syncMembersEndpoint);
            if (gymId) {
                url += `?gym_id=${gymId}`;
            }
            console.log('🔄 Triggering Member Sync:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    members_synced: 0,
                    timestamp: new Date().toISOString(),
                    message: 'Sync failed',
                    error: `Server error: ${response.status} ${errorText}`
                };
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Sync error:', error);
            return {
                success: false,
                members_synced: 0,
                timestamp: new Date().toISOString(),
                message: 'Network error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get list of currently cached members from Python server
     */
    async getCachedMembers(token: string, gymId?: number): Promise<CacheStatusResponse> {
        try {
            let url = getPythonUrl(config.python.cachedMembersEndpoint);
            if (gymId) {
                url += `?gym_id=${gymId}`;
            }
            console.log('📊 Fetching Cached Members:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });


            if (!response.ok) {
                throw new Error(`Failed to fetch cache status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Get cache error:', error);
            return {
                count: 0,
                last_sync_time: null,
                members: []
            };
        }
    }
}

export default new SyncService();
