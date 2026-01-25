/**
 * Exit Kiosk Mode Modal
 * Passcode-protected modal to exit kiosk lock mode
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { KIOSK_CONFIG } from '../constants/config';

interface ExitKioskModalProps {
    visible: boolean;
    onClose: () => void;
    onExitConfirmed: () => void;
}

export function ExitKioskModal({ visible, onClose, onExitConfirmed }: ExitKioskModalProps) {
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');

    const handleVerify = () => {
        const trimmedCode = passcode.trim();

        if (trimmedCode === KIOSK_CONFIG.exitPasscode) {
            setPasscode('');
            setError('');
            onExitConfirmed();
        } else {
            setError('❌ Invalid exit passcode');
            // Vibrate or provide feedback
            setPasscode('');
        }
    };

    const handleClose = () => {
        setPasscode('');
        setError('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.icon}>🔓</Text>
                        <Text style={styles.title}>Exit Kiosk Mode</Text>
                        <Text style={styles.subtitle}>
                            Enter admin passcode to exit
                        </Text>
                    </View>

                    {/* Passcode Input */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={passcode}
                            onChangeText={(text) => {
                                setPasscode(text);
                                setError('');
                            }}
                            placeholder="Enter exit passcode"
                            placeholderTextColor="#666"
                            secureTextEntry
                            keyboardType="numeric"
                            maxLength={6}
                            autoFocus
                            onSubmitEditing={handleVerify}
                        />
                    </View>

                    {/* Error Message */}
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Info Message */}
                    <View style={styles.infoContainer}>
                        <Text style={styles.infoIcon}>ℹ️</Text>
                        <Text style={styles.infoText}>
                            This passcode is different from the regular kiosk passcode.
                            Only administrators should know this code.
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.exitButton]}
                            onPress={handleVerify}
                            disabled={passcode.length === 0}
                        >
                            <Text style={[
                                styles.exitButtonText,
                                passcode.length === 0 && styles.buttonDisabled
                            ]}>
                                Exit Kiosk
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        padding: 32,
        borderWidth: 1,
        borderColor: '#333',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    icon: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#0a0a0a',
        borderRadius: 12,
        padding: 18,
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 4,
        borderWidth: 2,
        borderColor: '#FF9800',
    },
    errorContainer: {
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(244, 67, 54, 0.3)',
    },
    errorText: {
        color: '#F44336',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '600',
    },
    infoContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 152, 0, 0.2)',
    },
    infoIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    infoText: {
        flex: 1,
        color: '#FF9800',
        fontSize: 12,
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#333',
    },
    exitButton: {
        backgroundColor: '#FF9800',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    exitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
