import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import authService from '../services/authService';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

interface PasscodeModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({ visible, onClose, onSuccess }) => {
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [serverPasscode, setServerPasscode] = useState<string | null>(null);
    const [fetchingPasscode, setFetchingPasscode] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchPasscode();
            setPasscode('');
            setError(null);
        }
    }, [visible]);

    const fetchPasscode = async () => {
        setFetchingPasscode(true);
        try {
            const result = await authService.getKioskPasscode();
            if (result.status) {
                setServerPasscode(result.kiosk_passcode);
                if (!result.kiosk_passcode) {
                    setError('Passcode not set. Please set it from admin app first.');
                }
            } else {
                setError('Failed to fetch passcode settings');
            }
        } catch (err) {
            setError('Connection error. Please check your internet.');
        } finally {
            setFetchingPasscode(false);
        }
    };

    const handleSubmit = () => {
        if (fetchingPasscode) return;

        if (!serverPasscode) {
            setError('Passcode not set. Please set it from admin app first.');
            return;
        }

        if (passcode.trim() === '') {
            setError('Please enter passcode');
            return;
        }

        if (passcode.trim().toUpperCase() === serverPasscode.toUpperCase()) {
            onSuccess();
        } else {
            setError('Incorrect passcode. Please try again.');
            setPasscode('');
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}
                >
                    <View style={styles.cardContainer}>
                        <View
                            style={[styles.card, { backgroundColor: '#1a1a1a' }]}
                        >
                            {/* Glass Effect Top Border */}
                            <View style={styles.glassTopBorder} />

                            <View style={styles.iconWrapper}>
                                <View
                                    style={[styles.iconGradient, { backgroundColor: '#4CAF50' }]}
                                >
                                    <Text style={styles.lockIcon}>🔐</Text>
                                </View>
                                <View style={styles.iconGlow} />
                            </View>

                            <Text style={styles.title}>Admin Access</Text>
                            <Text style={styles.subtitle}>Enter 6-digit kiosk passcode to continue</Text>

                            {fetchingPasscode ? (
                                <View style={styles.loaderContainer}>
                                    <ActivityIndicator size="large" color="#4CAF50" />
                                    <Text style={styles.loaderText}>Fetching Authorization...</Text>
                                </View>
                            ) : (
                                <View style={styles.form}>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={[styles.input, error ? styles.inputError : null]}
                                            placeholder="ENTER CODE"
                                            placeholderTextColor="#333"
                                            value={passcode}
                                            onChangeText={(text) => {
                                                setPasscode(text);
                                                setError(null);
                                            }}
                                            maxLength={6}
                                            autoCapitalize="characters"
                                            secureTextEntry
                                            autoFocus={true}
                                            keyboardType="default"
                                            selectionColor="#4CAF50"
                                        />
                                    </View>

                                    {error && (
                                        <View style={styles.errorContainer}>
                                            <Text style={styles.errorText}>⚠️ {error}</Text>
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={styles.buttonWrapper}
                                        onPress={handleSubmit}
                                        disabled={!passcode || passcode.length < 1}
                                        activeOpacity={0.8}
                                    >
                                        <View
                                            style={[styles.submitButton, { backgroundColor: (!passcode || passcode.length < 1) ? '#252525' : '#4CAF50' }]}
                                        >
                                            <Text style={[
                                                styles.buttonText,
                                                (!passcode || passcode.length < 1) && styles.buttonTextDisabled
                                            ]}>
                                                Confirm Access
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardAvoid: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContainer: {
        width: isTablet ? '60%' : '88%',
        maxWidth: 420,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
        elevation: 25,
    },
    card: {
        paddingVertical: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    glassTopBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    iconWrapper: {
        marginBottom: 24,
        position: 'relative',
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    iconGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#4CAF50',
        borderRadius: 40,
        opacity: 0.15,
        transform: [{ scale: 1.2 }],
    },
    lockIcon: {
        fontSize: 34,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#999',
        marginBottom: 35,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    loaderContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    loaderText: {
        color: '#777',
        marginTop: 15,
        fontSize: 14,
        fontWeight: '500',
    },
    form: {
        width: '100%',
        alignItems: 'center',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        paddingVertical: 20,
        color: '#fff',
        fontSize: 26,
        textAlign: 'center',
        letterSpacing: 10,
        fontWeight: '900',
    },
    inputError: {
        borderColor: '#FF5252',
        backgroundColor: 'rgba(255, 82, 82, 0.05)',
    },
    errorContainer: {
        backgroundColor: 'rgba(255, 82, 82, 0.12)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 25,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 82, 82, 0.2)',
    },
    errorText: {
        color: '#FF7070',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '600',
    },
    buttonWrapper: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    submitButton: {
        width: '100%',
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    buttonTextDisabled: {
        color: '#444',
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    cancelText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '700',
    },
});
