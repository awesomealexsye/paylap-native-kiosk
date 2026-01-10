/**
 * Storage Service - AsyncStorage wrapper for persistent data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, User, Gym } from '../types/auth';

class StorageService {
    // Generic methods
    async setItem(key: string, value: string): Promise<void> {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.error('Error saving to storage:', error);
            throw error;
        }
    }

    async getItem(key: string): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            console.error('Error reading from storage:', error);
            return null;
        }
    }

    async removeItem(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from storage:', error);
            throw error;
        }
    }

    async clear(): Promise<void> {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('Error clearing storage:', error);
            throw error;
        }
    }

    // Auth-specific methods
    async saveAuthToken(token: string): Promise<void> {
        await this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }

    async getAuthToken(): Promise<string | null> {
        return await this.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }

    async removeAuthToken(): Promise<void> {
        await this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }

    async saveUserData(user: User): Promise<void> {
        await this.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    }

    async getUserData(): Promise<User | null> {
        const data = await this.getItem(STORAGE_KEYS.USER_DATA);
        return data ? JSON.parse(data) : null;
    }

    async removeUserData(): Promise<void> {
        await this.removeItem(STORAGE_KEYS.USER_DATA);
    }

    async saveSelectedGym(gym: Gym): Promise<void> {
        await this.setItem(STORAGE_KEYS.SELECTED_GYM, JSON.stringify(gym));
    }

    async getSelectedGym(): Promise<Gym | null> {
        const data = await this.getItem(STORAGE_KEYS.SELECTED_GYM);
        return data ? JSON.parse(data) : null;
    }

    async removeSelectedGym(): Promise<void> {
        await this.removeItem(STORAGE_KEYS.SELECTED_GYM);
    }

    // Clear all auth-related data
    async clearAuthData(): Promise<void> {
        await this.removeAuthToken();
        await this.removeUserData();
        await this.removeSelectedGym();
    }
}

export default new StorageService();
