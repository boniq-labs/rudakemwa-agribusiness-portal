import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../utils/constants';
import { notificationsApi, searchApi } from '../api';
import type { Notification } from '../types';
import {
  Bell, Search, Moon, Sun, User, Settings, LogOut, HelpCircle,
  CheckCheck, ChevronDown, Menu,
} from 'lucide-react';
import { cn } from '../utils/cn';

// Must match the sidebar's id for mobile toggle
const SIDEBAR_TOGGLE_EVENT = 'sidebar:toggle';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent(SIDEBAR_TOGGLE_EVENT));
  };
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [avatarTs] = useState(() => Date.now());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const r = await notificationsApi.list();
        setNotifications(r.data.data.notifications?.slice(0, 5) || []);
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setResults([]);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const id = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await searchApi.search(q);
        setResults(r.data.data.results || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = async (n: Notification) => {
    if (!n.isRead) {
      try { await notificationsApi.markRead(n.id); } catch {}
      setNotifications(notifications.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    if (n.link) navigate(n.link);
    setShowNotif(false);
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-hamburger" onClick={toggleSidebar} title="Toggle menu" aria-label="Toggle navigation menu">
          <Menu size={22} />
        </button>
        <div className="search-bar" ref={searchRef}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search employees, animals, suppliers, invoices..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query.trim().length >= 2 && (
            <div className="search-dropdown">
              {searching && <div className="search-empty">Searching…</div>}
              {!searching && results.length === 0 && <div className="search-empty">No matches for “{query}”</div>}
              {!searching && results.map((r, i) => (
                <div key={i} className="search-item" onClick={() => { navigate(r.link); setQuery(''); setResults([]); }}>
                  <span className="search-type">{r.type}</span>
                  <div>
                    <div className="search-label">{r.label}</div>
                    {r.sub && <div className="search-sub">{r.sub}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <button className="topbar-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="notif-wrapper" ref={notifRef}>
          <button className="topbar-btn notif-btn" onClick={() => setShowNotif(!showNotif)}>
            <Bell size={20} />
            {unread > 0 && <span className="notif-badge">{unread}</span>}
          </button>
          {showNotif && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <h4>Notifications</h4>
                <button onClick={markAllRead}><CheckCheck size={16} /> Mark all read</button>
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={cn('notif-item', !n.isRead && 'unread')} onClick={() => markRead(n)}>
                      <Bell size={16} />
                      <div>
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-message">{n.message}</div>
                        <div className="notif-time">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="profile-wrapper" ref={profileRef}>
          <button className="profile-btn" onClick={() => setShowProfile(!showProfile)}>
            <div className="profile-avatar-sm">
              {user?.photo ? (
                <img src={`${user.photo}?t=${avatarTs}`} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</>
              )}
            </div>
            <div className="profile-info">
              <div className="profile-name">{user?.firstName} {user?.lastName}</div>
              <div className="profile-role">{ROLE_LABELS[user?.role || ''] || user?.role}</div>
            </div>
            <ChevronDown size={16} />
          </button>
          {showProfile && (
            <div className="profile-dropdown">
              <Link to="/profile" className="dropdown-item" onClick={() => setShowProfile(false)}>
                <User size={16} /> My Profile
              </Link>
              <Link to="/settings" className="dropdown-item" onClick={() => setShowProfile(false)}>
                <Settings size={16} /> Settings
              </Link>
              <Link to="/help" className="dropdown-item" onClick={() => setShowProfile(false)}>
                <HelpCircle size={16} /> Help
              </Link>
              <hr />
              <button className="dropdown-item" onClick={() => { setShowProfile(false); logout(); }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
