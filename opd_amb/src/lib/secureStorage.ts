/**
 * Secure Storage Abstraction for EMS PWA Offline Sync Queue & UI Preferences.
 * Replaces plain localStorage with simple encoded persistence and interface readiness for Encrypted IndexedDB.
 */

class SecureStorage {
  private prefix = 'balaji_ems_'

  public setItem<T>(key: string, value: T): void {
    try {
      const json = JSON.stringify(value)
      // Base64 encoding for basic obfuscation in mock/dev mode
      const encoded = btoa(encodeURIComponent(json))
      localStorage.setItem(this.prefix + key, encoded)
    } catch (e) {
      console.error('SecureStorage write failure', e)
    }
  }

  public getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(this.prefix + key)
      if (!item) return defaultValue
      const decoded = decodeURIComponent(atob(item))
      return JSON.parse(decoded) as T
    } catch (e) {
      return defaultValue
    }
  }

  public removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key)
  }

  public clear(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(this.prefix))
      .forEach((k) => localStorage.removeItem(k))
  }
}

export const secureStorage = new SecureStorage()
