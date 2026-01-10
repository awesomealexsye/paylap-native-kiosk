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
    const numColumns = isTablet ? 3 : 2;

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const menuItems = [
        {
            id: 'owner',
            title: 'Owner Info',
            icon: '👤',
            description: 'View your profile',
            onPress: () => router.push('/owner-info'),
        },
        {
            id: 'gyms',
            title: 'My Gyms',
            icon: '🏋️',
            description: 'Manage gym locations',
            onPress: () => router.push('/gym-list'),
        },
        {
            id: 'kiosk',
            title: 'Face Kiosk',
            icon: '📸',
            description: 'Open check-in kiosk',
            onPress: () => router.push('/'),
        },
        {
            id: 'setup',
            title: 'Setup Guide',
            icon: '📋',
            description: 'Installation instructions',
            onPress: () => router.push('/setup'),
        },
        {
            id: 'settings',
            title: 'Settings',
            icon: '⚙️',
            description: 'App configuration',
            onPress: () => router.push('/settings'),
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
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

                {/* Quick Stats */}
                <View style={styles.quickStatsContainer}>
                    <Text style={styles.sectionTitle}>Quick Stats</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.quickStatCard}>
                            <Text style={styles.quickStatIcon}>✅</Text>
                            <Text style={styles.quickStatValue}>0</Text>
                            <Text style={styles.quickStatLabel}>Today's Check-ins</Text>
                        </View>
                        <View style={styles.quickStatCard}>
                            <Text style={styles.quickStatIcon}>👥</Text>
                            <Text style={styles.quickStatValue}>
                                {selectedGym?.members_count || 0}
                            </Text>
                            <Text style={styles.quickStatLabel}>Total Members</Text>
                        </View>
                        <View style={styles.quickStatCard}>
                            <Text style={styles.quickStatIcon}>💪</Text>
                            <Text style={styles.quickStatValue}>
                                {selectedGym?.trainers_count || 0}
                            </Text>
                            <Text style={styles.quickStatLabel}>Trainers</Text>
                        </View>
                        <View style={styles.quickStatCard}>
                            <Text style={styles.quickStatIcon}>🔥</Text>
                            <Text style={styles.quickStatValue}>0</Text>
                            <Text style={styles.quickStatLabel}>Active Now</Text>
                        </View>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    <Text style={styles.sectionTitle}>Menu</Text>
                    <View style={styles.menuGrid}>
                        {menuItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.menuItem,
                                    { width: isTablet ? '32%' : '48%' }
                                ]}
                                onPress={item.onPress}
                            >
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuDescription}>{item.description}</Text>
                            </TouchableOpacity>
                        ))}
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
                        <Text style={styles.modalIcon}>🚪</Text>
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
    },
    logoutButton: {
        width: 44,
        height: 44,
        backgroundColor: '#3a1a1a',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    logoutIcon: {
        fontSize: 20,
    },
    currentGymCard: {
        backgroundColor: '#1a1a1a',
        marginHorizontal: 24,
        marginBottom: 24,
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: '#4CAF50',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    gymHeader: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    gymLogo: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: '#252525',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    logoImage: {
        width: 64,
        height: 64,
        borderRadius: 16,
    },
    logoPlaceholder: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    gymInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    gymLabel: {
        fontSize: 10,
        color: '#4CAF50',
        fontWeight: '600',
        marginBottom: 4,
        letterSpacing: 1,
    },
    gymName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    gymAddress: {
        fontSize: 14,
        color: '#888',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#252525',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
    },
    switchGymButton: {
        backgroundColor: '#252525',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    switchGymText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '600',
    },
    quickStatsContainer: {
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
        flexWrap: 'wrap',
        gap: 12,
    },
    quickStatCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        width: '48%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#252525',
    },
    quickStatIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    quickStatValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    quickStatLabel: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    },
    menuContainer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    menuItem: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#252525',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
        minHeight: 140,
    },
    menuIcon: {
        fontSize: 32,
        marginBottom: 12,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    menuDescription: {
        fontSize: 14,
        color: '#888',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#252525',
    },
    modalIcon: {
        fontSize: 64,
        marginBottom: 16,
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
