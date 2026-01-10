/**
 * Face Verification Service - Python API integration
 */

import { getPythonUrl, config } from '../constants/config';
import * as FileSystem from 'expo-file-system/legacy';

interface MemberInfo {
    id: number;
    code: string;
    name: string;
    email: string | null;
    photo_url: string | null;
}

interface VerificationResult {
    success: boolean;
    access_granted: boolean;
    verification_method: string;
    member: MemberInfo | null;
    confidence: number | null;
    match_distance: number | null;
    timestamp: string;
    error: string | null;
    details: any | null;
}

class FaceVerificationService {
    /**
     * Convert image URI to base64
     */
    private async imageToBase64(uri: string): Promise<string> {
        try {
            // Use 'base64' string instead of EncodingType enum
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });
            return base64;
        } catch (error) {
            console.error('❌ Error converting image to base64:', error);
            throw new Error('Failed to convert image to base64');
        }
    }

    /**
     * Verify face from image
     */
    async verifyFace(imageUri: string): Promise<VerificationResult> {
        try {
            const url = getPythonUrl(config.python.verifyFaceEndpoint);

            console.log('📸 Face Verification API call:', url);
            console.log('🖼️  Image URI:', imageUri);

            // Convert image to base64
            const base64Image = await this.imageToBase64(imageUri);
            console.log('✅ Image converted to base64, length:', base64Image.length);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': config.python.apiKey,
                },
                body: JSON.stringify({
                    image: base64Image,
                }),
            });

            console.log('📡 Response status:', response.status);

            const responseText = await response.text();
            console.log('📥 Response text (first 500 chars):', responseText.substring(0, 500));

            let data: VerificationResult;
            try {
                data = JSON.parse(responseText);
                console.log('📥 Parsed Verification response:', data);
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                console.error('📄 Full response text:', responseText);
                return {
                    success: false,
                    access_granted: false,
                    verification_method: 'face',
                    member: null,
                    confidence: null,
                    match_distance: null,
                    timestamp: new Date().toISOString(),
                    error: 'Server returned invalid response',
                    details: null,
                };
            }

            return data;
        } catch (error) {
            console.error('❌ Face verification error:', error);
            return {
                success: false,
                access_granted: false,
                verification_method: 'face',
                member: null,
                confidence: null,
                match_distance: null,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Network error',
                details: null,
            };
        }
    }
}

export default new FaceVerificationService();
