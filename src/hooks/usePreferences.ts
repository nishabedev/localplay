import { useState, useEffect, useCallback } from 'react';
import { getPreferences, savePreferences, getDefaultPreferences } from '../utils/storage';
import type { UserPreferences, UsePreferencesReturn } from '../types';

export const usePreferences = (): UsePreferencesReturn => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async (): Promise<void> => {
    try {
      const prefs = await getPreferences();
      setPreferences(prefs);
    } catch (err) {
      console.error('Error loading preferences:', err);
      setPreferences(getDefaultPreferences());
    } finally {
      setIsLoading(false);
    }
  };

  // Update a single preference
  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): Promise<void> => {
    try {
      const updated = { [key]: value } as Partial<UserPreferences>;
      await savePreferences(updated);
      setPreferences(prev => prev ? { ...prev, ...updated } : null);
    } catch (err) {
      console.error('Error updating preference:', err);
    }
  }, []);

  // Update multiple preferences at once
  const updatePreferences = useCallback(async (
    updates: Partial<UserPreferences>
  ): Promise<void> => {
    try {
      await savePreferences(updates);
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error('Error updating preferences:', err);
    }
  }, []);

  return {
    preferences,
    isLoading,
    updatePreference,
    updatePreferences,
  };
};
