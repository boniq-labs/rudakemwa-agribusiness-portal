import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation, setLanguage } from '../services/i18n';
import { setCurrency, getCurrency, currencyCodes } from '../services/currency';
import { Moon, Sun, Languages, Coins, Settings as SettingsIcon } from 'lucide-react';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'rw', label: 'Kinyarwanda' },
  { code: 'fr', label: 'Français' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { getLanguage } = useTranslation();
  const [lang, setLang] = useState(getLanguage());
  const [currency, setCur] = useState(getCurrency().code);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const applyDark = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle('dark', v);
    localStorage.setItem('theme', v ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', localStorage.getItem('theme') === 'dark');
  }, []);

  const changeLang = (code: string) => {
    setLang(code);
    setLanguage(code);
    window.location.reload();
  };

  const changeCurrency = (code: string) => {
    setCur(code);
    setCurrency(code);
  };

  return (
    <div className="page settings-page">
      <h2><SettingsIcon size={20} /> Settings</h2>

      <div className="settings-grid">
        <div className="card form-card">
          <h3><Moon size={16} /> Appearance</h3>
          <div className="setting-row" onClick={() => applyDark(!dark)}>
            <div>
              <div className="setting-label">Dark Mode</div>
              <div className="setting-sub">Toggle between light and dark theme</div>
            </div>
            <button className={`switch ${dark ? 'on' : ''}`} type="button" aria-label="toggle dark mode">
              {dark ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>
        </div>

        <div className="card form-card">
          <h3><Languages size={16} /> Language</h3>
          <div className="setting-options">
            {LANGS.map((l) => (
              <button key={l.code} className={`option-btn ${lang === l.code ? 'active' : ''}`} onClick={() => changeLang(l.code)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card form-card">
          <h3><Coins size={16} /> Currency</h3>
          <div className="setting-options">
            {currencyCodes.map((c: string) => (
              <button key={c} className={`option-btn ${currency === c ? 'active' : ''}`} onClick={() => changeCurrency(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="card form-card">
          <h3>Account</h3>
          <div className="setting-row">
            <div>
              <div className="setting-label">Signed in as</div>
              <div className="setting-sub">{user?.firstName} {user?.lastName} ({user?.email})</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
