/**
 * Dashboard Screen - Main hub for gym owner/admin
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Modal,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardScreen() {
    const { user, selectedGym, logout } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const { width } = useWindowDimensions();

    // Determine number of columns based on screen width
    const isTablet = width >= 768;

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const menuItems = [
        {
            id: 'owner',
            title: 'Owner Info',
            icon: '👤',
            gradient: ['#667eea', '#764ba2'],
            description: 'View your profile',
            onPress: () => router.push('/owner-info'),
        },
        {
            id: 'gyms',
            title: 'My Gyms',
            icon: '🏋️',
            gradient: ['#f093fb', '#f5576c'],
            description: 'Manage gym locations',
            onPress: () => router.push('/gym-list'),
        },
        {
            id: 'setup',
            title: 'Setup Guide',
            icon: '📋',
            gradient: ['#4facfe', '#00f2fe'],
            description: 'Installation instructions',
            onPress: () => router.push('/setup'),
        },
        {
            id: 'settings',
            title: 'Settings',
            icon: '⚙️',
            gradient: ['#43e97b', '#38f9d7'],
            description: 'App configuration',
            onPress: () => router.push('/settings'),
        },
        {
            id: 'sync',
            title: 'Sync Members',
            icon: '🔄',
            gradient: ['#fa709a', '#fee140'],
            description: 'Sync local face database',
            onPress: () => router.push('/sync-members'),
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello, {user?.name || 'User'}! 👋</Text>
                        <Text style={styles.subtitle}>Welcome to PayLap Fitness</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={() => setShowLogoutModal(true)}
                    >
                        <Text style={styles.logoutIcon}>🚪</Text>
                    </TouchableOpacity>
                </View>

                {/* Current Gym Card */}
                {selectedGym && (
                    <View style={styles.currentGymCard}>
                        <View style={styles.gymHeader}>
                            <View style={styles.gymLogo}>
                                {selectedGym.logo_url ? (
                                    <Image
                                        source={{ uri: selectedGym.logo_url }}
                                        style={styles.logoImage}
                                    />
                                ) : (
                                    <Text style={styles.logoPlaceholder}>
                                        {selectedGym.name.charAt(0).toUpperCase()}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.gymInfo}>
                                <Text style={styles.gymLabel}>CURRENT GYM</Text>
                                <Text style={styles.gymName}>{selectedGym.name}</Text>
                                <Text style={styles.gymAddress} numberOfLines={1}>
                                    📍 {selectedGym.address}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>
                                    {selectedGym.members_count || 0}
                                </Text>
                                <Text style={styles.statLabel}>Members</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>
                                    {selectedGym.trainers_count || 0}
                                </Text>
                                <Text style={styles.statLabel}>Trainers</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.switchGymButton}
                            onPress={() => router.push('/gym-list')}
                        >
                            <Text style={styles.switchGymText}>Switch Gym</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    <Text style={styles.sectionTitle}>Menu</Text>
                    <View style={styles.menuGrid}>
                        {menuItems.map((item) => {
                            // Define gradient colors for each menu item
                            const getGradientColor = (id: string) => {
                                const colors: Record<string, string> = {
                                    owner: '#667eea',
                                    gyms: '#f093fb',
                                    setup: '#4facfe',
                                    settings: '#43e97b',
                                    sync: '#fa709a',
                                };
                                return colors[id] || '#4CAF50';
                            };

                            const accentColor = getGradientColor(item.id);

                            // Calculate width: (100% - total gap) / number of columns
                            // Mobile: (100% - 16px) / 2 = ~48%
                            // Tablet: (100% - 32px) / 3 = ~31%
                            const cardWidth = isTablet ? '31%' : '47.5%';

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.menuItem,
                                        { width: cardWidth }
                                    ]}
                                    onPress={item.onPress}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.menuIconContainer,
                                        {
                                            backgroundColor: `${accentColor}15`,
                                            borderColor: `${accentColor}30`,
                                        }
                                    ]}>
                                        <Text style={styles.menuIcon}>{item.icon}</Text>
                                    </View>
                                    <Text style={styles.menuTitle}>{item.title}</Text>
                                    <Text style={styles.menuDescription} numberOfLines={1}>
                                        {item.description}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* Logout Confirmation Modal */}
            <Modal
                visible={showLogoutModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLogoutModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconContainer}>
                            <Text style={styles.modalIcon}>🚪</Text>
                        </View>
                        <Text style={styles.modalTitle}>Logout</Text>
                        <Text style={styles.modalMessage}>
                            Are you sure you want to logout?
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowLogoutModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={async () => {
                                    setShowLogoutModal(false);
                                    await logout();
                                    router.replace('/login');
                                }}
                            >
                                <Text style={styles.confirmButtonText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
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
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 24,
        paddingBottom: 16,
    },
    greeting: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
    },
    logoutButton: {
        width: 48,
        height: 48,
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#252525',
    },
    logoutIcon: {
        fontSize: 22,
    },
    currentGymCard: {
        backgroundColor: '#1a1a1a',
        marginHorizontal: 24,
        marginBottom: 32,
        borderRadius: 24,
        padding: 24,
        borderWidth: 2,
        borderColor: '#4CAF50',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    gymHeader: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    gymLogo: {
        width: 72,
        height: 72,
        borderRadius: 18,
        backgroundColor: '#252525',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    logoImage: {
        width: 72,
        height: 72,
        borderRadius: 18,
    },
    logoPlaceholder: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    gymInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    gymLabel: {
        fontSize: 11,
        color: '#4CAF50',
        fontWeight: '700',
        marginBottom: 6,
        letterSpacing: 1.5,
    },
    gymName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 6,
    },
    gymAddress: {
        fontSize: 14,
        color: '#888',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#252525',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 6,
    },
    statLabel: {
        fontSize: 13,
        color: '#888',
        fontWeight: '500',
    },
    switchGymButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    switchGymText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    menuContainer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    menuItem: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#252525',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 170,
        marginBottom: 16,
    },
    menuIconContainer: {
        width: 68,
        height: 68,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 2,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    menuIcon: {
        fontSize: 34,
    },
    menuTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 6,
        textAlign: 'center',
    },
    menuDescription: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    },
    // Modal styles
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
    modalIconContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#252525',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#ff4444',
    },
    modalIcon: {
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
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#252525',
        borderWidth: 1,
        borderColor: '#333',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        backgroundColor: '#ff4444',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
