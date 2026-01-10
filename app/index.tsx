import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { unlockDoor } from '../services/relayService';
import { checkServerHealth } from '../services/serverHealthService';
import ServerOfflineModal from '../components/ServerOfflineModal';
import { useAuth } from '../contexts/AuthContext';
import faceVerificationService from '../services/faceVerificationService';

export default function KioskScreen() {
    const { isLoading, isAuthenticated, selectedGym } = useAuth();
    const [permission, requestPermission] = useCameraPermissions();
    const [isProcessing, setIsProcessing] = useState(false);
    const [serverOfflineVisible, setServerOfflineVisible] = useState(false);
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    // Check authentication on mount
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            // Not authenticated, redirect to login
            router.replace('/login');
        }
    }, [isLoading, isAuthenticated]);

    // Check server health on mount
    useEffect(() => {
        if (isAuthenticated) {
            checkServer();
        }
    }, [isAuthenticated]);

    const checkServer = async () => {
        const health = await checkServerHealth();
        if (!health.online) {
            console.log('⚠️  Server is offline');
            setTimeout(() => setServerOfflineVisible(true), 1000);
        }
    };

    // Request camera permission if not granted
    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Camera permission required</Text>
                    <TouchableOpacity style={styles.button} onPress={requestPermission}>
                        <Text style={styles.buttonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleCaptureFace = async () => {
        if (!cameraRef.current) return;

        setIsProcessing(true);

        try {
            // Capture photo from camera
            const photo = await cameraRef.current.takePictureAsync({
                base64: false,
                quality: 0.8,
            });

            if (!photo || !photo.uri) {
                Alert.alert('Error', 'Failed to capture photo');
                return;
            }

            console.log('📸 Photo captured:', photo.uri);

            // Step 1: Verify face with Python API
            const result = await faceVerificationService.verifyFace(photo.uri);

            console.log('🎯 Verification result:', result);

            // Show result modal
            setVerificationResult(result);
            setShowResultModal(true);

            // Auto-dismiss after 3 seconds
            setTimeout(() => {
                setShowResultModal(false);
            }, 3000);

            // Step 2: If access granted, unlock door via relay
            if (result.access_granted && result.success) {
                console.log('✅ Access granted! Unlocking door...');

                const relayResult = await unlockDoor();

                if (!relayResult.success) {
                    console.error('❌ Door unlock failed:', relayResult.error);
                    // Still show success for face verification
                }
            } else {
                console.log('❌ Access denied:', result.error);
            }
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
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.title}>Face Check-In</Text>
                        {selectedGym && (
                            <Text style={styles.gymName}>📍 {selectedGym.name}</Text>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            if (isAuthenticated) {
                                router.push('/dashboard');
                            } else {
                                router.push('/login');
                            }
                        }}
                    >
                        <Text style={styles.actionButtonIcon}>
                            {isAuthenticated ? '🏠' : '🔐'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>Position your face in the camera</Text>
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
                        <Text style={styles.loadingText}>Verifying face...</Text>
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

            {/* Server Offline Modal */}
            <ServerOfflineModal
                visible={serverOfflineVisible}
                onViewInstructions={() => router.push('/setup')}
                onClose={() => setServerOfflineVisible(false)}
            />

            {/* Verification Result Modal */}
            <Modal
                visible={showResultModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowResultModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {verificationResult?.access_granted ? (
                            <>
                                <Text style={styles.modalIcon}>✅</Text>
                                <Text style={styles.modalTitle}>Access Granted!</Text>
                                <Text style={styles.modalMessage}>
                                    Welcome, {verificationResult.member?.name || 'Member'}
                                </Text>
                                {verificationResult.member?.code && (
                                    <Text style={styles.modalDetail}>
                                        Code: {verificationResult.member.code}
                                    </Text>
                                )}
                                {verificationResult.confidence && (
                                    <Text style={styles.modalDetail}>
                                        Confidence: {verificationResult.confidence.toFixed(1)}%
                                    </Text>
                                )}
                            </>
                        ) : (
                            <>
                                <Text style={styles.modalIcon}>❌</Text>
                                <Text style={styles.modalTitle}>Access Denied</Text>
                                <Text style={styles.modalMessage}>
                                    {verificationResult?.error || 'Face not recognized'}
                                </Text>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 16,
    },
    header: {
        padding: 24,
        paddingBottom: 16,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    actionButton: {
        width: 48,
        height: 48,
        backgroundColor: '#252525',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    actionButtonIcon: {
        fontSize: 24,
    },
    settingsButton: {
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    gymName: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 14,
        color: '#aaa',
    },
    cameraContainer: {
        flex: 1,
        marginHorizontal: 24,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    camera: {
        flex: 1,
    },
    footer: {
        padding: 24,
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginTop: 16,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    captureButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    captureButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 40,
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#252525',
    },
    modalIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 18,
        color: '#aaa',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalDetail: {
        fontSize: 14,
        color: '#4CAF50',
        marginTop: 8,
    },
});
