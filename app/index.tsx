/**
 * Main Kiosk Screen - Camera and Face Verification
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { verifyFace } from '../services/faceVerifyService';
import { unlockDoor } from '../services/relayService';
import { checkServerHealth } from '../services/serverHealthService';
import ServerOfflineModal from '../components/ServerOfflineModal';

export default function KioskScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [isProcessing, setIsProcessing] = useState(false);
    const [serverOfflineVisible, setServerOfflineVisible] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    // Check server health on mount
    useEffect(() => {
        checkServer();
    }, []);

    const checkServer = async () => {
        const health = await checkServerHealth();
        if (!health.online) {
            console.log('⚠️  Server is offline');
            setTimeout(() => setServerOfflineVisible(true), 1000);
        }
    };

    // Request camera permission if not granted
    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>
                        Camera access is required for face verification
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={requestPermission}>
                        <Text style={styles.buttonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const handleCaptureFace = async () => {
        if (!cameraRef.current || isProcessing) return;

        try {
            setIsProcessing(true);

            // Capture photo
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                base64: true,
            });

            if (!photo || !photo.base64) {
                Alert.alert('Error', 'Failed to capture image');
                return;
            }

            console.log('📸 Image captured');

            // For testing: Skip VPS verification, directly unlock door
            // TODO: Implement VPS face verification when Laravel + Python backend is ready
            console.log('🔓 Testing relay unlock...');
            const relayResult = await unlockDoor();

            if (relayResult.success) {
                // Navigate to welcome screen
                router.push({
                    pathname: '/welcome',
                    params: {
                        memberName: 'Test User',
                    },
                });
            } else {
                Alert.alert(
                    'Door Control Error',
                    relayResult.error || 'Failed to unlock door. Please check relay server.'
                );
            }

            // Uncomment below when VPS is ready:
            /*
            // Step 1: Verify face with VPS
            const verificationResult = await verifyFace(photo.base64);

            if (verificationResult.access_granted) {
                // Step 2: Unlock door via relay (offline)
                console.log('✅ Access granted! Unlocking door...');
                const relayResult = await unlockDoor();

                if (relayResult.success) {
                    // Navigate to welcome screen
                    router.push({
                        pathname: '/welcome',
                        params: {
                            memberName: verificationResult.member_name || 'Member',
                        },
                    });
                } else {
                    Alert.alert(
                        'Door Control Error',
                        'Face verified but door unlock failed. Please contact staff.'
                    );
                }
            } else {
                // Access denied
                Alert.alert('Access Denied', verificationResult.message);
            }
            */
        } catch (error: any) {
            console.error('❌ Error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Gym Check-In</Text>
                <Text style={styles.subtitle}>Position your face in the camera</Text>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => router.push('/settings')}
                >
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing="front"
                />
            </View>

            <View style={styles.footer}>
                {isProcessing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.loadingText}>Unlocking door...</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={handleCaptureFace}
                    >
                        <Text style={styles.captureButtonText}>Scan Face</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ServerOfflineModal
                visible={serverOfflineVisible}
                onClose={() => setServerOfflineVisible(false)}
                onViewInstructions={() => {
                    setServerOfflineVisible(false);
                    router.push('/setup');
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    header: {
        padding: 24,
        alignItems: 'center',
        position: 'relative',
    },
    settingsButton: {
        position: 'absolute',
        top: 24,
        right: 24,
        width: 44,
        height: 44,
        backgroundColor: '#252525',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    settingsIcon: {
        fontSize: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
    },
    cameraContainer: {
        flex: 1,
        margin: 20,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    captureButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 48,
        paddingVertical: 20,
        borderRadius: 50,
        minWidth: 200,
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    captureButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 12,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    permissionText: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
