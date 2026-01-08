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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkServerHealth, getServerConfig } from '../services/serverHealthService';
import { config, updateBaseUrl, getRelayUrl } from '../constants/config';
import { unlockDoor } from '../services/relayService';

const STORAGE_KEY_API_URL = '@kiosk_api_url';

export default function SettingsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [serverConfig, setServerConfig] = useState<any>(null);
    const [serverStatus, setServerStatus] = useState<any>(null);
    const [checkingStatus, setCheckingStatus] = useState(false);
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

            // Fetch server config
            await fetchServerConfig();
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

            // Also check status
            const status = await checkServerHealth();
            setServerStatus(status);
        } catch (error) {
            console.error('Failed to fetch server config:', error);
            setServerConfig(null);
            setServerStatus({ online: false, message: 'Failed to connect' });
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchServerConfig();
        setRefreshing(false);
    };

    const handleSaveUrl = async () => {
        try {
            // Validate URL
            if (!tempUrl.startsWith('http://') && !tempUrl.startsWith('https://')) {
                Alert.alert('Invalid URL', 'URL must start with http:// or https://');
                return;
            }

            // Save to storage
            await AsyncStorage.setItem(STORAGE_KEY_API_URL, tempUrl);
            setApiUrl(tempUrl);
            updateBaseUrl(tempUrl);
            setIsEditingUrl(false);

            Alert.alert('Success', 'API URL updated successfully');

            // Refresh server config with new URL
            await fetchServerConfig();
        } catch (error) {
            Alert.alert('Error', 'Failed to save API URL');
            console.error(error);
        }
    };

    const handleCheckStatus = async () => {
        setCheckingStatus(true);
        const status = await checkServerHealth();
        setServerStatus(status);
        setCheckingStatus(false);

        if (status.online) {
            Alert.alert('✅ Server Online', 'Relay server is running and reachable');
        } else {
            Alert.alert('❌ Server Offline', status.message || 'Cannot reach relay server');
        }
    };

    const handleTestUnlock = async () => {
        setTestingUnlock(true);

        try {
            console.log('🔓 Testing relay unlock...');
            const result = await unlockDoor();

            setTestingUnlock(false);

            if (result.success) {
                Alert.alert(
                    '🔓 Success!',
                    'Door unlocked successfully! The relay should be ON for 3 seconds.\n\nCheck the hardware - the relay should have turned ON briefly.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Refresh server status
                                handleCheckStatus();
                            }
                        }
                    ]
                );
            } else {
                Alert.alert(
                    '❌ Unlock Failed',
                    result.error || result.message || 'Failed to unlock door.\n\nPossible issues:\n• Relay hardware not connected\n• Server not communicating with relay\n• Network issue'
                );
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

                {/* API URL Configuration */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>API Configuration</Text>

                    <View style={styles.card}>
                        <Text style={styles.label}>Relay Server URL</Text>
                        <View style={styles.urlContainer}>
                            <TextInput
                                style={[styles.urlInput, !isEditingUrl && styles.urlInputDisabled]}
                                value={isEditingUrl ? tempUrl : apiUrl}
                                onChangeText={setTempUrl}
                                editable={isEditingUrl}
                                placeholder="http://localhost:3000"
                                placeholderTextColor="#666"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {!isEditingUrl ? (
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => {
                                        setIsEditingUrl(true);
                                        setTempUrl(apiUrl);
                                    }}
                                >
                                    <Text style={styles.editIcon}>✏️</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.editActions}>
                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={handleSaveUrl}
                                    >
                                        <Text style={styles.saveButtonText}>Save</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => {
                                            setIsEditingUrl(false);
                                            setTempUrl(apiUrl);
                                        }}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        <Text style={styles.hint}>
                            💡 Server must run on this same device (localhost:3000)
                        </Text>
                    </View>
                </View>

                {/* Server Status */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Server Status</Text>

                    <View style={styles.card}>
                        <View style={styles.statusRow}>
                            <View style={styles.statusInfo}>
                                <Text style={styles.statusLabel}>Connection Status</Text>
                                <View style={styles.statusBadge}>
                                    <View style={[
                                        styles.statusDot,
                                        { backgroundColor: serverStatus?.online ? '#4CAF50' : '#F44336' }
                                    ]} />
                                    <Text style={[
                                        styles.statusText,
                                        { color: serverStatus?.online ? '#4CAF50' : '#F44336' }
                                    ]}>
                                        {serverStatus?.online ? 'Online' : 'Offline'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.checkButton}
                                onPress={handleCheckStatus}
                                disabled={checkingStatus}
                            >
                                {checkingStatus ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.checkButtonText}>Check</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Test Relay Hardware */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Test Relay</Text>

                    <View style={styles.card}>
                        {/* Test Unlock Button */}
                        <TouchableOpacity
                            style={[styles.testUnlockButton, (testingUnlock || !serverStatus?.online) && styles.testUnlockButtonDisabled]}
                            onPress={handleTestUnlock}
                            disabled={testingUnlock || !serverStatus?.online}
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

                        {!serverStatus?.online && (
                            <Text style={styles.testUnlockHint}>
                                ⚠️ Server must be online to test unlock
                            </Text>
                        )}

                        <Text style={styles.testDescription}>
                            This will trigger the relay to unlock for 3 seconds. Watch the physical relay hardware to confirm it works.
                        </Text>
                    </View>
                </View>

                {/* Server Configuration (Read-only) */}
                {serverConfig && serverConfig.success && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Server Configuration</Text>

                        <View style={styles.card}>
                            <ConfigItem
                                label="Device ID"
                                value={serverConfig.config?.device_id || 'N/A'}
                            />
                            <ConfigItem
                                label="Relay IP"
                                value={serverConfig.config?.local_ip || 'N/A'}
                            />
                            <ConfigItem
                                label="Protocol Version"
                                value={serverConfig.config?.version || 'N/A'}
                            />
                            <ConfigItem
                                label="Local Key Configured"
                                value={serverConfig.config?.local_key_configured ? 'Yes ✅' : 'No ❌'}
                            />
                            <ConfigItem
                                label="Server Port"
                                value={serverConfig.server?.port?.toString() || 'N/A'}
                            />
                            <ConfigItem
                                label="Unlock Duration"
                                value={`${serverConfig.server?.unlock_duration || 0}ms`}
                                isLast
                            />
                        </View>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.instructionsButton}
                        onPress={() => router.push('/setup')}
                    >
                        <Text style={styles.instructionsIcon}>📖</Text>
                        <Text style={styles.instructionsButtonText}>
                            View Setup Instructions
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Info */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        💡 Pull down to refresh server configuration
                    </Text>
                </View>

                <View style={styles.spacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

// Config Item Component
function ConfigItem({ label, value, isLast = false }: {
    label: string;
    value: string;
    isLast?: boolean;
}) {
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
        backgroundColor: '#1a1a1a',
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#252525',
        borderRadius: 12,
        padding: 16,
    },
    label: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 8,
    },
    urlContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    urlInput: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    urlInputDisabled: {
        borderColor: '#333',
        color: '#aaa',
    },
    editButton: {
        width: 44,
        height: 44,
        backgroundColor: '#333',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIcon: {
        fontSize: 20,
    },
    editActions: {
        flexDirection: 'row',
        gap: 8,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#666',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    hint: {
        fontSize: 12,
        color: '#888',
        marginTop: 8,
        fontStyle: 'italic',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusInfo: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
    },
    checkButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    checkButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    testUnlockButton: {
        backgroundColor: '#FF9800',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 10,
    },
    testUnlockButtonDisabled: {
        backgroundColor: '#666',
        opacity: 0.5,
    },
    testUnlockIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    testUnlockButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    testUnlockHint: {
        fontSize: 12,
        color: '#FFA500',
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
    testDescription: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 18,
    },
    configItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    configItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    configLabel: {
        fontSize: 14,
        color: '#aaa',
    },
    configValue: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
    },
    instructionsButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    instructionsIcon: {
        fontSize: 24,
    },
    instructionsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 8,
        padding: 12,
        marginTop: 16,
    },
    infoText: {
        color: '#4CAF50',
        fontSize: 13,
        textAlign: 'center',
    },
    spacer: {
        height: 40,
    },
});
