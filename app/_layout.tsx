/**
 * Root Layout - Expo Router Configuration
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
    return (
        <>
            <StatusBar style="dark" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="welcome" />
                <Stack.Screen name="setup" options={{ title: "Server Setup" }} />
                <Stack.Screen name="settings" options={{ title: "Settings" }} />
            </Stack>
        </>
    );
}
