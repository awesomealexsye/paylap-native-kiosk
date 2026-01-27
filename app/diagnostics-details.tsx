/**
 * Detailed System Diagnostics Screen
 * Shows comprehensive diagnostic information when system is degraded
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

interface DiagnosticDetail {
    id: string;
    name: string;
    icon: string;
    status: 'healthy' | 'error' | 'warning';
    message?: string;
    error?: string;
    details?: string;
    timestamp?: string;
}

export default function DiagnosticsDetailsScreen() {
    const params = useLocalSearchParams();
    const [refreshing, setRefreshing] = useState(false);

    // Parse diagnostic data from params
    const diagnosticsData: DiagnosticDetail[] = params.data 
        ? JSON.parse(params.data as string) 
        : [];

    const handleRefresh = () => {
        setRefreshing(true);
        // Simulate refresh - in real app, re-run diagnostics
        setTimeout(() => {
            setRefreshing(false);
            router.back();
        }, 1000);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return '#4CAF50';
            case 'warning': return '#FF9800';
            case 'error': return '#F44336';
            default: return '#888';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return '⏳';
        }
    };

    const getRecommendation = (id: string, status: string) => {
        if (status === 'healthy') return null;

        const recommendations: Record<string, string> = {
            relay: '• Check if relay server is running on the local network\n• Verify network connectivity\n• Ensure relay device is powered on\n• Check firewall settings',
            python: '• Verify Python Face API server is running\n• Check if the API endpoint is accessible\n• Ensure face recognition model is loaded\n• Review server logs for errors',
            laravel: '• Check Laravel backend server status\n• Verify API endpoint configuration\n• Ensure database connection is working\n• Review application logs',
            gym: '• Select a gym from the gym list\n• Ensure gym data is synced\n• Check network connectivity to backend',
        };

        return recommendations[id] || '• Contact system administrator\n• Review system logs\n• Restart the application';
    };

    const errorItems = diagnosticsData.filter(item => item.status === 'error');
    const warningItems = diagnosticsData.filter(item => item.status === 'warning');
    const healthyItems = diagnosticsData.filter(item => item.status === 'healthy');

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Diagnostic Details</Text>
                    <Text style={styles.subtitle}>System health information</Text>
                </View>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRefresh}
                    disabled={refreshing}
                >
                    {refreshing ? (
                        <ActivityIndicator size="small" color="#4CAF50" />
                    ) : (
                        <Text style={styles.refreshIcon}>🔄</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    <View style={[styles.summaryCard, { borderLeftColor: '#F44336' }]}>
                        <Text style={styles.summaryNumber}>{errorItems.length}</Text>
                        <Text style={styles.summaryLabel}>Errors</Text>
                    </View>
                    <View style={[styles.summaryCard, { borderLeftColor: '#FF9800' }]}>
                        <Text style={styles.summaryNumber}>{warningItems.length}</Text>
                        <Text style={styles.summaryLabel}>Warnings</Text>
                    </View>
                    <View style={[styles.summaryCard, { borderLeftColor: '#4CAF50' }]}>
                        <Text style={styles.summaryNumber}>{healthyItems.length}</Text>
                        <Text style={styles.summaryLabel}>Healthy</Text>
                    </View>
                </View>

                {/* Critical Issues */}
                {errorItems.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionIcon}>🔴</Text>
                            <Text style={styles.sectionTitle}>Critical Issues</Text>
                        </View>
                        {errorItems.map((item) => (
                            <View key={item.id} style={[styles.detailCard, { borderLeftColor: '#F44336' }]}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardTitleRow}>
                                        <Text style={styles.cardIcon}>{item.icon}</Text>
                                        <Text style={styles.cardTitle}>{item.name}</Text>
                                    </View>
                                    <Text style={styles.cardStatus}>{getStatusIcon(item.status)}</Text>
                                </View>

                                {item.error && (
                                    <View style={styles.errorBox}>
                                        <Text style={styles.errorLabel}>Error Message:</Text>
                                        <Text style={styles.errorText}>{item.error}</Text>
                                    </View>
                                )}

                                {item.message && (
                                    <View style={styles.infoBox}>
                                        <Text style={styles.infoLabel}>Status:</Text>
                                        <Text style={styles.infoText}>{item.message}</Text>
                                    </View>
                                )}

                                <View style={styles.recommendationBox}>
                                    <Text style={styles.recommendationLabel}>💡 Troubleshooting Steps:</Text>
                                    <Text style={styles.recommendationText}>
                                        {getRecommendation(item.id, item.status)}
                                    </Text>
                                </View>

                                {item.timestamp && (
                                    <Text style={styles.timestamp}>Last checked: {item.timestamp}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Warnings */}
                {warningItems.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionIcon}>⚠️</Text>
                            <Text style={styles.sectionTitle}>Warnings</Text>
                        </View>
                        {warningItems.map((item) => (
                            <View key={item.id} style={[styles.detailCard, { borderLeftColor: '#FF9800' }]}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardTitleRow}>
                                        <Text style={styles.cardIcon}>{item.icon}</Text>
                                        <Text style={styles.cardTitle}>{item.name}</Text>
                                    </View>
                                    <Text style={styles.cardStatus}>{getStatusIcon(item.status)}</Text>
                                </View>

                                {item.message && (
                                    <View style={styles.infoBox}>
                                        <Text style={styles.infoLabel}>Status:</Text>
                                        <Text style={styles.infoText}>{item.message}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Healthy Services */}
                {healthyItems.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionIcon}>✅</Text>
                            <Text style={styles.sectionTitle}>Healthy Services</Text>
                        </View>
                        {healthyItems.map((item) => (
                            <View key={item.id} style={[styles.detailCard, { borderLeftColor: '#4CAF50' }]}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardTitleRow}>
                                        <Text style={styles.cardIcon}>{item.icon}</Text>
                                        <Text style={styles.cardTitle}>{item.name}</Text>
                                    </View>
                                    <Text style={styles.cardStatus}>{getStatusIcon(item.status)}</Text>
                                </View>

                                {item.message && (
                                    <Text style={styles.healthyMessage}>{item.message}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Help Section */}
                <View style={styles.helpSection}>
                    <Text style={styles.helpTitle}>Need Help?</Text>
                    <Text style={styles.helpText}>
                        If issues persist after following troubleshooting steps, please contact your system administrator or technical support team.
                    </Text>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.backToHomeButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backToHomeText}>Back to Diagnostics</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        gap: 12,
    },
    backButton: {
        width: 48,
        height: 48,
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    backIcon: {
        fontSize: 24,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        marginTop: 2,
    },
    refreshButton: {
        width: 48,
        height: 48,
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    refreshIcon: {
        fontSize: 20,
    },
    scrollView: {
        flex: 1,
    },
    summaryContainer: {
        flexDirection: 'row',
        padding: 24,
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        borderLeftWidth: 4,
    },
    summaryNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 13,
        color: '#888',
        fontWeight: '500',
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    detailCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
        borderLeftWidth: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    cardStatus: {
        fontSize: 24,
    },
    errorBox: {
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(244, 67, 54, 0.3)',
    },
    errorLabel: {
        fontSize: 12,
        color: '#F44336',
        fontWeight: '700',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    errorText: {
        fontSize: 14,
        color: '#F44336',
        lineHeight: 20,
    },
    infoBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    infoLabel: {
        fontSize: 12,
        color: '#888',
        fontWeight: '700',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoText: {
        fontSize: 14,
        color: '#ccc',
        lineHeight: 20,
    },
    recommendationBox: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    recommendationLabel: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '700',
        marginBottom: 8,
    },
    recommendationText: {
        fontSize: 13,
        color: '#ccc',
        lineHeight: 20,
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 8,
    },
    healthyMessage: {
        fontSize: 14,
        color: '#4CAF50',
        marginTop: 8,
    },
    helpSection: {
        margin: 24,
        padding: 20,
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    helpTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    helpText: {
        fontSize: 14,
        color: '#888',
        lineHeight: 22,
    },
    bottomPadding: {
        height: 20,
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    backToHomeButton: {
        backgroundColor: '#333',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    backToHomeText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
