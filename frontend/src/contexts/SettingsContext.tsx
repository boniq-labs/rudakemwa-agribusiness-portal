import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { settingsApi } from '../api';
import type { AppSettings } from '../types';
import { resolveAssetUrl } from '../utils/assetUrl';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (data: Partial<AppSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  system_name: 'EFMS',
  farm_name: '',
  farm_logo: '/assets/logo.png',
  favicon: '',
  farm_address: '',
  phone_number: '',
  email: '',
  system_info: '',
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const applyFavicon = useCallback((url?: string) => {
    document.querySelectorAll("link[rel*='icon'], link[rel*='apple-touch-icon']").forEach(el => el.remove());
    const absoluteUrl = url ? resolveAssetUrl(url) : '/assets/favicon.jpeg';
    const ts = Date.now();
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = `${absoluteUrl}?v=${ts}`;
    document.head.appendChild(link);
    const appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = `${absoluteUrl}?v=${ts}`;
    document.head.appendChild(appleLink);
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await settingsApi.get();
      const s = res.data.data || {};
      setSettings(prev => ({ ...prev, ...s }));
      applyFavicon(s.favicon || '');
    } catch {
      // silent
    }
  }, [applyFavicon]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = useCallback(async (data: Partial<AppSettings>) => {
    await settingsApi.update(data);
    setSettings(prev => ({ ...prev, ...data }));
    if ('favicon' in data) applyFavicon(data.favicon || '');
  }, [applyFavicon]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
