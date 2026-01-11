import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { unlockDoor } from '../services/relayService';
import { useAuth } from '../contexts/AuthContext';
import faceVerificationService from '../services/faceVerificationService';
import { PasscodeModal } from '../components/PasscodeModal';

const { width } = Dimensions.get('window');

type ModalState = 'idle' | 'scanning' | 'unlocking' | 'success' | 'error';

export default function KioskScreen() {
    const { isLoading, isAuthenticated, selectedGym, token } = useAuth();
    const [permission, requestPermission] = useCameraPermissions();
    const [modalState, setModalState] = useState<ModalState>('idle');
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [showPasscodeModal, setShowPasscodeModal] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    // Check authentication on mount
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isLoading, isAuthenticated]);

    if (!permission) return <View />;

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

        if (!selectedGym || !token) {
            console.error('❌ Missing Gym ID or Auth Token');
            return;
        }

        // Start scanning
        setModalState('scanning');
        setShowModal(true);
        setVerificationResult(null);

        try {
            // 1. Capture photo
            const photo = await cameraRef.current.takePictureAsync({
                base64: false,
                quality: 0.7,
            });

            if (!photo || !photo.uri) {
                setModalState('error');
                setVerificationResult({ error: 'Failed to capture photo' });
                return;
            }

            // 2. Verify with Python API (Passing gym_id and token)
            const result = await faceVerificationService.verifyFace(photo.uri, selectedGym.id, token);
            setVerificationResult(result);

            if (result.access_granted && result.success) {
                // 3. Move to Unlocking stage (Showing "Please wait for door to open")
                setModalState('unlocking');
                console.log('✅ Access granted! Unlocking door...');

                const relayResult = await unlockDoor();

                if (relayResult.success) {
                    // 4. Success state (The door is now open)
                    setModalState('success');
                } else {
                    // 5. Door unlock fail (but face matched)
                    console.error('❌ Door unlock failed:', relayResult.error);
                    setModalState('error');
                    setVerificationResult({
                        ...result,
                        error: 'Door Open Failed. Please try again or contact staff.'
                    });
                }

                // Close modal after showing status for a bit
                setTimeout(() => {
                    setShowModal(false);
                    setModalState('idle');
                }, 4000);
            } else {
                setModalState('error');
                setTimeout(() => {
                    setShowModal(false);
                    setModalState('idle');
                }, 3000);
            }
        } catch (error: any) {
            console.error('❌ Process error:', error);
            setModalState('error');
            setVerificationResult({ error: 'System error. Please try again.' });
            setTimeout(() => {
                setShowModal(false);
                setModalState('idle');
            }, 3000);
        }
    };

    const handleActionPress = () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        setShowPasscodeModal(true);
    };

    const handlePasscodeSuccess = () => {
        setShowPasscodeModal(false);
        router.push('/dashboard');
    };

    const renderModalContent = () => {
        switch (modalState) {
            case 'scanning':
                return (
                    <>
                        <View style={styles.scannerCircle}>
                            <ActivityIndicator size="large" color="#4CAF50" />
                        </View>
                        <Text style={styles.modalTitle}>Searching...</Text>
                        <Text style={styles.modalMessage}>Please wait while we verify your identity...</Text>
                    </>
                );
            case 'unlocking':
                return (
                    <>
                        <View style={styles.scannerCircle}>
                            <ActivityIndicator size="large" color="#4CAF50" />
                        </View>
                        <Text style={styles.modalTitle}>Face Recognized!</Text>
                        <Text style={[styles.modalMessage, { color: '#4CAF50' }]}>
                            Welcome, {verificationResult?.member?.name}!
                        </Text>
                        <Text style={styles.modalDetail}>Please wait for door to open...</Text>
                    </>
                );
            case 'success':
                return (
                    <>
                        <View style={[styles.scannerCircle, { borderColor: '#4CAF50' }]}>
                            <Text style={styles.hugeIcon}>✅</Text>
                        </View>
                        <Text style={[styles.modalTitle, { color: '#4CAF50' }]}>Door is Open</Text>
                        <Text style={styles.modalMessage}>You may now enter the gym.</Text>
                        <Text style={styles.modalDetail}>Have a great workout!</Text>
                    </>
                );
            case 'error':
                return (
                    <>
                        <View style={[styles.scannerCircle, { borderColor: '#FF5252' }]}>
                            <Text style={styles.hugeIcon}>❌</Text>
                        </View>
                        <Text style={[styles.modalTitle, { color: '#FF5252' }]}>Access Denied</Text>
                        <Text style={styles.modalMessage}>
                            {verificationResult?.error || 'Face not recognized'}
                        </Text>
                        <Text style={styles.modalDetail}>Please try again.</Text>
                    </>
                );
            default:
                return null;
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
                        onPress={handleActionPress}
                    >
                        <Text style={styles.actionButtonIcon}>
                            {isAuthenticated ? '🏠' : '🔐'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>Position your face in the camera frame</Text>
            </View>

            <View style={styles.cameraFrame}>
                <View style={styles.cameraContainer}>
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        facing="front"
                    />
                    <View style={styles.faceOverlay}>
                        <View style={styles.faceGuide} />
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.captureButton}
                    onPress={handleCaptureFace}
                    disabled={modalState !== 'idle'}
                >
                    <Text style={styles.captureButtonText}>
                        {modalState === 'idle' ? 'Scan My Face' : 'Checking...'}
                    </Text>
                </TouchableOpacity>
            </View>



            {/* Unified Verification Modal */}
            <Modal
                visible={showModal}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {renderModalContent()}
                    </View>
                </View>
            </Modal>

            <PasscodeModal
                visible={showPasscodeModal}
                onClose={() => setShowPasscodeModal(false)}
                onSuccess={handlePasscodeSuccess}
            />
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
        backgroundColor: '#1f1f1f',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    actionButtonIcon: {
        fontSize: 22,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    gymName: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
        marginTop: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#888',
        marginTop: 4,
    },
    cameraFrame: {
        flex: 1,
        paddingHorizontal: 24,
    },
    cameraContainer: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        borderWidth: 2,
        borderColor: '#333',
    },
    camera: {
        flex: 1,
    },
    faceOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceGuide: {
        width: width * 0.75, // Increased width from 0.6
        height: width * 0.9, // Increased height from 0.8
        borderRadius: 30,    // Made it more of a rounded rectangle than an oval
        borderWidth: 3,     // Slightly thicker line
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderStyle: 'dashed',
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
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    captureButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 30,
        padding: 40,
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    scannerCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    hugeIcon: {
        fontSize: 48,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        color: '#aaa',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 24,
    },
    modalDetail: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
