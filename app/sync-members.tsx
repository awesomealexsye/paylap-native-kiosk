import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Modal,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import syncService, { CachedMember } from '../services/syncService';

const STORAGE_KEYS = {
    CACHED_MEMBERS: 'sync_cached_members',
    LAST_SYNC_TIME: 'sync_last_sync_time',
};

export default function SyncMembersScreen() {
    const { token, selectedGym } = useAuth();
    const [members, setMembers] = useState<CachedMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [syncResult, setSyncResult] = useState<any>(null);

    // Load cached data from AsyncStorage on mount
    useEffect(() => {
        loadCachedData();
    }, []);

    const loadCachedData = async () => {
        try {
            const [cachedMembers, cachedSyncTime] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.CACHED_MEMBERS),
                AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME),
            ]);

            if (cachedMembers) {
                setMembers(JSON.parse(cachedMembers));
            }
            if (cachedSyncTime) {
                setLastSyncTime(cachedSyncTime);
            }
        } catch (error) {
            console.error('❌ Error loading cached data:', error);
        }
    };

    const saveCachedData = async (membersData: CachedMember[], syncTime: string | null) => {
        try {
            await Promise.all([
                AsyncStorage.setItem(STORAGE_KEYS.CACHED_MEMBERS, JSON.stringify(membersData)),
                AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, syncTime || ''),
            ]);
        } catch (error) {
            console.error('❌ Error saving cached data:', error);
        }
    };

    const clearCachedData = async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEYS.CACHED_MEMBERS),
                AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC_TIME),
            ]);
            setMembers([]);
            setLastSyncTime(null);
        } catch (error) {
            console.error('❌ Error clearing cached data:', error);
        }
    };

    const fetchCachedMembers = useCallback(async (showRefreshing = false) => {
        if (!token) return;
        if (showRefreshing) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const response = await syncService.getCachedMembers(token, selectedGym?.id);
            console.log("synmember", response);

            const membersData = response.members || [];
            const syncTime = response.last_sync_time;

            setMembers(membersData);
            setLastSyncTime(syncTime);

            // Save to AsyncStorage
            await saveCachedData(membersData, syncTime);
        } catch (error) {
            console.error('❌ Error fetching cached members:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [token, selectedGym?.id]);

    useEffect(() => {
        fetchCachedMembers();
    }, [fetchCachedMembers]);

    const handleSync = async () => {
        if (!token) return;

        // Clear cached data when starting a full sync
        await clearCachedData();

        setIsSyncing(true);
        try {
            const result = await syncService.syncMembers(token, selectedGym?.id);
            setSyncResult(result);
            if (result.success) {
                await fetchCachedMembers();
                setShowSuccessModal(true);
            } else {
                alert(`Sync failed: ${result.message}`);
            }
        } catch (error) {
            console.error('❌ Sync handle error:', error);
            alert('An error occurred during synchronization.');
        } finally {
            setIsSyncing(false);
        }
    };

    const formatDateTime = (isoString: string | null) => {
        if (!isoString) return 'Never';
        try {
            const date = new Date(isoString);

            // Convert to IST (UTC+5:30)
            const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));

            return istDate.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata',
            });
        } catch (e) {
            return isoString;
        }
    };

    const renderMemberItem = ({ item }: { item: CachedMember }) => (
        <View style={styles.memberItem}>
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberDetail}>ID: {item.id} • Gym: {item.gym_id}</Text>
            </View>
            <View style={[styles.statusBadge, item.has_encoding ? styles.statusActive : styles.statusInactive]}>
                <Text style={styles.statusText}>
                    {item.has_encoding ? 'Encrypted' : 'No Encoding'}
                </Text>
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>📭</Text>
            </View>
            <Text style={styles.emptyTitle}>No Members Synced</Text>
            <Text style={styles.emptyDescription}>
                Tap "Start Full Sync" above to download member data from the cloud and enable face recognition.
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Member Sync</Text>
                    <Text style={styles.subtitle}>{members.length} members in local database</Text>
                </View>
            </View>

            {/* Sync Status Card */}
            <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                    <Text style={styles.statusTitle}>Local Cache Status</Text>
                    <View style={styles.pulseContainer}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.pulseText}>Python API Online</Text>
                    </View>
                </View>
                <View style={styles.lastSyncContainer}>
                    <Text style={styles.lastSyncLabel}>Last Synced:</Text>
                    <Text style={styles.lastSyncValue}>{formatDateTime(lastSyncTime)}</Text>
                </View>
                <Text style={styles.statusDescription}>
                    Synchronize your cloud member database with the local face recognition engine for offline-capable access.
                </Text>
                <TouchableOpacity
                    style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
                    onPress={handleSync}
                    disabled={isSyncing}
                >
                    {isSyncing ? (
                        <View style={styles.syncingContent}>
                            <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.syncButtonText}>Syncing Encodings...</Text>
                        </View>
                    ) : (
                        <Text style={styles.syncButtonText}>🔄 Start Full Sync</Text>
                    )}
                </TouchableOpacity>
                {isSyncing && (
                    <Text style={styles.syncNote}>
                        This may take a few minutes. You can leave this screen; the sync will continue in the background.
                    </Text>
                )}
            </View>

            {/* Member List */}
            <View style={styles.listContainer}>
                <Text style={styles.listTitle}>Synced Members</Text>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                    </View>
                ) : (
                    <FlatList
                        data={members}
                        renderItem={renderMemberItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={() => fetchCachedMembers(true)}
                                tintColor="#4CAF50"
                            />
                        }
                        ListEmptyComponent={renderEmptyState}
                    />
                )}
            </View>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.successIconContainer}>
                            <Text style={styles.successIcon}>✅</Text>
                        </View>
                        <Text style={styles.modalTitle}>Sync Complete!</Text>
                        <Text style={styles.modalMessage}>
                            Successfully synchronized {syncResult?.members_synced || 0} members with the face recognition database.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalConfirmButton}
                            onPress={() => setShowSuccessModal(false)}
                        >
                            <Text style={styles.modalConfirmText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    backIcon: {
        fontSize: 24,
        color: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        marginTop: 2,
    },
    statusCard: {
        backgroundColor: '#1a1a1a',
        marginHorizontal: 24,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 24,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    pulseContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0d2211',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
        marginRight: 6,
    },
    pulseText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: '600',
    },
    statusDescription: {
        color: '#aaa',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
    },
    lastSyncContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#252525',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    lastSyncLabel: {
        color: '#888',
        fontSize: 13,
        marginRight: 8,
    },
    lastSyncValue: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    syncButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    syncButtonDisabled: {
        backgroundColor: '#2e5a31',
    },
    syncButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    syncingContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    syncNote: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    listTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    listContent: {
        paddingBottom: 24,
    },
    memberItem: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#252525',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    memberDetail: {
        color: '#666',
        fontSize: 13,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusActive: {
        backgroundColor: '#0d2211',
    },
    statusInactive: {
        backgroundColor: '#2a1a1a',
    },
    statusText: {
        color: '#4CAF50',
        fontSize: 11,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateContainer: {
        paddingVertical: 60,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#1a1a1a',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#333',
    },
    emptyIcon: {
        fontSize: 50,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyDescription: {
        color: '#666',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    successIconContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#0d2211',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    successIcon: {
        fontSize: 40,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 16,
        color: '#aaa',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalConfirmButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    modalConfirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
