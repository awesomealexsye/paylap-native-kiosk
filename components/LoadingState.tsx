/**
 * Loading State Component
 * Beautiful, reusable loading UI for API calls
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface LoadingStateProps {
    icon?: string;
    title?: string;
    description?: string;
}

export default function LoadingState({
    icon = '⏳',
    title = 'Loading...',
    description
}: LoadingStateProps) {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{icon}</Text>
                    <View style={styles.spinnerContainer}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                    </View>
                </View>
                <Text style={styles.title}>{title}</Text>
                {description && (
                    <Text style={styles.description}>{description}</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        padding: 40,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    iconContainer: {
        position: 'relative',
        marginBottom: 24,
    },
    icon: {
        fontSize: 64,
    },
    spinnerContainer: {
        position: 'absolute',
        bottom: -20,
        alignSelf: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
    },
});
