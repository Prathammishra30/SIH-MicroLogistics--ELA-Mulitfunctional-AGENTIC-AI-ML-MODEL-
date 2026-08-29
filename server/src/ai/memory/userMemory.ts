// Long-Term User Preferences Memory
// Persists user specific defaults (preferred language, default mandi, frequent crops)

export interface UserPreferences {
  userId: string;
  preferredLanguage?: string;
  defaultMandi?: string;
  frequentCrops?: string[];
  defaultVehicleType?: string;
  lastInteractionDate?: string;
}

export class UserMemory {
  private static userPrefsMap: Map<string, UserPreferences> = new Map();

  public static getPreferences(userId: string): UserPreferences {
    let prefs = this.userPrefsMap.get(userId);
    if (!prefs) {
      prefs = {
        userId,
        frequentCrops: ['Tomatoes', 'Onions'],
        defaultMandi: 'Pune APMC',
        lastInteractionDate: new Date().toISOString(),
      };
      this.userPrefsMap.set(userId, prefs);
    }
    return prefs;
  }

  public static updatePreferences(userId: string, update: Partial<UserPreferences>): UserPreferences {
    const existing = this.getPreferences(userId);
    const updated: UserPreferences = {
      ...existing,
      ...update,
      lastInteractionDate: new Date().toISOString(),
    };
    this.userPrefsMap.set(userId, updated);
    return updated;
  }
}
