import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { shiftsApi } from '../api';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import toast from 'react-hot-toast';

export default function AppLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!user) return;
    const role = user.role;
    if (role === 'owner' || role === 'admin') return;
    shiftsApi.myShift().then((r) => {
      const data = r.data.data;
      if (data && data.today) {
        const fmt = (t: string) => {
          if (!t) return '';
          const [h, m] = t.split(':');
          const hour = parseInt(h);
          return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
        };
        toast.success(
          `Good morning ${user.firstName}.\nYour shift today: ${data.shift_name} (${fmt(data.start_time)} - ${fmt(data.end_time)})`,
          { duration: 8000 }
        );
      }
    }).catch(() => {});
  }, [user]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading Portal...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
