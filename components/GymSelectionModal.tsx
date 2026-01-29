/**
 * Gym Selection Modal Component
 * Shown in kiosk screen when no gym is selected
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
    Modal,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import gymService from '../services/gymService';
import authService from '../services/authService';
import { Gym } from '../types/auth';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

interface GymSelectionModalProps {
    visible: boolean;
    onClose?: () => void;
}

export const GymSelectionModal: React.FC<GymSelectionModalProps> = ({ visible, onClose }) => {
    const { selectGym, user, token } = useAuth();
    const [gyms, setGyms] = useState<Gym[]>([]);
    const [selectedGymId, setSelectedGymId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (visible) {
            fetchGyms();
        }
    }, [visible]);

    const fetchGyms = async () => {
        setIsLoading(true);
        setError('');
        try {
            if (!user || !token) {
                setError('Authentication expired. Please login again.');
                setIsLoading(false);
                return;
            }

            const response = await gymService.fetchGymList(user.id, token, user.auth_key);
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
            console.log('✅ Gym selected and saved to localStorage');
            // Modal will auto-close when selectedGym updates in parent
        } catch (err) {
            setError('Failed to save gym selection');
            console.error('Gym selection error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    <View style={styles.container}>
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#4CAF50" />
                                <Text style={styles.loadingText}>Loading gyms...</Text>
                            </View>
                        ) : error && gyms.length === 0 ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorIcon}>⚠️</Text>
                                <Text style={styles.errorText}>{error}</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={fetchGyms}>
                                    <Text style={styles.retryButtonText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                {/* Header */}
                                <View style={styles.header}>
                                    <Text style={styles.icon}>🏋️</Text>
                                    <Text style={styles.title}>Select Your Gym</Text>
                                    <Text style={styles.subtitle}>
                                        Choose which gym this kiosk will be used for
                                    </Text>
                                </View>

                                {/* Gym List - Scrollable */}
                                <ScrollView
                                    style={styles.scrollView}
                                    contentContainerStyle={styles.scrollContent}
                                    showsVerticalScrollIndicator={true}
                                    keyboardShouldPersistTaps="handled"
                                >
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
                                                <Text style={styles.gymName} numberOfLines={1}>{gym.name}</Text>
                                                <Text style={styles.gymAddress} numberOfLines={1}>
                                                    📍 {gym.address}
                                                </Text>
                                                <View style={styles.gymStats}>
                                                    <Text style={styles.gymStat}>
                                                        👥 {gym.members_count || 0}
                                                    </Text>
                                                    <Text style={styles.gymStat}>
                                                        💪 {gym.trainers_count || 0}
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
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
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
        width: isTablet ? '70%' : '92%',
        maxWidth: 600,
        maxHeight: height * 0.85,
        borderWidth: 1,
        borderColor: '#333',
        overflow: 'hidden',
    },
    loadingContainer: {
        padding: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 16,
    },
    errorContainer: {
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
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
        paddingTop: 28,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    icon: {
        fontSize: 42,
        marginBottom: 10,
    },
    title: {
        fontSize: isTablet ? 26 : 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: isTablet ? 15 : 13,
        color: '#888',
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    scrollView: {
        flex: 1,
        maxHeight: height * 0.5,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 8,
    },
    gymCard: {
        flexDirection: 'row',
        backgroundColor: '#0f0f0f',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#252525',
        alignItems: 'center',
    },
    gymCardSelected: {
        borderColor: '#4CAF50',
        backgroundColor: '#1a3a1d',
    },
    gymLogo: {
        width: isTablet ? 60 : 52,
        height: isTablet ? 60 : 52,
        borderRadius: 12,
        backgroundColor: '#252525',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        flexShrink: 0,
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    logoPlaceholder: {
        fontSize: isTablet ? 26 : 22,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    gymInfo: {
        flex: 1,
        justifyContent: 'center',
        marginRight: 8,
    },
    gymName: {
        fontSize: isTablet ? 17 : 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    gymAddress: {
        fontSize: isTablet ? 13 : 12,
        color: '#888',
        marginBottom: 6,
    },
    gymStats: {
        flexDirection: 'row',
        gap: 12,
    },
    gymStat: {
        fontSize: isTablet ? 12 : 11,
        color: '#aaa',
    },
    checkMark: {
        width: isTablet ? 32 : 28,
        height: isTablet ? 32 : 28,
        borderRadius: 16,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    checkMarkIcon: {
        fontSize: isTablet ? 18 : 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    bottomError: {
        backgroundColor: '#ff444420',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ff4444',
    },
    bottomErrorText: {
        color: '#ff6666',
        fontSize: 13,
        textAlign: 'center',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#2a2a2a',
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: isTablet ? 18 : 16,
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
        fontSize: isTablet ? 18 : 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
