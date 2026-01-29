import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface KioskSettingsContextType {
    isRelayEnabled: boolean;
    setRelayEnabled: (enabled: boolean) => Promise<void>;
    isLoading: boolean;
}

const STORAGE_KEY_RELAY_ENABLED = '@kiosk_relay_enabled';

const KioskSettingsContext = createContext<KioskSettingsContextType | undefined>(undefined);

export const KioskSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isRelayEnabled, setIsRelayEnabled] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedValue = await AsyncStorage.getItem(STORAGE_KEY_RELAY_ENABLED);
            // Default to false if no value is found
            if (savedValue !== null) {
                setIsRelayEnabled(savedValue === 'true');
            } else {
                setIsRelayEnabled(false);
            }
        } catch (error) {
            console.error('❌ Error loading kiosk settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setRelayEnabled = async (enabled: boolean) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY_RELAY_ENABLED, enabled.toString());
            setIsRelayEnabled(enabled);
            console.log(`✅ Relay feature ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('❌ Error saving relay setting:', error);
        }
    };

    return (
        <KioskSettingsContext.Provider
            value={{
                isRelayEnabled,
                setRelayEnabled,
                isLoading,
            }}
        >
            {children}
        </KioskSettingsContext.Provider>
    );
};

export const useKioskSettings = (): KioskSettingsContextType => {
    const context = useContext(KioskSettingsContext);
    if (!context) {
        throw new Error('useKioskSettings must be used within a KioskSettingsProvider');
    }
    return context;
};
