/**
 * User Service - Fetch user profile information
 */

import { getLaravelUrl } from '../constants/config';
import config from '../constants/config';
import { User } from '../types/auth';

interface UserInfoResponse {
    status: boolean;
    message: string;
    data?: User;
}

class UserService {
    /**
     * Fetch user profile information
     */
    async fetchUserInfo(userId: number, token: string, authKey: string): Promise<UserInfoResponse> {
        try {
            const url = getLaravelUrl('/api/user/info');
            const requestBody = {
                user_id: userId,
                auth_key: authKey,
            };

            console.log('👤 User Info API call:', url);
            console.log('🆔 User ID:', userId);

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

            const responseText = await response.text();
            console.log('📥 Response text (first 500 chars):', responseText.substring(0, 500));

            let data: UserInfoResponse;
            try {
                data = JSON.parse(responseText);
                console.log('📥 Parsed User Info response:', data);
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                console.error('📄 Full response text:', responseText);
                return {
                    status: false,
                    message: 'Server returned invalid response',
                };
            }

            return data;
        } catch (error) {
            console.error('❌ User info fetch error:', error);
            return {
                status: false,
                message: 'Network error. Please check your connection.',
            };
        }
    }
}

export default new UserService();
