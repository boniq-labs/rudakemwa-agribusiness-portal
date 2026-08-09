const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000/api';

const API_ORIGIN: string = API_BASE_URL.trim().replace(/\/+$/, '').replace(/\/api$/, '');

export function resolveAssetUrl(url?: string | null): string {
  if (!url) return '';
  if (/^(https?:|data:|blob:|mailto:|tel:)/i.test(url)) return url;
  if (url.startsWith('/uploads/')) {
    return `${API_ORIGIN}${url}`;
  }
  return url;
}
