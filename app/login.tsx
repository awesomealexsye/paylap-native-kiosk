/**
 * Login Screen - Beautiful authentication UI
 */

import React, { useState } from 'react';
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
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

export default function LoginScreen() {
    const { login } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePhoneChange = (text: string) => {
        // Remove all non-digits
        const cleaned = text.replace(/\D/g, '');
        // Limit to 10 digits
        const limited = cleaned.slice(0, 10);
        setPhoneNumber(limited);
        setError(''); // Clear error when user types
    };

    const handleLogin = async () => {
        // Client-side validation
        const validation = authService.validatePhoneNumber(phoneNumber);
        if (!validation.isValid) {
            setError(validation.error || 'Invalid phone number');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await login(phoneNumber);

            if (result.success) {
                // Navigate to OTP screen
                router.push({
                    pathname: '/otp-verify',
                    params: { mobile: phoneNumber },
                });
            } else {
                // Show backend error
                setError(result.message);
            }
        } catch (err: any) {
            setError('Something went wrong. Please try again.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const isButtonDisabled = phoneNumber.length !== 10 || isLoading;

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
                        <Text style={styles.logo}>🏋️</Text>
                        <Text style={styles.title}>PayLap Fitness</Text>
                        <Text style={styles.subtitle}>Kiosk Login</Text>
                    </View>

                    {/* Login Form */}
                    <View style={styles.formContainer}>
                        <Text style={styles.label}>Enter Mobile Number</Text>
                        <Text style={styles.helperText}>
                            We'll send you an OTP to verify
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.countryCode}>+91</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="9876543210"
                                placeholderTextColor="#666"
                                value={phoneNumber}
                                onChangeText={handlePhoneChange}
                                keyboardType="number-pad"
                                maxLength={10}
                                autoFocus
                                editable={!isLoading}
                            />
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
                                isButtonDisabled && styles.buttonDisabled,
                            ]}
                            onPress={handleLogin}
                            disabled={isButtonDisabled}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Send OTP</Text>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.infoText}>
                            This login is for gym owners/admins only
                        </Text>
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
    logo: {
        fontSize: 72,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#888',
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
    label: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    helperText: {
        fontSize: 14,
        color: '#888',
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#252525',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#333',
        marginBottom: 20,
    },
    countryCode: {
        fontSize: 18,
        color: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRightWidth: 1,
        borderRightColor: '#333',
    },
    input: {
        flex: 1,
        fontSize: 18,
        color: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 16,
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
    infoText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
