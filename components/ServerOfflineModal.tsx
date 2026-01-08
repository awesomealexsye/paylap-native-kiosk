/**
 * Server Offline Modal
 * Shown when the relay server is not detected
 */

import React from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Linking,
} from 'react-native';

interface ServerOfflineModalProps {
    visible: boolean;
    onClose: () => void;
    onViewInstructions: () => void;
}

export default function ServerOfflineModal({
    visible,
    onClose,
    onViewInstructions,
}: ServerOfflineModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>⚠️</Text>
                    </View>

                    <Text style={styles.title}>Relay Server Not Found</Text>

                    <Text style={styles.message}>
                        The door control server is not running on this device.
                    </Text>

                    <Text style={styles.submessage}>
                        To use the kiosk, you need to run the relay server in Termux on this same Android device.
                    </Text>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={onViewInstructions}
                    >
                        <Text style={styles.primaryButtonText}>
                            📖 View Setup Instructions
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={onClose}
                    >
                        <Text style={styles.secondaryButtonText}>Close</Text>
                    </TouchableOpacity>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            💡 <Text style={styles.infoBold}>Note:</Text> The relay server must run on the same device as this kiosk app for door control to work.
                        </Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        backgroundColor: '#1f1f1f',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFA500',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    icon: {
        fontSize: 48,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#ddd',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 22,
    },
    submessage: {
        fontSize: 14,
        color: '#aaa',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        width: '100%',
        marginBottom: 12,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    secondaryButton: {
        paddingVertical: 12,
        width: '100%',
    },
    secondaryButtonText: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
    },
    infoBox: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
        padding: 12,
        marginTop: 20,
        borderRadius: 8,
    },
    infoText: {
        color: '#aaa',
        fontSize: 13,
        lineHeight: 18,
    },
    infoBold: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
});
