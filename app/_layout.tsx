/**
 * Root Layout - Expo Router Configuration
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { KioskSettingsProvider } from '../contexts/KioskSettingsContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <KioskSettingsProvider>
                <StatusBar style="dark" />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: 'fade',
                    }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="otp-verify" />
                    <Stack.Screen name="gym-selection" />
                    <Stack.Screen name="dashboard" />
                    <Stack.Screen name="owner-info" />
                    <Stack.Screen name="gym-list" />
                    <Stack.Screen name="gym-details" />
                    <Stack.Screen name="welcome" />
                    <Stack.Screen name="setup" options={{ title: "Server Setup" }} />
                    <Stack.Screen name="settings" options={{ title: "Settings" }} />
                </Stack>
            </KioskSettingsProvider>
        </AuthProvider>
    );
}
