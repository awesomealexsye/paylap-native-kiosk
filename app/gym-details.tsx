/**
 * Gym Details Screen - View detailed information about a gym
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import gymService from '../services/gymService';
import authService from '../services/authService';
import { Gym } from '../types/auth';

export default function GymDetailsScreen() {
    const params = useLocalSearchParams();
    const gymId = parseInt(params.gymId as string);
    const { user, selectedGym, selectGym } = useAuth();

    const [gym, setGym] = useState<Gym | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchGymDetails();
    }, []);

    const fetchGymDetails = async () => {
        try {
            if (!user) return;

            const token = await authService.getAuthToken();
            if (!token) return;

            const response = await gymService.fetchGymList(user.id, token, user.auth_key);
            if (response.status && response.data) {
                const foundGym = response.data.find((g) => g.id === gymId);
                if (foundGym) {
                    setGym(foundGym);
                } else {
                    setError('Gym not found');
                }
            }
        } catch (err) {
            setError('Failed to load gym details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectGym = async () => {
        if (gym) {
            await selectGym(gym);
            router.back();
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading gym details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !gym) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>{error || 'Gym not found'}</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const isCurrentGym = selectedGym?.id === gym.id;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Gym Details</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Gym Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.gymLogoLarge}>
                        {gym.logo_url ? (
                            <Image source={{ uri: gym.logo_url }} style={styles.logoImageLarge} />
                        ) : (
                            <Text style={styles.logoPlaceholderLarge}>
                                {gym.name.charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Gym Info */}
                <View style={styles.infoCard}>
                    <View style={styles.titleRow}>
                        <Text style={styles.gymName}>{gym.name}</Text>
                        {isCurrentGym && (
                            <View style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>ACTIVE</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>📍</Text>
                        <Text style={styles.infoText}>{gym.address}</Text>
                    </View>

                    {gym.phone && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoIcon}>📞</Text>
                            <Text style={styles.infoText}>{gym.phone}</Text>
                        </View>
                    )}

                    {gym.email && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoIcon}>📧</Text>
                            <Text style={styles.infoText}>{gym.email}</Text>
                        </View>
                    )}
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>Statistics</Text>
                    <View style={styles.statsGrid}>
                        <TouchableOpacity
                            style={styles.statCard}
                            onPress={() => router.push({
                                pathname: '/gym-members',
                                params: { gymId: gym.id }
                            })}
                        >
                            <Text style={styles.statIcon}>👥</Text>
                            <Text style={styles.statValue}>{gym.members_count || 0}</Text>
                            <Text style={styles.statLabel}>Members</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Select Button */}
                {!isCurrentGym && (
                    <View style={styles.actionContainer}>
                        <TouchableOpacity style={styles.selectButton} onPress={handleSelectGym}>
                            <Text style={styles.selectButtonText}>Use This Gym</Text>
                        </TouchableOpacity>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    errorText: {
        color: '#ff6666',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
    },
    headerBackButton: {
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    gymLogoLarge: {
        width: 120,
        height: 120,
        borderRadius: 24,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    logoImageLarge: {
        width: 120,
        height: 120,
        borderRadius: 24,
    },
    logoPlaceholderLarge: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    infoCard: {
        backgroundColor: '#1a1a1a',
        marginHorizontal: 24,
        marginBottom: 24,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#252525',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    gymName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    activeBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    activeBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoIcon: {
        fontSize: 20,
        marginRight: 12,
        width: 30,
    },
    infoText: {
        fontSize: 16,
        color: '#fff',
        flex: 1,
    },
    statsContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#252525',
    },
    statIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 14,
        color: '#888',
    },
    actionContainer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    selectButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    selectButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
