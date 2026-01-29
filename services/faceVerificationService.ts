/**
 * Face Verification Service - Python API integration
 */

import { getPythonUrl, config } from '../constants/config';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

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
     * Resize and compress image for optimal upload speed
     * Recommended: 640x480 or 800x600 is sufficient for face recognition
     */
    private async optimizeImage(uri: string): Promise<string> {
        try {
            const { maxWidth, maxHeight, quality } = config.imageOptimization;
            const optimizeStartTime = Date.now();

            const manipulatedImage = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: maxWidth } }],
                { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
            );

            const optimizeDuration = Date.now() - optimizeStartTime;

            return manipulatedImage.uri;
        } catch (error) {
            console.error('❌ Error optimizing image:', error);
            console.warn('⚠️  Falling back to original image');
            return uri; // Fallback to original if optimization fails
        }
    }

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
     * Image optimization is controlled by config.imageOptimization.enabled
     */
    async verifyFace(imageUri: string, gymId: number, token: string): Promise<VerificationResult> {
        const serviceStartTime = Date.now();
        const optimize = config.imageOptimization.enabled;

        try {
            const url = getPythonUrl(config.python.verifyFaceEndpoint);

            let processedImageUri = imageUri;
            let optimizeDuration = 0;

            // Step 0: Optimize image (if enabled)
            if (optimize) {
                const optimizeStartTime = Date.now();

                processedImageUri = await this.optimizeImage(imageUri);

                optimizeDuration = Date.now() - optimizeStartTime;
            }

            // Step 1: Convert image to base64
            const base64StartTime = Date.now();

            const base64Image = await this.imageToBase64(processedImageUri);

            const base64EndTime = Date.now();
            const base64Duration = base64EndTime - base64StartTime;
            const base64SizeKB = (base64Image.length / 1024).toFixed(2);
            const base64SizeMB = (base64Image.length / (1024 * 1024)).toFixed(2);


            // Step 2: Send API request
            const apiRequestStartTime = Date.now();

            const requestBody = JSON.stringify({
                image: base64Image,
                gym_id: gymId,
            });

            const payloadSizeKB = (requestBody.length / 1024).toFixed(2);
            const payloadSizeMB = (requestBody.length / (1024 * 1024)).toFixed(2);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: requestBody,
            });

            const apiRequestEndTime = Date.now();
            const apiRequestDuration = apiRequestEndTime - apiRequestStartTime;

            // Calculate upload speed
            const uploadSpeedKBps = (requestBody.length / 1024) / (apiRequestDuration / 1000);
            const uploadSpeedMBps = uploadSpeedKBps / 1024;

            // Step 3: Parse response
            const parseStartTime = Date.now();

            const responseText = await response.text();

            const parseEndTime = Date.now();
            const parseDuration = parseEndTime - parseStartTime;

            let data: VerificationResult;
            try {
                const jsonParseStartTime = Date.now();
                data = JSON.parse(responseText);
                const jsonParseDuration = Date.now() - jsonParseStartTime;

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

            // Total service time
            const serviceEndTime = Date.now();
            const totalServiceDuration = serviceEndTime - serviceStartTime;

           
            console.log('============================================\n');

            return data;
        } catch (error) {
            const serviceEndTime = Date.now();
            const totalServiceDuration = serviceEndTime - serviceStartTime;

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
