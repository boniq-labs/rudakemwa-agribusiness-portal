const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000/api';

// In dev, a stale VITE_API_URL pointing at a production host (Railway/Vercel/…)
// must NOT be used for resolving assets: locally-uploaded files live on the local
// backend. Mirror client.ts: ignore production hosts in dev, fall back to localhost.
function resolveApiOrigin(): string {
  const base = API_BASE_URL.trim().replace(/\/+$/, '').replace(/\/api$/, '');
  if (import.meta.env.DEV && /railway\.app|vercel\.app|herokuapp|render\.com/i.test(base)) {
    return 'http://localhost:5000';
  }
  return base;
}

const API_ORIGIN: string = resolveApiOrigin();

export function resolveAssetUrl(url?: string | null): string {
  if (!url) return '';
  if (/^(https?:|data:|blob:|mailto:|tel:)/i.test(url)) return url;
  if (url.startsWith('/uploads/')) {
    return `${API_ORIGIN}${url}`;
  }
  return url;
}
