/**
 * Welcome Screen - Shown after successful verification
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { config } from '../constants/config';

export default function WelcomeScreen() {
    const params = useLocalSearchParams<{ memberName?: string }>();
    const memberName = params.memberName || 'Member';

    useEffect(() => {
        // Auto-return to camera screen after duration
        const timer = setTimeout(() => {
            router.replace('/');
        }, config.ui.welcomeMessageDuration);

        return () => clearTimeout(timer);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                </View>
                <Text style={styles.welcomeText}>Welcome!</Text>
                <Text style={styles.memberName}>{memberName}</Text>
                <Text style={styles.message}>Access granted</Text>
                <Text style={styles.submessage}>Door unlocked for 3 seconds</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    checkmark: {
        fontSize: 64,
        color: '#fff',
        fontWeight: 'bold',
    },
    welcomeText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    memberName: {
        fontSize: 32,
        color: '#4CAF50',
        fontWeight: '600',
        marginBottom: 24,
    },
    message: {
        fontSize: 20,
        color: '#aaa',
        marginBottom: 8,
    },
    submessage: {
        fontSize: 16,
        color: '#666',
    },
});
