export interface CookieConsentPreferences {
  essential: true; // Always active: consent state & session gameplay
  statsStorage: boolean; // Local IndexedDB / localStorage Hall of Fame & match history
  externalFonts: boolean; // Google Fonts retro typography (falls back to system monospace when off)
  consentTimestamp: number;
  version: number;
}

export const CONSENT_STORAGE_KEY = 'gorillas_legal_consent_v1';
export const CONSENT_VERSION = 1;

export const DEFAULT_CONSENT_PREFERENCES: Omit<
  CookieConsentPreferences,
  'consentTimestamp' | 'version'
> = {
  essential: true,
  statsStorage: true,
  externalFonts: true,
};

export function getStoredConsent(): CookieConsentPreferences | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentPreferences>;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.statsStorage !== 'boolean' ||
      typeof parsed.externalFonts !== 'boolean'
    ) {
      return null;
    }
    return {
      essential: true,
      statsStorage: parsed.statsStorage,
      externalFonts: parsed.externalFonts,
      consentTimestamp:
        typeof parsed.consentTimestamp === 'number' && Number.isFinite(parsed.consentTimestamp)
          ? parsed.consentTimestamp
          : Date.now(),
      version: CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

export function applyFontPreference(externalFonts: boolean): void {
  if (typeof document === 'undefined') return;
  try {
    const links = document.querySelectorAll<HTMLLinkElement>(
      'link[href*="fonts.googleapis.com"]'
    );
    links.forEach((link) => {
      link.disabled = !externalFonts;
    });
  } catch {
    // Ignore in restricted DOM environments
  }
}

export function saveConsent(prefs: {
  statsStorage: boolean;
  externalFonts: boolean;
}): CookieConsentPreferences {
  const full: CookieConsentPreferences = {
    essential: true,
    statsStorage: Boolean(prefs.statsStorage),
    externalFonts: Boolean(prefs.externalFonts),
    consentTimestamp: Date.now(),
    version: CONSENT_VERSION,
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(full));
    } catch {
      // Ignore quota/private mode errors
    }
  }

  applyFontPreference(full.externalFonts);
  return full;
}

export function clearConsent(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}
