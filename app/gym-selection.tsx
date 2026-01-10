/**
 * Gym Selection Screen - Choose which gym to use for this kiosk
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
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import gymService from '../services/gymService';
import authService from '../services/authService';
import { Gym } from '../types/auth';

export default function GymSelectionScreen() {
    const params = useLocalSearchParams();
    const userId = parseInt(params.userId as string);
    const { selectGym } = useAuth();

    const [gyms, setGyms] = useState<Gym[]>([]);
    const [selectedGymId, setSelectedGymId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchGyms();
    }, []);

    const fetchGyms = async () => {
        try {
            // Get auth data
            const user = await authService.getCurrentUser();
            const token = await authService.getAuthToken();

            if (!user || !token) {
                setError('Authentication expired. Please login again.');
                return;
            }

            const response = await gymService.fetchGymList(userId, token, user.auth_key);
            if (response.status && response.data) {
                setGyms(response.data);
                if (response.data.length === 1) {
                    setSelectedGymId(response.data[0].id);
                }
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

    const handleConfirm = async () => {
        if (!selectedGymId) {
            setError('Please select a gym');
            return;
        }

        const selectedGym = gyms.find((g) => g.id === selectedGymId);
        if (!selectedGym) {
            setError('Invalid gym selection');
            return;
        }

        setIsSaving(true);
        try {
            await selectGym(selectedGym);
            // Navigate to main kiosk screen
            router.replace('/');
        } catch (err) {
            setError('Failed to save gym selection');
            console.error('Gym selection error:', err);
        } finally {
            setIsSaving(false);
        }
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

    if (error && gyms.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchGyms}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.icon}>🏋️</Text>
                <Text style={styles.title}>Select Your Gym</Text>
                <Text style={styles.subtitle}>
                    Choose which gym this kiosk will be used for
                </Text>
            </View>

            {/* Gym List */}
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {gyms.map((gym) => (
                    <TouchableOpacity
                        key={gym.id}
                        style={[
                            styles.gymCard,
                            selectedGymId === gym.id && styles.gymCardSelected,
                        ]}
                        onPress={() => {
                            setSelectedGymId(gym.id);
                            setError('');
                        }}
                    >
                        {/* Logo placeholder or actual logo */}
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
                            <Text style={styles.gymName}>{gym.name}</Text>
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

                        {selectedGymId === gym.id && (
                            <View style={styles.checkMark}>
                                <Text style={styles.checkMarkIcon}>✓</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Error Display */}
            {error ? (
                <View style={styles.bottomError}>
                    <Text style={styles.bottomErrorText}>{error}</Text>
                </View>
            ) : null}

            {/* Confirm Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        (!selectedGymId || isSaving) && styles.confirmButtonDisabled,
                    ]}
                    onPress={handleConfirm}
                    disabled={!selectedGymId || isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.confirmButtonText}>Confirm Selection</Text>
                    )}
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
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    header: {
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    icon: {
        fontSize: 48,
        marginBottom: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    gymCard: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#252525',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    gymCardSelected: {
        borderColor: '#4CAF50',
        backgroundColor: '#1a3a1d',
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
    gymName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
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
    checkMark: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    checkMarkIcon: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    bottomError: {
        backgroundColor: '#ff444420',
        padding: 12,
        marginHorizontal: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ff4444',
    },
    bottomErrorText: {
        color: '#ff6666',
        fontSize: 14,
        textAlign: 'center',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
    },
    confirmButton: {
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
    confirmButtonDisabled: {
        backgroundColor: '#2a5a2d',
        shadowOpacity: 0,
    },
    confirmButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
});
