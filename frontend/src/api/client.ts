import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
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
