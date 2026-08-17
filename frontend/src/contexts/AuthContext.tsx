import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '../api';
import type { User } from '../types';
import { canAccessDepartment, departmentNameToRole } from '../utils/departmentAccess';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<User>;
  logout: () => void;
  setUser: (user: User | null) => void;
  hasPermission: (perm: string) => boolean;
  hasRole: (...roles: string[]) => boolean;
  fetchProfile: () => Promise<User | null>;
}

const store = (remember: boolean) => remember ? localStorage : sessionStorage;

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const s = localStorage.getItem('user') || sessionStorage.getItem('user');
      return s && s !== 'undefined' ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      authApi
        .profile()
        .then((res) => {
          setUser(res.data.data);
          const s = localStorage.getItem('token') ? localStorage : sessionStorage;
          s.setItem('user', JSON.stringify(res.data.data));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('refreshToken');
          sessionStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string, rememberMe = true) => {
    const res = await authApi.login({ username, password });
    const d = res.data.data;
    const s = store(rememberMe);
    s.setItem('token', d.token);
    s.setItem('refreshToken', d.refreshToken);
    s.setItem('user', JSON.stringify(d.user));
    setUser(d.user);
    return d.user;
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authApi.profile();
      const u = res.data.data;
      setUser(u);
      const s = localStorage.getItem('token') ? localStorage : sessionStorage;
      s.setItem('user', JSON.stringify(u));
      return u;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (perm: string) => user?.permissions?.includes(perm) ?? false,
    [user]
  );

  const hasRole = useCallback(
    (...roles: string[]) => {
      if (!user) return false;
      if (user.role === 'owner' || user.role === 'farm_owner' || roles.includes(user.role)) return true;
      if (roles.some(r => canAccessDepartment(user.role, r))) return true;
      const userDeptRoleSlugs = (user.departments || [])
        .map(d => departmentNameToRole[d.name.toLowerCase()])
        .filter(Boolean);
      return roles.some(r => userDeptRoleSlugs.includes(r));
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, hasPermission, hasRole, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
