import axios from 'axios';

// Local development must talk to the local backend. A stale VITE_API_URL
// pointing at a production host (e.g. Railway) would otherwise send every
// local request to production and fail with "Network Error".
const LOCAL_API_URL = 'http://localhost:5000/api';

function resolveBaseUrl(): string {
  if (import.meta.env.DEV) {
    // Allow an explicitly-local override, but ignore production hosts in dev.
    const explicit = import.meta.env.VITE_API_URL as string | undefined;
    if (explicit && !/railway\.app|vercel\.app|herokuapp|render\.com/i.test(explicit)) {
      return explicit;
    }
    return LOCAL_API_URL;
  }
  return import.meta.env.VITE_API_URL || '/api';
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
});

const getToken = (key: string) => localStorage.getItem(key) || sessionStorage.getItem(key);
const setToken = (key: string, value: string) => {
  if (localStorage.getItem(key) !== null) localStorage.setItem(key, value);
  else sessionStorage.setItem(key, value);
};

api.interceptors.request.use((config) => {
  const token = getToken('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Translate transport-level failures (no response, CORS, bad URL) into a
// useful message. The UI surfaces err.message when there is no server payload.
function describeNetworkError(err: any): string {
  if (err.code === 'ECONNABORTED') return 'Request timed out. Backend did not respond.';
  if (!err.config || err.config?.baseURL?.startsWith('undefined')) {
    return 'Invalid API URL configuration.';
  }
  if (typeof err.message === 'string' && /network error|cors/i.test(err.message)) {
    return `Cannot reach the backend at ${err.config?.baseURL ?? ''}. Check that the backend is running.`;
  }
  return err.message || 'Network Error';
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (!err.response) {
      // Transport-level failure (backend down, CORS, wrong URL)
      console.error(`[API Network Error] ${original?.method?.toUpperCase()} ${original?.url}`, err.message);
      err.message = describeNetworkError(err);
      err.networkError = true;
      return Promise.reject(err);
    }
    if (err.response?.status && err.response.status !== 401) {
      const ctx = `${original?.method?.toUpperCase()} ${original?.url}`;
      console.error(`[API Error ${err.response.status}] ${ctx}`, err.response.data?.message || err.message);
    }
    if (err.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login')) {
      original._retry = true;
      const refreshToken = getToken('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refreshToken }
          );
          setToken('token', data.token);
          setToken('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original);
        } catch {
          localStorage.removeItem('token'); sessionStorage.removeItem('token');
          localStorage.removeItem('refreshToken'); sessionStorage.removeItem('refreshToken');
          localStorage.removeItem('user'); sessionStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('token'); sessionStorage.removeItem('token');
        localStorage.removeItem('user'); sessionStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
