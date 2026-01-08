/**
 * Face Verification Service - Communicates with VPS for face recognition
 * Sends captured images to Laravel API + Python face recognition
 */

import axios from 'axios';
import { config, getVpsUrl } from '../constants/config';

export interface FaceVerificationRequest {
    image: string; // Base64 encoded image
    gymId: string;
    deviceId: string;
}

export interface FaceVerificationResponse {
    access_granted: boolean;
    member_name?: string;
    member_id?: number;
    message: string;
    confidence?: number;
}

/**
 * Verify face with VPS backend
 * Sends image to Laravel API which calls Python face recognition service
 */
export const verifyFace = async (
    imageBase64: string
): Promise<FaceVerificationResponse> => {
    try {
        const url = getVpsUrl(config.vps.verifyFaceEndpoint);
        console.log('🔍 Verifying face with VPS...');

        const payload: FaceVerificationRequest = {
            image: imageBase64,
            gymId: config.gym.id,
            deviceId: config.device.id,
        };

        const response = await axios.post<FaceVerificationResponse>(
            url,
            payload,
            {
                timeout: config.vps.timeout,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.device.token}`,
                },
            }
        );

        console.log('✅ Face verification result:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Face verification failed:', error.message);

        // Return denied response on error
        return {
            access_granted: false,
            message: error.response?.data?.message || 'Verification failed. Please try again.',
        };
    }
};
