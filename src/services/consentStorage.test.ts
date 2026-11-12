import { describe, it, expect, beforeEach } from 'vitest';
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  getStoredConsent,
  saveConsent,
  clearConsent,
  applyFontPreference,
} from './consentStorage';

describe('consentStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    document.head.innerHTML = '';
  });

  it('returns null when no consent is stored or payload is corrupted', () => {
    expect(getStoredConsent()).toBeNull();

    localStorage.setItem(CONSENT_STORAGE_KEY, '{invalid-json');
    expect(getStoredConsent()).toBeNull();

    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ version: 999, statsStorage: true, externalFonts: true })
    );
    expect(getStoredConsent()).toBeNull();
  });

  it('saves, reads, and clears consent preferences and toggles Google Fonts stylesheets', () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    document.head.appendChild(link);

    const saved = saveConsent({ statsStorage: false, externalFonts: false });
    expect(saved.essential).toBe(true);
    expect(saved.statsStorage).toBe(false);
    expect(saved.externalFonts).toBe(false);
    expect(saved.version).toBe(CONSENT_VERSION);
    expect(link.disabled).toBe(true);

    const loaded = getStoredConsent();
    expect(loaded).not.toBeNull();
    expect(loaded?.statsStorage).toBe(false);
    expect(loaded?.externalFonts).toBe(false);

    applyFontPreference(true);
    expect(link.disabled).toBe(false);

    clearConsent();
    expect(getStoredConsent()).toBeNull();
  });
});
