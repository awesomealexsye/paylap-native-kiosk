import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    Dimensions,
    Image,
    BackHandler,
    Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { unlockDoor } from '../services/relayService';
import { useAuth } from '../contexts/AuthContext';
import faceVerificationService from '../services/faceVerificationService';
import { PasscodeModal } from '../components/PasscodeModal';
import { SystemDiagnosticsModal } from '../components/SystemDiagnosticsModal';
import { KIOSK_CONFIG } from '../constants/config';
import { useKioskSettings } from '../contexts/KioskSettingsContext';

const { width } = Dimensions.get('window');

type ModalState = 'idle' | 'scanning' | 'unlocking' | 'success' | 'error';

export default function KioskScreen() {
    const { isLoading: authLoading, isAuthenticated, selectedGym, token } = useAuth();
    const { isRelayEnabled, isLoading: settingsLoading } = useKioskSettings();
    const [permission, requestPermission] = useCameraPermissions();
    const [modalState, setModalState] = useState<ModalState>('idle');
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [showPasscodeModal, setShowPasscodeModal] = useState(false);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    const [showExitPasscodeModal, setShowExitPasscodeModal] = useState(false);
    const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
    const [verificationTime, setVerificationTime] = useState(0);
    const cameraRef = useRef<CameraView>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Check authentication on mount
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [authLoading, isAuthenticated]);

    // Block back button ONLY on kiosk screen (index.tsx)
    useEffect(() => {
        if (!KIOSK_CONFIG.enabled || !KIOSK_CONFIG.blockBackButton) {
            return;
        }

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
                // Show passcode modal to exit kiosk (same passcode as dashboard)
                setShowExitPasscodeModal(true);
                return true; // Prevent default back button behavior
            }
        );

        return () => backHandler.remove();
    }, []);

    // Timer for face verification
    useEffect(() => {
        if (modalState === 'scanning') {
            // Reset and start timer
            setVerificationTime(0);
            timerIntervalRef.current = setInterval(() => {
                setVerificationTime(prev => prev + 1);
            }, 1000);
        } else {
            // Stop timer when not scanning
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }

        // Cleanup on unmount
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [modalState]);

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

    if (authLoading || settingsLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const unlockDoorWithRetry = async (maxAttempts = 3): Promise<{ success: boolean; error?: string }> => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`🚪 Attempting to unlock door (${attempt}/${maxAttempts})...`);
            const attemptStartTime = Date.now();

            const relayResult = await unlockDoor();

            const attemptDuration = Date.now() - attemptStartTime;

            if (relayResult.success) {
                console.log(`✅ Door unlocked successfully on attempt ${attempt}`);
                return { success: true };
            }

            console.warn(`⚠️ Door unlock attempt ${attempt} failed:`, relayResult.error);

            // If not the last attempt, wait a bit before retrying
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between retries
            }
        }

        console.error(`❌ All ${maxAttempts} door unlock attempts failed`);
        return { success: false, error: 'Failed to unlock door after multiple attempts' };
    };

    const handleCaptureFace = async () => {
        if (!cameraRef.current) return;

        if (!selectedGym || !token) {
            console.error('❌ Missing Gym ID or Auth Token');
            return;
        }

        // ============ PERFORMANCE TRACKING START ============
        const processStartTime = Date.now();

        // Start scanning
        setModalState('scanning');
        setShowModal(true);
        setVerificationResult(null);

        try {
            // ============ STEP 1: CAPTURE PHOTO ============
            const captureStartTime = Date.now();

            const photo = await cameraRef.current.takePictureAsync({
                base64: false,
                quality: 0.7,
            });

            const captureEndTime = Date.now();
            const captureDuration = captureEndTime - captureStartTime;

            if (!photo || !photo.uri) {
                console.error('❌ Photo capture failed!');
                console.log(`⏱️  Failed after: ${captureDuration}ms (${(captureDuration / 1000).toFixed(3)}s)\n`);
                setModalState('error');
                setVerificationResult({ error: 'Failed to capture photo' });
                return;
            }
            // Store captured image to show instead of camera
            setCapturedImageUri(photo.uri);

            // ============ STEP 2: FACE VERIFICATION ============
            const verificationStartTime = Date.now();

            const result = await faceVerificationService.verifyFace(photo.uri, selectedGym.id, token);

            const verificationEndTime = Date.now();
            const verificationDuration = verificationEndTime - verificationStartTime;
            setVerificationResult(result);

            if (result.access_granted && result.success) {
                if (isRelayEnabled) {
                    // ============ STEP 3: UNLOCK DOOR (RELAY) ============
                    setModalState('unlocking');
                    console.log('\n🚪 Step 3: Unlocking door via relay...');
                    const relayStartTime = Date.now();

                    // Try to unlock door with retry (up to 3 attempts)
                    const relayResult = await unlockDoorWithRetry(3);

                    const relayEndTime = Date.now();
                    const relayDuration = relayEndTime - relayStartTime;

                    if (relayResult.success) {
                        // 4. Success state (The door is now open)
                        setModalState('success');

                        // ============ TOTAL SUCCESS SUMMARY ============
                        const totalProcessTime = Date.now() - processStartTime;
                    } else {
                        // 5. Door unlock fail (but face matched)
                        console.error('❌ Door unlock failed after retries:', relayResult.error);
                        setModalState('error');
                        setVerificationResult({
                            ...result,
                            error: 'Door Open Failed after multiple attempts. Please contact staff.'
                        });

                        const totalProcessTime = Date.now() - processStartTime;
                        console.log(`\n❌ Process failed after: ${totalProcessTime}ms (${(totalProcessTime / 1000).toFixed(3)}s)\n`);
                    }
                } else {
                    // Skip relay, just show success
                    console.log('✅ Access granted! (Relay disabled - skipping door unlock)');
                    setModalState('success');

                    // ============ TOTAL SUCCESS SUMMARY (NO RELAY) ============
                    const totalProcessTime = Date.now() - processStartTime;
                }

                // Close modal after showing status for a bit
                setTimeout(() => {
                    setShowModal(false);
                    setModalState('idle');
                    setCapturedImageUri(null); // Clear captured image
                }, 4000);
            } else {
                // ============ VERIFICATION FAILED ============
                console.error('❌ Face verification failed!');
                console.error(`   └─ Error: ${result.error || 'Face not recognized'}`);

                const totalProcessTime = Date.now() - processStartTime;

                setModalState('error');
                setTimeout(() => {
                    setShowModal(false);
                    setModalState('idle');
                    setCapturedImageUri(null); // Clear captured image
                }, 3000);
            }
        } catch (error: any) {
            // ============ UNEXPECTED ERROR ============
            setModalState('error');
            setVerificationResult({ error: 'System error. Please try again.' });
            setTimeout(() => {
                setShowModal(false);
                setModalState('idle');
                setCapturedImageUri(null); // Clear captured image
            }, 3000);
        }
    };

    const handleCaptureAgain = () => {
        setCapturedImageUri(null);
        setModalState('idle');
        setShowModal(false);
        setVerificationResult(null);
    };

    const handleActionPress = () => {
        if (isAuthenticated) {
            setShowPasscodeModal(true);
        } else {
            router.push('/login');
        }
    };

    const handleExitPasscodeSuccess = () => {
        // User verified passcode (same as dashboard passcode)
        setShowExitPasscodeModal(false);
        Alert.alert(
            'Exit Kiosk Mode',
            'Where would you like to go?',
            [
                {
                    text: 'Go to Dashboard',
                    onPress: () => router.push('/dashboard')
                },
                {
                    text: 'Stay Here',
                    style: 'cancel'
                }
            ]
        );
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
                        <Text style={styles.timerText}>{verificationTime}s</Text>
                    </>
                );
            case 'unlocking':
                return (
                    <>
                        <View style={styles.scannerCircle}>
                            <ActivityIndicator size="large" color="#4CAF50" />
                        </View>
                        <Text style={styles.modalTitle}>Face Recognized!</Text>
                        {verificationResult?.member?.photo_url && (
                            <Image
                                source={{ uri: verificationResult.member.photo_url }}
                                style={styles.memberPhoto}
                                resizeMode="cover"
                            />
                        )}
                        <Text style={[styles.modalMessage, { color: '#4CAF50' }]}>
                            Welcome, {verificationResult?.member?.name}!
                        </Text>
                        {verificationResult?.member?.code && (
                            <Text style={styles.memberCode}>
                                Member ID: {verificationResult.member.code}
                            </Text>
                        )}
                        <Text style={styles.verificationTimeText}>
                            Verified in {verificationTime}s
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
                        {verificationResult?.member?.photo_url && (
                            <Image
                                source={{ uri: verificationResult.member.photo_url }}
                                style={styles.memberPhoto}
                                resizeMode="cover"
                            />
                        )}
                        <Text style={[styles.modalMessage, { color: '#4CAF50' }]}>
                            Welcome, {verificationResult?.member?.name}!
                        </Text>
                        {verificationResult?.member?.code && (
                            <Text style={styles.memberCode}>
                                Member ID: {verificationResult.member.code}
                            </Text>
                        )}
                        <Text style={styles.verificationTimeText}>
                            Verified in {verificationTime}s
                        </Text>
                        <Text style={styles.modalDetail}>You may now enter the gym.</Text>
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
                    <TouchableOpacity
                        activeOpacity={1}
                        onLongPress={() => {
                            if (KIOSK_CONFIG.longPressToExit) {
                                setShowExitPasscodeModal(true);
                            }
                        }}
                        delayLongPress={KIOSK_CONFIG.longPressDuration}
                    >
                        <View>
                            <Text style={styles.title}>Face Check-In</Text>
                            {selectedGym && (
                                <Text style={styles.gymName}>📍 {selectedGym.name}</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setShowDiagnostics(true)}
                        >
                            <Text style={styles.actionButtonIcon}>⚙️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleActionPress}
                        >
                            <Text style={styles.actionButtonIcon}>
                                {isAuthenticated ? '🏠' : '🔐'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.subtitle}>Position your face in the camera frame</Text>
            </View>

            <View style={styles.cameraFrame}>
                <View style={styles.cameraContainer}>
                    {capturedImageUri ? (
                        // Show captured image instead of camera
                        <>
                            <Image
                                source={{ uri: capturedImageUri }}
                                style={styles.capturedImage}
                                resizeMode="cover"
                            />
                            <View style={styles.faceOverlay}>
                                <View style={[styles.faceGuide, { borderColor: 'rgba(76, 175, 80, 0.6)' }]} />
                            </View>
                        </>
                    ) : (
                        // Show live camera feed
                        <>
                            <CameraView
                                ref={cameraRef}
                                style={styles.camera}
                                facing="front"
                            />
                            <View style={styles.faceOverlay}>
                                <View style={styles.faceGuide} />
                            </View>
                        </>
                    )}
                </View>
            </View>

            <View style={styles.footer}>
                {capturedImageUri ? (
                    // Show "Capture Again" button when image is captured
                    <TouchableOpacity
                        style={[styles.captureButton, styles.captureAgainButton]}
                        onPress={handleCaptureAgain}
                        disabled={modalState !== 'idle' && modalState !== 'scanning'}
                    >
                        <Text style={styles.captureButtonText}>📷 Capture Again</Text>
                    </TouchableOpacity>
                ) : (
                    // Show "Scan My Face" button when showing live camera
                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={handleCaptureFace}
                        disabled={modalState !== 'idle'}
                    >
                        <Text style={styles.captureButtonText}>
                            {modalState === 'idle' ? 'Scan My Face' : 'Checking...'}
                        </Text>
                    </TouchableOpacity>
                )}
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

            <SystemDiagnosticsModal
                visible={showDiagnostics}
                onClose={() => setShowDiagnostics(false)}
            />

            {/* Exit Passcode Modal - Uses same passcode as dashboard */}
            <PasscodeModal
                visible={showExitPasscodeModal}
                onClose={() => setShowExitPasscodeModal(false)}
                onSuccess={handleExitPasscodeSuccess}
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
    headerButtons: {
        flexDirection: 'row',
        gap: 12,
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
    captureAgainButton: {
        backgroundColor: '#FF9800', // Orange color for "Capture Again"
        shadowColor: '#FF9800',
    },
    capturedImage: {
        flex: 1,
        width: '100%',
        height: '100%',
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
    memberPhoto: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginVertical: 16,
        borderWidth: 3,
        borderColor: '#4CAF50',
    },
    memberCode: {
        fontSize: 14,
        color: '#888',
        fontWeight: '600',
        marginTop: 4,
        marginBottom: 8,
    },
    timerText: {
        fontSize: 18,
        color: '#4CAF50',
        fontWeight: 'bold',
        marginTop: 12,
        textAlign: 'center',
    },
    verificationTimeText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
        marginTop: 8,
        marginBottom: 4,
        textAlign: 'center',
    },
});
