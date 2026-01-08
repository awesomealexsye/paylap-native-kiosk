/**
 * Server Setup Instructions Screen
 * Complete guide for setting up relay server in Termux
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function ServerSetupScreen() {
    const openTermuxPlayStore = () => {
        Linking.openURL('https://f-droid.org/packages/com.termux/');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Server Setup Guide</Text>
                    <Text style={styles.subtitle}>
                        Follow these steps to run the relay server on this device
                    </Text>
                </View>

                {/* Important Note */}
                <View style={styles.warningBox}>
                    <Text style={styles.warningIcon}>⚠️</Text>
                    <Text style={styles.warningText}>
                        The relay server <Text style={styles.bold}>MUST</Text> run on this same Android device for the kiosk to control the door lock.
                    </Text>
                </View>

                {/* Step 1 */}
                <View style={styles.stepContainer}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={styles.stepTitle}>Install Termux</Text>
                    </View>
                    <Text style={styles.stepText}>
                        Download and install Termux from F-Droid (NOT Google Play Store).
                    </Text>
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={openTermuxPlayStore}
                    >
                        <Text style={styles.linkButtonText}>
                            🔗 Download Termux from F-Droid
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.note}>
                        Note: The Play Store version is outdated and won't work properly.
                    </Text>
                </View>

                {/* Step 2 */}
                <View style={styles.stepContainer}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={styles.stepTitle}>Transfer Server Files</Text>
                    </View>
                    <Text style={styles.stepText}>
                        Copy the `paylap-node-server` folder to this Android device. You can use:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bullet}>• USB cable transfer</Text>
                        <Text style={styles.bullet}>• Cloud storage (Google Drive, Dropbox)</Text>
                        <Text style={styles.bullet}>• File sharing apps</Text>
                    </View>
                </View>

                {/* Step 3 */}
                <View style={styles.stepContainer}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={styles.stepTitle}>Run Setup Script</Text>
                    </View>
                    <Text style={styles.stepText}>
                        Open Termux and run these commands:
                    </Text>
                    <View style={styles.codeBlock}>
                        <Text style={styles.code}>cd /sdcard/paylap-node-server</Text>
                        <Text style={styles.code}>bash setup-termux.sh</Text>
                    </View>
                    <Text style={styles.note}>
                        The setup script will automatically:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bullet}>✅ Install Node.js</Text>
                        <Text style={styles.bullet}>✅ Install dependencies</Text>
                        <Text style={styles.bullet}>✅ Test relay connection</Text>
                        <Text style={styles.bullet}>✅ Start server with PM2</Text>
                        <Text style={styles.bullet}>✅ Enable auto-start on reboot</Text>
                    </View>
                </View>

                {/* Step 4 */}
                <View style={styles.stepContainer}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>4</Text>
                        </View>
                        <Text style={styles.stepTitle}>Verify Server is Running</Text>
                    </View>
                    <Text style={styles.stepText}>
                        After setup completes, the server should start automatically on port 3000.
                    </Text>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            💡 Return to the kiosk app and try scanning a face. If the server is running, you won't see this error anymore.
                        </Text>
                    </View>
                </View>

                {/* Troubleshooting */}
                <View style={styles.stepContainer}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepIcon}>
                            <Text style={styles.stepIconText}>🔧</Text>
                        </View>
                        <Text style={styles.stepTitle}>Troubleshooting</Text>
                    </View>

                    <Text style={styles.problemTitle}>Server not starting?</Text>
                    <View style={styles.codeBlock}>
                        <Text style={styles.code}>pm2 logs paylap-relay</Text>
                    </View>

                    <Text style={styles.problemTitle}>Check server status:</Text>
                    <View style={styles.codeBlock}>
                        <Text style={styles.code}>pm2 status</Text>
                    </View>

                    <Text style={styles.problemTitle}>Restart server:</Text>
                    <View style={styles.codeBlock}>
                        <Text style={styles.code}>pm2 restart paylap-relay</Text>
                    </View>
                </View>

                {/* Done Button */}
                <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>

                <View style={styles.spacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 24,
    },
    backButton: {
        marginBottom: 16,
    },
    backText: {
        color: '#4CAF50',
        fontSize: 16,
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
    warningBox: {
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        borderLeftWidth: 4,
        borderLeftColor: '#FFA500',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    warningIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    warningText: {
        flex: 1,
        color: '#FFA500',
        fontSize: 14,
        lineHeight: 20,
    },
    bold: {
        fontWeight: 'bold',
    },
    stepContainer: {
        backgroundColor: '#252525',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    stepNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    stepIcon: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepIconText: {
        fontSize: 28,
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    stepText: {
        fontSize: 15,
        color: '#ddd',
        lineHeight: 22,
        marginBottom: 12,
    },
    linkButton: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
    },
    linkButtonText: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '600',
    },
    note: {
        fontSize: 13,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 8,
    },
    bulletList: {
        marginLeft: 8,
        marginVertical: 8,
    },
    bullet: {
        fontSize: 14,
        color: '#ddd',
        marginVertical: 4,
        lineHeight: 20,
    },
    codeBlock: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 16,
        marginVertical: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
    },
    code: {
        fontFamily: 'monospace',
        fontSize: 14,
        color: '#4CAF50',
        marginBottom: 8,
    },
    infoBox: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
    },
    infoText: {
        color: '#4CAF50',
        fontSize: 13,
        lineHeight: 18,
    },
    problemTitle: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 4,
    },
    doneButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 24,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    spacer: {
        height: 40,
    },
});
