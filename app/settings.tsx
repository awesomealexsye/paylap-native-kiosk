/**
 * Settings Screen
 * Manage server configuration and test connectivity
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    checkServerHealth,
    checkPythonHealth,
    checkLaravelHealth,
    getServerConfig
} from '../services/serverHealthService';
import { config, updateBaseUrl } from '../constants/config';
import { unlockDoor } from '../services/relayService';

const STORAGE_KEY_API_URL = '@kiosk_api_url';

export default function SettingsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [serverConfig, setServerConfig] = useState<any>(null);

    // Status states
    const [relayStatus, setRelayStatus] = useState<any>(null);
    const [pythonStatus, setPythonStatus] = useState<any>(null);
    const [laravelStatus, setLaravelStatus] = useState<any>(null);

    const [checkingStatus, setCheckingStatus] = useState({
        relay: false,
        python: false,
        laravel: false,
        all: false
    });

    const [testingUnlock, setTestingUnlock] = useState(false);

    // API URL state
    const [apiUrl, setApiUrl] = useState('http://localhost:3000');
    const [isEditingUrl, setIsEditingUrl] = useState(false);
    const [tempUrl, setTempUrl] = useState('http://localhost:3000');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            // Load saved API URL
            const savedUrl = await AsyncStorage.getItem(STORAGE_KEY_API_URL);
            if (savedUrl) {
                setApiUrl(savedUrl);
                setTempUrl(savedUrl);
                updateBaseUrl(savedUrl);
            }

            // Fetch initial config and check all
            await Promise.all([
                fetchServerConfig(),
                handleCheckAll()
            ]);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchServerConfig = async () => {
        try {
            const configData = await getServerConfig();
            setServerConfig(configData);
        } catch (error) {
            console.error('Failed to fetch server config:', error);
            setServerConfig(null);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            fetchServerConfig(),
            handleCheckAll()
        ]);
        setRefreshing(false);
    };

    const handleSaveUrl = async () => {
        try {
            if (!tempUrl.startsWith('http://') && !tempUrl.startsWith('https://')) {
                Alert.alert('Invalid URL', 'URL must start with http:// or https://');
                return;
            }

            await AsyncStorage.setItem(STORAGE_KEY_API_URL, tempUrl);
            setApiUrl(tempUrl);
            updateBaseUrl(tempUrl);
            setIsEditingUrl(false);

            Alert.alert('Success', 'API URL updated successfully');
            await fetchServerConfig();
            await checkRelay(); // Check new URL
        } catch (error) {
            Alert.alert('Error', 'Failed to save API URL');
            console.error(error);
        }
    };

    const checkRelay = async () => {
        setCheckingStatus(prev => ({ ...prev, relay: true }));
        const status = await checkServerHealth();
        setRelayStatus(status);
        setCheckingStatus(prev => ({ ...prev, relay: false }));
        return status;
    };

    const checkPython = async () => {
        setCheckingStatus(prev => ({ ...prev, python: true }));
        const status = await checkPythonHealth();
        setPythonStatus(status);
        setCheckingStatus(prev => ({ ...prev, python: false }));
        return status;
    };

    const checkLaravel = async () => {
        setCheckingStatus(prev => ({ ...prev, laravel: true }));
        const status = await checkLaravelHealth();
        setLaravelStatus(status);
        setCheckingStatus(prev => ({ ...prev, laravel: false }));
        return status;
    };

    const handleCheckAll = async () => {
        setCheckingStatus(prev => ({ ...prev, all: true }));
        await Promise.all([
            checkRelay(),
            checkPython(),
            checkLaravel()
        ]);
        setCheckingStatus(prev => ({ ...prev, all: false }));
    };

    const handleTestUnlock = async () => {
        setTestingUnlock(true);
        try {
            const result = await unlockDoor();
            setTestingUnlock(false);
            if (result.success) {
                Alert.alert('🔓 Success!', 'Door unlocked successfully!');
                await checkRelay();
            } else {
                Alert.alert('❌ Unlock Failed', result.error || 'Failed to unlock door');
            }
        } catch (error: any) {
            setTestingUnlock(false);
            Alert.alert('❌ Error', error.message || 'Failed to test unlock');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading settings...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#4CAF50"
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Settings</Text>
                    <Text style={styles.subtitle}>Manage kiosk configuration</Text>
                </View>

                {/* Server Connectivity Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Server Connections</Text>
                        <TouchableOpacity
                            style={[styles.checkAllButton, checkingStatus.all && styles.buttonDisabled]}
                            onPress={handleCheckAll}
                            disabled={checkingStatus.all}
                        >
                            {checkingStatus.all ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.checkAllButtonText}>Check All Servers</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.connectivityCard}>
                        {/* Relay Server */}
                        <ServerUrlItem
                            label="Relay Server (Local)"
                            url={apiUrl}
                            status={relayStatus}
                            isChecking={checkingStatus.relay}
                            onCheck={checkRelay}
                            isEditable
                            onEdit={() => setIsEditingUrl(true)}
                        />

                        {/* Python API */}
                        <ServerUrlItem
                            label="Python Face API"
                            url={config.python.baseUrl}
                            status={pythonStatus}
                            isChecking={checkingStatus.python}
                            onCheck={checkPython}
                        />

                        {/* Laravel API */}
                        <ServerUrlItem
                            label="Laravel Backend API"
                            url={config.laravel.baseUrl}
                            status={laravelStatus}
                            isChecking={checkingStatus.laravel}
                            onCheck={checkLaravel}
                            isLast
                        />
                    </View>
                </View>

                {/* Test Relay Hardware */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hardware Testing</Text>
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={[styles.testUnlockButton, (testingUnlock || !relayStatus?.online) && styles.testUnlockButtonDisabled]}
                            onPress={handleTestUnlock}
                            disabled={testingUnlock || !relayStatus?.online}
                        >
                            {testingUnlock ? (
                                <>
                                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.testUnlockButtonText}>Testing Unlock...</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.testUnlockIcon}>🔓</Text>
                                    <Text style={styles.testUnlockButtonText}>Test Relay Hardware</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {!relayStatus?.online && (
                            <Text style={styles.testUnlockHint}>
                                ⚠️ Relay must be online to test unlock
                            </Text>
                        )}
                    </View>
                </View>

                {/* Relay Config Details (Read-only) */}
                {serverConfig && serverConfig.success && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Relay Details</Text>
                        <View style={styles.card}>
                            <ConfigItem label="Device ID" value={serverConfig.config?.device_id || 'N/A'} />
                            <ConfigItem label="Relay IP" value={serverConfig.config?.local_ip || 'N/A'} />
                            <ConfigItem label="Version" value={serverConfig.config?.version || 'N/A'} />
                            <ConfigItem label="Status" value={serverConfig.config?.local_key_configured ? 'Configured ✅' : 'Missing Key ❌'} />
                            <ConfigItem label="Port" value={serverConfig.server?.port?.toString() || 'N/A'} />
                            <ConfigItem label="Duration" value={`${serverConfig.server?.unlock_duration || 0}ms`} isLast />
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.instructionsButton}
                    onPress={() => router.push('/setup')}
                >
                    <Text style={styles.instructionsButtonText}>📖 View Setup Instructions</Text>
                </TouchableOpacity>

                <View style={styles.spacer} />
            </ScrollView>

            {/* Modal for editing Relay URL */}
            <Modal
                visible={isEditingUrl}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Relay URL</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={tempUrl}
                            onChangeText={setTempUrl}
                            placeholder="http://localhost:3000"
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveUrl}>
                                <Text style={styles.saveButtonText}>Save URL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditingUrl(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// Server URL Item Component
function ServerUrlItem({
    label,
    url,
    status,
    isChecking,
    onCheck,
    isEditable = false,
    onEdit,
    isLast = false
}: any) {
    return (
        <View style={[styles.urlItem, !isLast && styles.urlItemBorder]}>
            <View style={styles.urlItemHeader}>
                <Text style={styles.urlItemLabel}>{label}</Text>
                <View style={styles.statusBadge}>
                    <View style={[
                        styles.statusDot,
                        { backgroundColor: status ? (status.online ? '#4CAF50' : '#F44336') : '#555' }
                    ]} />
                    <Text style={[
                        styles.statusText,
                        { color: status ? (status.online ? '#4CAF50' : '#F44336') : '#aaa' }
                    ]}>
                        {status ? (status.online ? 'Online' : 'Offline') : 'Checking...'}
                    </Text>
                </View>
            </View>

            {status && !status.online && status.error && (
                <Text style={styles.errorText}>Error: {status.error}</Text>
            )}

            <View style={styles.urlRow}>
                <View style={styles.urlDisplay}>
                    <Text style={styles.urlText} numberOfLines={1}>{url}</Text>
                    {isEditable && (
                        <TouchableOpacity onPress={onEdit} style={styles.miniEditButton}>
                            <Text style={{ fontSize: 12 }}>✏️</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.miniCheckButton, isChecking && styles.buttonDisabled]}
                    onPress={onCheck}
                    disabled={isChecking}
                >
                    {isChecking ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.miniCheckButtonText}>Check</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

function ConfigItem({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean; }) {
    return (
        <View style={[styles.configItem, !isLast && styles.configItemBorder]}>
            <Text style={styles.configLabel}>{label}</Text>
            <Text style={styles.configValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f0f',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 12,
    },
    header: {
        marginBottom: 30,
    },
    backButton: {
        marginBottom: 16,
    },
    backText: {
        color: '#4CAF50',
        fontSize: 18,
        fontWeight: '600',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        marginTop: 4,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    checkAllButton: {
        backgroundColor: '#1f1f1f',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    checkAllButtonText: {
        color: '#4CAF50',
        fontSize: 13,
        fontWeight: '600',
    },
    connectivityCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: '#222',
    },
    card: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#222',
    },
    urlItem: {
        padding: 16,
    },
    urlItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    urlItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    errorText: {
        fontSize: 12,
        color: '#F44336',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    urlItemLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#eee',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#000',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    urlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    urlDisplay: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    urlText: {
        flex: 1,
        color: '#666',
        fontSize: 13,
    },
    miniEditButton: {
        padding: 4,
        marginLeft: 8,
    },
    miniCheckButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    miniCheckButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    testUnlockButton: {
        backgroundColor: '#FF9800',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 12,
    },
    testUnlockButtonDisabled: {
        backgroundColor: '#333',
        opacity: 0.5,
    },
    testUnlockIcon: {
        fontSize: 22,
        marginRight: 10,
    },
    testUnlockButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    testUnlockHint: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
    },
    configItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    configItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    configLabel: {
        fontSize: 15,
        color: '#888',
    },
    configValue: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
    },
    instructionsButton: {
        backgroundColor: '#1f1f1f',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        marginTop: 20,
    },
    instructionsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    spacer: {
        height: 60,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#333',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    modalInput: {
        backgroundColor: '#0a0a0a',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#4CAF50',
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#333',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
