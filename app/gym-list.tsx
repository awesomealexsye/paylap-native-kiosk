/**
 * Gym List Screen - View and switch between gyms
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import gymService from '../services/gymService';
import authService from '../services/authService';
import { Gym } from '../types/auth';

export default function GymListScreen() {
    const { user, selectedGym, selectGym } = useAuth();
    const [gyms, setGyms] = useState<Gym[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchGyms();
    }, []);

    const fetchGyms = async () => {
        try {
            if (!user) {
                setError('User not found');
                return;
            }

            const token = await authService.getAuthToken();
            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await gymService.fetchGymList(user.id, token, user.auth_key);
            if (response.status && response.data) {
                setGyms(response.data);
            } else {
                setError(response.message || 'Failed to load gyms');
            }
        } catch (err: any) {
            setError('Failed to load gyms');
            console.error('Gym fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectGym = async (gym: Gym) => {
        try {
            await selectGym(gym);
            router.back();
        } catch (err) {
            console.error('Gym selection error:', err);
        }
    };

    const handleViewDetails = (gym: Gym) => {
        router.push({
            pathname: '/gym-details',
            params: { gymId: gym.id },
        });
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading gyms...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>My Gyms</Text>
                    <Text style={styles.subtitle}>{gyms.length} gym(s) found</Text>
                </View>
                <View style={styles.placeholder} />
            </View>

            {/* Gym List */}
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {gyms.map((gym) => (
                    <View key={gym.id} style={styles.gymCard}>
                        <TouchableOpacity
                            style={styles.gymContent}
                            onPress={() => handleViewDetails(gym)}
                        >
                            <View style={styles.gymLogo}>
                                {gym.logo_url ? (
                                    <Image source={{ uri: gym.logo_url }} style={styles.logoImage} />
                                ) : (
                                    <Text style={styles.logoPlaceholder}>
                                        {gym.name.charAt(0).toUpperCase()}
                                    </Text>
                                )}
                            </View>

                            <View style={styles.gymInfo}>
                                <View style={styles.gymTitleRow}>
                                    <Text style={styles.gymName}>{gym.name}</Text>
                                    {selectedGym?.id === gym.id && (
                                        <View style={styles.activeBadge}>
                                            <Text style={styles.activeBadgeText}>ACTIVE</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.gymAddress} numberOfLines={1}>
                                    📍 {gym.address}
                                </Text>
                                <View style={styles.gymStats}>
                                    <Text style={styles.gymStat}>
                                        👥 {gym.members_count || 0} Members
                                    </Text>
                                    <Text style={styles.gymStat}>
                                        💪 {gym.trainers_count || 0} Trainers
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {selectedGym?.id !== gym.id && (
                            <TouchableOpacity
                                style={styles.selectButton}
                                onPress={() => handleSelectGym(gym)}
                            >
                                <Text style={styles.selectButtonText}>Select</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                {gyms.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🏋️</Text>
                        <Text style={styles.emptyText}>No gyms found</Text>
                        <Text style={styles.emptySubtext}>Contact support to add a gym</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
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
    headerContent: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    gymCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#252525',
        overflow: 'hidden',
    },
    gymContent: {
        flexDirection: 'row',
        padding: 16,
    },
    gymLogo: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: '#252525',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    logoImage: {
        width: 64,
        height: 64,
        borderRadius: 12,
    },
    logoPlaceholder: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    gymInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    gymTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    gymName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    activeBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    gymAddress: {
        fontSize: 14,
        color: '#888',
        marginBottom: 8,
    },
    gymStats: {
        flexDirection: 'row',
        gap: 16,
    },
    gymStat: {
        fontSize: 12,
        color: '#aaa',
    },
    selectButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#252525',
    },
    selectButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#888',
    },
});
