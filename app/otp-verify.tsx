/**
 * OTP Verification Screen
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import gymService from '../services/gymService';

export default function OTPVerifyScreen() {
    const params = useLocalSearchParams();
    const mobile = params.mobile as string;
    const { verifyOTP } = useAuth();

    const [otp, setOtp] = useState(['', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Timer for resend OTP
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    const handleOTPChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (text && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 4 digits are entered
        if (text && index === 3) {
            const fullOtp = newOtp.join('');
            if (fullOtp.length === 4) {
                handleVerifyOTP(fullOtp);
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = async (fullOtp?: string) => {
        const otpCode = fullOtp || otp.join('');

        // Client-side validation
        const validation = authService.validateOTP(otpCode);
        if (!validation.isValid) {
            setError(validation.error || 'Invalid OTP');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await verifyOTP(mobile, otpCode);

            if (result.success && result.userId) {
                // Get user data and token from auth service
                const user = await authService.getCurrentUser();
                const token = await authService.getAuthToken();

                if (!user || !token) {
                    setError('Failed to get user session');
                    return;
                }

                // Fetch gym list with token and auth_key
                const gymResponse = await gymService.fetchGymList(
                    result.userId,
                    token,
                    user.auth_key
                );

                if (gymResponse.status && gymResponse.data) {
                    const gyms = gymResponse.data;

                    if (gyms.length === 0) {
                        setError('No gyms found for this account');
                        return;
                    }

                    if (gyms.length === 1) {
                        // Auto-select single gym
                        await gymService.saveSelectedGym(gyms[0]);
                        console.log('✅ Single gym auto-selected:', gyms[0].name);
                        // Navigate to main kiosk screen
                        router.replace('/');
                    } else {
                        // Navigate to gym selection screen
                        router.push({
                            pathname: '/gym-selection',
                            params: { userId: result.userId },
                        });
                    }
                } else {
                    setError(gymResponse.message || 'Failed to fetch gyms');
                }
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError('Something went wrong. Please try again.');
            console.error('OTP verify error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!canResend) return;

        setCanResend(false);
        setResendTimer(60);
        setError('');

        try {
            const result = await authService.login(mobile);
            if (result.status) {
                // Show success message (optional)
                console.log('✅ OTP resent successfully');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Failed to resend OTP');
        }
    };

    const maskedMobile = `${mobile.slice(0, 2)}****${mobile.slice(-2)}`;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.icon}>🔐</Text>
                        <Text style={styles.title}>Verify OTP</Text>
                        <Text style={styles.subtitle}>
                            Enter the 4-digit code sent to{'\n'}
                            <Text style={styles.phoneText}>+91 {maskedMobile}</Text>
                        </Text>
                    </View>

                    {/* OTP Input */}
                    <View style={styles.formContainer}>
                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => (inputRefs.current[index] = ref)}
                                    style={[
                                        styles.otpInput,
                                        digit && styles.otpInputFilled,
                                    ]}
                                    value={digit}
                                    onChangeText={(text) =>
                                        handleOTPChange(text.replace(/\D/g, ''), index)
                                    }
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    editable={!isLoading}
                                    selectTextOnFocus
                                />
                            ))}
                        </View>

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorIcon}>⚠️</Text>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[
                                styles.button,
                                (isLoading || otp.join('').length !== 4) &&
                                styles.buttonDisabled,
                            ]}
                            onPress={() => handleVerifyOTP()}
                            disabled={isLoading || otp.join('').length !== 4}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Verify OTP</Text>
                            )}
                        </TouchableOpacity>

                        {/* Resend OTP */}
                        <View style={styles.resendContainer}>
                            {canResend ? (
                                <TouchableOpacity onPress={handleResendOTP}>
                                    <Text style={styles.resendText}>Resend OTP</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.timerText}>
                                    Resend OTP in {resendTimer}s
                                </Text>
                            )}
                        </View>

                        {/* Back button */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.backButtonText}>← Change Phone Number</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    icon: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        lineHeight: 24,
    },
    phoneText: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    formContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    otpInput: {
        width: 48,
        height: 56,
        backgroundColor: '#252525',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#333',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    otpInputFilled: {
        borderColor: '#4CAF50',
        backgroundColor: '#1a3a1d',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ff444420',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#ff4444',
    },
    errorIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: '#ff6666',
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonDisabled: {
        backgroundColor: '#2a5a2d',
        shadowOpacity: 0,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    resendText: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '600',
    },
    timerText: {
        fontSize: 16,
        color: '#666',
    },
    backButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    backButtonText: {
        fontSize: 14,
        color: '#888',
    },
});
