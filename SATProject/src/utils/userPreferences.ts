export interface UserPreferences {
  displayName: string;
  soundEffects: boolean;
  celebrations: boolean;
}

const STORAGE_KEY = 'satBuddyPreferences';
export const PREFERENCES_EVENT = 'sat-buddy-preferences-changed';

const defaults: UserPreferences = {
  displayName: '',
  soundEffects: true,
  celebrations: true,
};

export const getUserPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch {
    return defaults;
  }
};

export const saveUserPreferences = (preferences: UserPreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT, { detail: preferences }));
};
