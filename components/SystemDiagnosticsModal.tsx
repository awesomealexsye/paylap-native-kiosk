/**
 * System Diagnostics Modal Component
 * Shows health status of all critical services with passcode protection
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;
import { router } from 'expo-router';
import { PasscodeModal } from './PasscodeModal';
import { useAuth } from '../contexts/AuthContext';
import {
    checkServerHealth,
    checkPythonHealth,
    checkLaravelHealth,
} from '../services/serverHealthService';

interface DiagnosticItem {
    id: string;
    name: string;
    icon: string;
    status: 'pending' | 'healthy' | 'error';
    message?: string;
    error?: string;
}

interface SystemDiagnosticsModalProps {
    visible: boolean;
    onClose: () => void;
}

export function SystemDiagnosticsModal({ visible, onClose }: SystemDiagnosticsModalProps) {
    const { selectedGym } = useAuth();
    const [showPasscode, setShowPasscode] = useState(true);
    const [isChecking, setIsChecking] = useState(false);
    const [items, setItems] = useState<DiagnosticItem[]>([
        { id: 'relay', name: 'Relay Server', icon: '🔌', status: 'pending' },
        { id: 'python', name: 'Python Face API', icon: '🐍', status: 'pending' },
        { id: 'laravel', name: 'Laravel Backend', icon: '⚡', status: 'pending' },
        { id: 'gym', name: 'Gym Selection', icon: '🏢', status: 'pending' },
    ]);

    // Reset state when modal visibility changes
    useEffect(() => {
        if (visible) {
            setShowPasscode(true);
        }
    }, [visible]);

    const runHealthChecks = async () => {
        setIsChecking(true);

        // Reset all to pending
        setItems(prev => prev.map(item => ({ ...item, status: 'pending' as const, message: undefined, error: undefined })));

        const checks = [
            // Relay Server
            (async () => {
                const result = await checkServerHealth();
                setItems(prev => prev.map(item =>
                    item.id === 'relay'
                        ? {
                            ...item,
                            status: result.online ? 'healthy' : 'error',
                            message: result.message,
                            error: result.error
                        }
                        : item
                ));
            })(),

            // Python API
            (async () => {
                const result = await checkPythonHealth();
                setItems(prev => prev.map(item =>
                    item.id === 'python'
                        ? {
                            ...item,
                            status: result.online ? 'healthy' : 'error',
                            message: result.message,
                            error: result.error
                        }
                        : item
                ));
            })(),

            // Laravel API
            (async () => {
                const result = await checkLaravelHealth();
                setItems(prev => prev.map(item =>
                    item.id === 'laravel'
                        ? {
                            ...item,
                            status: result.online ? 'healthy' : 'error',
                            message: result.message,
                            error: result.error
                        }
                        : item
                ));
            })(),

            // Gym Selection
            (async () => {
                await new Promise(resolve => setTimeout(resolve, 500)); // Simulate check
                setItems(prev => prev.map(item =>
                    item.id === 'gym'
                        ? {
                            ...item,
                            status: selectedGym ? 'healthy' : 'error',
                            message: selectedGym ? selectedGym.name : 'No gym selected',
                            error: selectedGym ? undefined : 'Please select a gym'
                        }
                        : item
                ));
            })(),
        ];

        await Promise.all(checks);
        setIsChecking(false);
    };

    const handlePasscodeSuccess = () => {
        setShowPasscode(false);
        runHealthChecks();
    };

    const handleClose = () => {
        setShowPasscode(true);
        setItems(prev => prev.map(item => ({ ...item, status: 'pending' as const })));
        onClose();
    };

    const handleRefresh = () => {
        runHealthChecks();
    };

    const handleViewDetails = () => {
        // Prepare diagnostic data with timestamps
        const diagnosticData = items.map(item => ({
            ...item,
            timestamp: new Date().toLocaleString(),
        }));

        // Close modal and navigate to details screen
        handleClose();
        router.push({
            pathname: '/diagnostics-details',
            params: {
                data: JSON.stringify(diagnosticData),
            },
        });
    };

    // Calculate overall health
    const getOverallHealth = () => {
        const errorCount = items.filter(i => i.status === 'error').length;
        const healthyCount = items.filter(i => i.status === 'healthy').length;
        const pendingCount = items.filter(i => i.status === 'pending').length;

        if (pendingCount > 0 || isChecking) {
            return { status: 'checking', icon: '⏳', text: 'Checking System...', color: '#FF9800' };
        }
        if (errorCount === 0 && healthyCount === items.length) {
            return { status: 'healthy', icon: '🟢', text: 'System Healthy', color: '#4CAF50', detail: 'All services operational' };
        }
        if (errorCount > 0 && errorCount < items.length) {
            return { status: 'degraded', icon: '🟡', text: 'System Degraded', color: '#FF9800', detail: 'Some services unavailable' };
        }
        return { status: 'error', icon: '🔴', text: 'System Error', color: '#F44336', detail: 'Critical services offline' };
    };

    const overallHealth = getOverallHealth();

    // Check if we should show "More Details" button (only when degraded or error)
    const hasIssues = items.some(item => item.status === 'error') && !isChecking;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return '✅';
            case 'pending': return '⏳';
            case 'error': return '❌';
            default: return '⏳';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return '#4CAF50';
            case 'pending': return '#FF9800';
            case 'error': return '#F44336';
            default: return '#888';
        }
    };

    if (!visible) return null;

    return (
        <>
            {showPasscode ? (
                <PasscodeModal
                    visible={visible}
                    onClose={handleClose}
                    onSuccess={handlePasscodeSuccess}
                />
            ) : (
                <Modal
                    visible={visible}
                    transparent
                    animationType="fade"
                    onRequestClose={handleClose}
                    statusBarTranslucent
                >
                    <View style={styles.overlay}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.keyboardAvoid}
                        >
                            <View style={styles.container}>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>System Diagnostics</Text>
                                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                    <Text style={styles.closeButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Overall Health */}
                            <View style={[styles.healthSummary, { borderLeftColor: overallHealth.color }]}>
                                <View style={styles.healthSummaryContent}>
                                    <Text style={styles.healthIcon}>{overallHealth.icon}</Text>
                                    <View style={styles.healthText}>
                                        <Text style={[styles.healthStatus, { color: overallHealth.color }]}>
                                            {overallHealth.text}
                                        </Text>
                                        {overallHealth.detail && (
                                            <Text style={styles.healthDetail}>{overallHealth.detail}</Text>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* Diagnostics List */}
                            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                                {items.map((item) => (
                                    <View key={item.id} style={styles.diagnosticItem}>
                                        <View style={styles.itemHeader}>
                                            <View style={styles.itemTitleRow}>
                                                <Text style={styles.itemIcon}>{item.icon}</Text>
                                                <Text style={styles.itemName}>{item.name}</Text>
                                            </View>
                                            <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
                                        </View>
                                        {item.message && (
                                            <Text style={[styles.itemMessage, { color: getStatusColor(item.status) }]}>
                                                {item.message}
                                            </Text>
                                        )}
                                        {item.error && (
                                            <Text style={styles.itemError}>{item.error}</Text>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>

                            {/* Action Buttons */}
                            <View style={styles.actions}>
                                {hasIssues && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.detailsButton]}
                                        onPress={handleViewDetails}
                                    >
                                        <Text style={styles.actionButtonText}>📋 More Details</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.refreshButton, hasIssues && { flex: 0.6 }]}
                                    onPress={handleRefresh}
                                    disabled={isChecking}
                                >
                                    {isChecking ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.actionButtonText}>🔄 Refresh</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.closeActionButton, hasIssues && { flex: 0.6 }]}
                                    onPress={handleClose}
                                >
                                    <Text style={styles.actionButtonText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    keyboardAvoid: {
        width: '100%',
        maxHeight: height * 0.9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        width: isTablet ? '70%' : '96%',
        maxWidth: 600,
        maxHeight: height * 0.85,
        borderWidth: 1,
        borderColor: '#333',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isTablet ? 24 : 18,
        paddingBottom: isTablet ? 16 : 14,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        fontSize: isTablet ? 24 : 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    healthSummary: {
        margin: isTablet ? 20 : 16,
        marginBottom: isTablet ? 16 : 12,
        padding: isTablet ? 20 : 16,
        backgroundColor: '#0f0f0f',
        borderRadius: 16,
        borderLeftWidth: 4,
    },
    healthSummaryContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    healthIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    healthText: {
        flex: 1,
    },
    healthStatus: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    healthDetail: {
        fontSize: 14,
        color: '#888',
    },
    listContainer: {
        flex: 1,
        maxHeight: height * 0.4,
        paddingHorizontal: isTablet ? 20 : 16,
    },
    diagnosticItem: {
        backgroundColor: '#0f0f0f',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    statusIcon: {
        fontSize: 20,
    },
    itemMessage: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    itemError: {
        fontSize: 13,
        color: '#F44336',
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        padding: isTablet ? 20 : 14,
        gap: isTablet ? 12 : 8,
        borderTopWidth: 1,
        borderTopColor: '#333',
        flexWrap: 'wrap',
    },
    actionButton: {
        flex: 1,
        paddingVertical: isTablet ? 16 : 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: isTablet ? 100 : 80,
    },
    detailsButton: {
        backgroundColor: '#FF9800',
        flex: 1,
    },
    refreshButton: {
        backgroundColor: '#4CAF50',
    },
    closeActionButton: {
        backgroundColor: '#333',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: isTablet ? 16 : 14,
        fontWeight: '600',
    },
});
