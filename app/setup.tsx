/**
 * Server Setup Instructions
 * Simple 3-step guide to setup relay server in Termux
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

export default function ServerSetupScreen() {
    const SCRIPT_URL = 'https://raw.githubusercontent.com/awesomealexsye/paylap-fitness-node-server/main/termux-auto-setup.sh';
    const TERMUX_URL = 'https://f-droid.org/packages/com.termux/';

    const SETUP_COMMAND = `curl -O ${SCRIPT_URL} && bash termux-auto-setup.sh`;

    const handleCopyCommand = async () => {
        await Clipboard.setStringAsync(SETUP_COMMAND);
        Alert.alert('✅ Copied!', 'Setup command copied to clipboard.\n\nPaste it in Termux to start installation.');
    };

    const handleOpenTermux = () => {
        Linking.openURL(TERMUX_URL);
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
                    <Text style={styles.title}>Relay Server Setup</Text>
                    <Text style={styles.subtitle}>
                        3 Simple Steps - Fully Automated!
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
                        style={styles.primaryButton}
                        onPress={handleOpenTermux}
                    >
                        <Text style={styles.primaryButtonText}>
                            📱 Download Termux from F-Droid
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.note}>
                        ⚠️ The Play Store version is outdated and won't work.
                    </Text>
                </View>

                {/* Step 2 */}
                <View style={styles.stepContainer}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={styles.stepTitle}>Copy Setup Command</Text>
                    </View>
                    <Text style={styles.stepText}>
                        Tap the button below to copy the auto-setup command to clipboard.
                    </Text>
                    <TouchableOpacity
                        style={styles.copyButton}
                        onPress={handleCopyCommand}
                    >
                        <Text style={styles.copyButtonIcon}>📋</Text>
                        <Text style={styles.copyButtonText}>Copy Setup Command</Text>
                    </TouchableOpacity>
                    <View style={styles.codeBlock}>
                        <Text style={styles.codeComment}># This command will:</Text>
                        <Text style={styles.codeComment}># • Download auto-setup script</Text>
                        <Text style={styles.codeComment}># • Install Node.js & Git</Text>
                        <Text style={styles.codeComment}># • Clone server from GitHub</Text>
                        <Text style={styles.codeComment}># • Install dependencies</Text>
                        <Text style={styles.codeComment}># • Start with PM2</Text>
                        <Text style={styles.codeComment}># • Enable auto-start</Text>
                    </View>
                </View>

                {/* Step 3 */}
                <View style={styles.stepContainer}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={styles.stepTitle}>Run in Termux</Text>
                    </View>
                    <Text style={styles.stepText}>
                        Open Termux and paste the command (long-press → Paste), then press Enter.
                    </Text>
                    <View style={styles.instructionBox}>
                        <Text style={styles.instructionText}>
                            1. Open <Text style={styles.bold}>Termux</Text> app
                        </Text>
                        <Text style={styles.instructionText}>
                            2. <Text style={styles.bold}>Long-press</Text> on the screen
                        </Text>
                        <Text style={styles.instructionText}>
                            3. Tap <Text style={styles.bold}>Paste</Text>
                        </Text>
                        <Text style={styles.instructionText}>
                            4. Press <Text style={styles.bold}>Enter</Text>
                        </Text>
                        <Text style={styles.instructionText}>
                            5. Wait for setup to complete (~2-3 minutes)
                        </Text>
                    </View>
                </View>

                {/* What Happens */}
                <View style={styles.stepContainer}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepIcon}>
                            <Text style={styles.stepIconText}>🤖</Text>
                        </View>
                        <Text style={styles.stepTitle}>Automatic Setup</Text>
                    </View>

                    <Text style={styles.stepText}>
                        The script will automatically:
                    </Text>

                    <View style={styles.bulletList}>
                        <Text style={styles.bullet}>✅ Update Termux packages</Text>
                        <Text style={styles.bullet}>✅ Install Node.js & Git</Text>
                        <Text style={styles.bullet}>✅ Clone server from GitHub</Text>
                        <Text style={styles.bullet}>✅ Install all dependencies</Text>
                        <Text style={styles.bullet}>✅ Start server on port 3000</Text>
                        <Text style={styles.bullet}>✅ Setup PM2 for auto-restart</Text>
                        <Text style={styles.bullet}>✅ Enable background running</Text>
                        <Text style={styles.bullet}>✅ Configure auto-start on boot</Text>
                    </View>

                    <View style={styles.successBox}>
                        <Text style={styles.successText}>
                            🎉 When done, you'll see "Setup Complete!" and the server will be running!
                        </Text>
                    </View>
                </View>

                {/* Verify */}
                <View style={styles.stepContainer}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepIcon}>
                            <Text style={styles.stepIconText}>✅</Text>
                        </View>
                        <Text style={styles.stepTitle}>Verify Setup</Text>
                    </View>

                    <Text style={styles.stepText}>
                        After setup completes, return to the kiosk app:
                    </Text>

                    <View style={styles.verifyList}>
                        <Text style={styles.verifyItem}>
                            1. Go to <Text style={styles.bold}>Settings ⚙️</Text>
                        </Text>
                        <Text style={styles.verifyItem}>
                            2. Tap <Text style={styles.bold}>"Check"</Text> button
                        </Text>
                        <Text style={styles.verifyItem}>
                            3. Should show <Text style={styles.successColor}>🟢 Online</Text>
                        </Text>
                        <Text style={styles.verifyItem}>
                            4. Tap <Text style={styles.bold}>"Test Relay Hardware"</Text>
                        </Text>
                        <Text style={styles.verifyItem}>
                            5. Door should unlock for 3 seconds!
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

                    <Text style={styles.problemTitle}>If setup fails:</Text>
                    <View style={styles.codeBlock}>
                        <Text style={styles.code}># Run these commands in Termux:</Text>
                        <Text style={styles.code}>pkg update && pkg upgrade</Text>
                        <Text style={styles.code}>pkg install nodejs git</Text>
                        <Text style={styles.code}>npm install -g pm2</Text>
                    </View>

                    <Text style={styles.problemTitle}>Check server status:</Text>
                    <View style={styles.codeBlock}>
                        <Text style={styles.code}>pm2 status</Text>
                    </View>

                    <Text style={styles.problemTitle}>View logs:</Text>
                    <View style={styles.codeBlock}>
                        <Text style={styles.code}>pm2 logs paylap-relay</Text>
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
        fontSize: 18,
        color: '#4CAF50',
        fontWeight: '600',
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
    primaryButton: {
        backgroundColor: '#4CAF50',
        padding: 14,
        borderRadius: 10,
        marginVertical: 8,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 15,
        textAlign: 'center',
        fontWeight: '600',
    },
    copyButton: {
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 10,
        marginVertical: 8,
        gap: 8,
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    copyButtonIcon: {
        fontSize: 20,
    },
    copyButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    note: {
        fontSize: 13,
        color: '#FFA500',
        fontStyle: 'italic',
        marginTop: 8,
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
        fontSize: 13,
        color: '#4CAF50',
        marginBottom: 4,
    },
    codeComment: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#888',
        marginBottom: 2,
    },
    instructionBox: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 8,
        padding: 16,
        marginTop: 8,
    },
    instructionText: {
        fontSize: 14,
        color: '#ddd',
        marginBottom: 8,
        lineHeight: 20,
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
    successBox: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        borderRadius: 8,
        padding: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    successText: {
        color: '#4CAF50',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
        textAlign: 'center',
    },
    verifyList: {
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderRadius: 8,
        padding: 16,
        marginTop: 8,
    },
    verifyItem: {
        fontSize: 14,
        color: '#ddd',
        marginBottom: 8,
        lineHeight: 20,
    },
    successColor: {
        color: '#4CAF50',
        fontWeight: 'bold',
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
