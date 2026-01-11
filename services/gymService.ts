/**
 * Gym Service - Fetch and manage gym data
 */

import { getLaravelUrl, config } from '../constants/config';
import { GymListRequest, GymListResponse, Gym, MemberListResponse } from '../types/auth';
import storageService from './storageService';

class GymService {
    /**
     * Fetch list of gyms for a user
     * Requires: Authorization header with Bearer token AND auth_key in body
     */
    async fetchGymList(userId: number, token: string, authKey: string): Promise<GymListResponse> {
        try {
            const url = getLaravelUrl(config.laravel.gymListEndpoint);
            const requestBody = {
                user_id: userId,
                auth_key: authKey
            };

            console.log('🏋️ Gym List API call:', url);
            console.log('👤 User ID:', userId);
            console.log('🔑 Auth Key:', authKey);
            console.log('🎫 Token:', token);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify(requestBody),
            });

            console.log('📡 Response status:', response.status);

            // Get the text first to see what we're receiving
            const responseText = await response.text();
            console.log('📥 Response text (first 500 chars):', responseText.substring(0, 500));

            // Try to parse as JSON
            let data: GymListResponse;
            try {
                data = JSON.parse(responseText);
                console.log('📥 Parsed Gym List response:', data);
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
            console.error('❌ Gym list fetch error:', error);
            return {
                status: false,
                message: 'Network error. Please check your connection.',
            };
        }
    }

    /**
     * Save selected gym to storage
     */
    async saveSelectedGym(gym: Gym): Promise<void> {
        await storageService.saveSelectedGym(gym);
        console.log('✅ Selected gym saved:', gym.name);
    }

    /**
     * Get selected gym from storage
     */
    async getSelectedGym(): Promise<Gym | null> {
        return await storageService.getSelectedGym();
    }

    /**
     * Clear selected gym from storage
     */
    async clearSelectedGym(): Promise<void> {
        await storageService.removeSelectedGym();
        console.log('🗑️ Selected gym cleared');
    }

    /**
     * Fetch list of members for a gym
     */
    async fetchMembers(gymId: number, userId: number, token: string, authKey: string): Promise<MemberListResponse> {
        try {
            const url = getLaravelUrl(config.laravel.memberListEndpoint);
            const requestBody = {
                gym_id: gymId,
                user_id: userId,
                auth_key: authKey
            };

            console.log('👥 Fetch Members API call:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify(requestBody),
            });

            const data: MemberListResponse = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Fetch members error:', error);
            return {
                status: false,
                message: 'Failed to fetch members.',
            };
        }
    }
}

export default new GymService();
