import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const { user, loading } = useAuth();

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
