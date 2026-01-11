import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import gymService from '../services/gymService';
import authService from '../services/authService';
import { GymMember } from '../types/auth';

export default function GymMembersScreen() {
    const params = useLocalSearchParams();
    const gymId = parseInt(params.gymId as string);
    const { user } = useAuth();

    const [members, setMembers] = useState<GymMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchMembers = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            if (!user) return;

            const token = await authService.getAuthToken();
            if (!token) return;

            const response = await gymService.fetchMembers(gymId, user.id, token, user.auth_key);
            if (response.status && response.data) {
                setMembers(response.data);
            } else {
                setError(response.message || 'Failed to load members');
            }
        } catch (err) {
            setError('Failed to load members');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [gymId, user]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const renderMemberItem = ({ item }: { item: GymMember }) => (
        <View style={styles.memberCard}>
            <View style={styles.memberHeader}>
                <TouchableOpacity
                    style={styles.profileContainer}
                    onPress={() => item.profile_photo_url && setSelectedImage(item.profile_photo_url)}
                >
                    {item.profile_photo_url ? (
                        <Image source={{ uri: item.profile_photo_url }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.profilePlaceholder}>
                            <Text style={styles.profilePlaceholderText}>
                                {item.full_name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
                <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.full_name}</Text>
                    <Text style={styles.memberCode}>{item.member_code}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'active' ? styles.activeBadge : styles.inactiveBadge]}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.memberDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📞</Text>
                    <Text style={styles.detailText}>{item.phone_number}</Text>
                </View>
                {item.subscription && (
                    <View style={styles.subscriptionInfo}>
                        <View style={styles.divider} />
                        <View style={styles.subscriptionHeader}>
                            <Text style={styles.subscriptionTitle}>Subscription Status</Text>
                            <Text style={[
                                styles.daysRemaining,
                                (item.subscription.remaining_days || 0) <= 5 ? styles.expiryWarning : null
                            ]}>
                                {item.subscription.remaining_days !== null
                                    ? `${item.subscription.remaining_days} days left`
                                    : 'No active plan'}
                            </Text>
                        </View>
                        <View style={styles.subscriptionFooter}>
                            <Text style={styles.paymentStatus}>
                                Payment: <Text style={{ color: item.subscription.payment_status === 'paid' ? '#4CAF50' : '#FFC107' }}>
                                    {item.subscription.payment_status.toUpperCase()}
                                </Text>
                            </Text>
                            {item.subscription.amount_due > 0 && (
                                <Text style={styles.amountDue}>Due: ₹{item.subscription.amount_due}</Text>
                            )}
                        </View>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gym Members</Text>
                <View style={styles.placeholder} />
            </View>

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading members...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchMembers()}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={members}
                    renderItem={renderMemberItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={() => fetchMembers(true)}
                            tintColor="#4CAF50"
                            colors={['#4CAF50']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No members found</Text>
                        </View>
                    }
                />
            )}

            {/* Full Screen Image Modal */}
            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.modalBackground}>
                    <TouchableOpacity
                        style={styles.modalCloseArea}
                        activeOpacity={1}
                        onPress={() => setSelectedImage(null)}
                    >
                        <Image
                            source={{ uri: selectedImage || '' }}
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                        />
                        <TouchableOpacity
                            style={styles.closeImageButton}
                            onPress={() => setSelectedImage(null)}
                        >
                            <Text style={styles.closeImageText}>✕</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
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
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseArea: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '90%',
        height: '80%',
    },
    closeImageButton: {
        position: 'absolute',
        top: 60,
        right: 30,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeImageText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: '#fff',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    placeholder: {
        width: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
    },
    errorText: {
        color: '#ff6666',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 15,
        paddingBottom: 30,
    },
    memberCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#252525',
    },
    memberHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    profileContainer: {
        marginRight: 15,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#333',
    },
    profilePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePlaceholderText: {
        color: '#4CAF50',
        fontSize: 20,
        fontWeight: 'bold',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    memberCode: {
        color: '#888',
        fontSize: 14,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    activeBadge: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    inactiveBadge: {
        backgroundColor: 'rgba(255, 102, 102, 0.1)',
        borderWidth: 1,
        borderColor: '#ff6666',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    memberDetails: {
        marginTop: 5,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailIcon: {
        fontSize: 16,
        marginRight: 10,
        width: 20,
    },
    detailText: {
        color: '#ccc',
        fontSize: 14,
    },
    subscriptionInfo: {
        marginTop: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#252525',
        marginBottom: 12,
    },
    subscriptionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    subscriptionTitle: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold',
    },
    daysRemaining: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    expiryWarning: {
        color: '#FFC107',
    },
    subscriptionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentStatus: {
        color: '#ccc',
        fontSize: 12,
    },
    amountDue: {
        color: '#ff6666',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        padding: 50,
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
    },
});
