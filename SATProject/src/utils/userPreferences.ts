export interface UserPreferences {
  displayName: string;
  soundEffects: boolean;
  celebrations: boolean;
  testDate: string;
  dailyReviewGoal: number;
}

const STORAGE_KEY = 'satBuddyPreferences';
export const PREFERENCES_EVENT = 'sat-buddy-preferences-changed';

const defaults: UserPreferences = {
  displayName: '',
  soundEffects: true,
  celebrations: true,
  testDate: '',
  dailyReviewGoal: 12,
};

export const getUserPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...defaults };

    const parsed = JSON.parse(stored) as Partial<UserPreferences>;
    const requestedGoal = Number(parsed.dailyReviewGoal);
    return {
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : defaults.displayName,
      soundEffects: typeof parsed.soundEffects === 'boolean' ? parsed.soundEffects : defaults.soundEffects,
      celebrations: typeof parsed.celebrations === 'boolean' ? parsed.celebrations : defaults.celebrations,
      testDate: typeof parsed.testDate === 'string' ? parsed.testDate : defaults.testDate,
      dailyReviewGoal: Number.isFinite(requestedGoal)
        ? Math.min(50, Math.max(5, Math.round(requestedGoal)))
        : defaults.dailyReviewGoal,
    };
  } catch {
    return { ...defaults };
  }
};

export const saveUserPreferences = (preferences: UserPreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT, { detail: preferences }));
};
