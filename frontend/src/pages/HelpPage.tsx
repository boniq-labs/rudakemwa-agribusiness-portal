import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../utils/constants';
import { HelpCircle, BookOpen, Search, Bell, Settings as SettingsIcon, User } from 'lucide-react';

const SHORTCUTS = [
  { icon: Search, title: 'Global Search', text: 'Type any employee, animal, supplier, customer, or order number in the top search bar to jump straight to it.' },
  { icon: Bell, title: 'Notifications', text: 'Click the bell to see live alerts. Use "Mark all read" to clear them. They also appear on your dashboard.' },
  { icon: SettingsIcon, title: 'Settings', text: 'Change theme (dark/light), interface language (English / Kinyarwanda / French), and default currency.' },
  { icon: User, title: 'My Profile', text: 'Update your name, email, phone, and password from the profile menu in the top-right.' },
];

export default function HelpPage() {
  const { user } = useAuth();
  return (
    <div className="page help-page">
      <h2><HelpCircle size={20} /> Help & Quick Start</h2>

      <div className="card form-card">
        <h3><BookOpen size={16} /> Welcome, {user?.firstName}!</h3>
        <p className="text-secondary">
          You are signed in as <strong>{ROLE_LABELS[user?.role || ''] || user?.role}</strong>.
          The sidebar shows only the modules your role can access. Use the department cards on your
          dashboard to jump into any area of the system.
        </p>
      </div>

      <div className="help-grid">
        {SHORTCUTS.map((s) => {
          const Icon = s.icon;
          return (
            <div className="card help-card" key={s.title}>
              <div className="help-icon"><Icon size={20} /></div>
              <div className="help-title">{s.title}</div>
              <div className="help-text">{s.text}</div>
            </div>
          );
        })}
      </div>

      <div className="card form-card">
        <h3>Need more?</h3>
        <p className="text-secondary">
          Every module has its own dashboard with live metrics. Drill into sub-pages from the sidebar
          to create, edit, approve, or export records. Actions you perform are recorded in the audit log.
        </p>
      </div>
    </div>
  );
}
