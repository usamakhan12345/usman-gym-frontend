import { defaultSite } from './site-defaults';
import type { SiteData } from './types';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:4000';

/** Server-side fetch of public website content (cached briefly; falls back to defaults if the API is down). */
export async function getSite(): Promise<SiteData> {
  try {
    const res = await fetch(`${BACKEND}/api/public/site`, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as { data: SiteData };
    return { ...defaultSite, ...json.data, settings: { ...defaultSite.settings, ...json.data.settings } };
  } catch {
    return defaultSite;
  }
}
