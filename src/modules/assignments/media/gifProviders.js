import { Giphy, ContentRating } from 'gif-picker-react/providers/giphy';
import { Klipy, ContentFilter } from 'gif-picker-react/providers/klipy';

/**
 * GIF and sticker sources for gif-picker-react, chosen by env:
 *   VITE_GIF_PROVIDER = giphy (default) | klipy
 *   VITE_GIF_API_KEY  = that provider's API key (browser key, by design)
 *
 * Children use this platform, so content is always filtered to the strictest
 * level (Giphy rating G, Klipy filter high) - not configurable here.
 *
 * The built-in providers only search GIFs, so stickers use small custom
 * providers against the same service's sticker endpoints. The backend accepts
 * a picked URL only from these providers' CDN hosts.
 */

const PROVIDER = String(import.meta.env.VITE_GIF_PROVIDER || 'giphy').toLowerCase();
const API_KEY = import.meta.env.VITE_GIF_API_KEY || '';

export const gifProviderName = PROVIDER === 'klipy' ? 'KLIPY' : 'GIPHY';
export const gifPickerConfigured = Boolean(API_KEY);

class GiphyStickers {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // Giphy requires its "Powered by GIPHY" mark wherever its content is browsed.
    this.attribution = Giphy(apiKey).getAttribution();
  }

  async fetchApi(path, params) {
    const url = new URL(`https://api.giphy.com/v1${path}`);
    Object.entries({ api_key: this.apiKey, rating: ContentRating.G, limit: 50, ...params }).forEach(([k, v]) =>
      url.searchParams.set(k, String(v))
    );
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Giphy stickers request failed (${response.status})`);
    return (await response.json()).data ?? [];
  }

  parse(items) {
    return items
      .map((item) => {
        const full = item.images?.fixed_height ?? item.images?.original;
        const preview = item.images?.fixed_width ?? full;
        if (!full?.url || !preview?.url) return null;
        return {
          id: item.id,
          imageUrl: full.url,
          width: Number(full.width),
          height: Number(full.height),
          description: item.title,
          preview: { imageUrl: preview.url, width: Number(preview.width), height: Number(preview.height) },
          provider: 'giphy',
          raw: item,
        };
      })
      .filter(Boolean);
  }

  async getTrending() {
    return this.parse(await this.fetchApi('/stickers/trending', {}));
  }

  async search(term) {
    return this.parse(await this.fetchApi('/stickers/search', { q: term.slice(0, 50) }));
  }

  // Giphy has no sticker categories; the picker then opens on its Trending tile.
  getCategories() {
    return [];
  }

  getAttribution() {
    return { ...this.attribution, searchPlaceholder: 'Search GIPHY stickers' };
  }
}

class KlipyStickers {
  constructor(appKey) {
    this.appKey = appKey;
  }

  async fetchApi(path, params) {
    const url = new URL(`https://api.klipy.com/api/v1/${this.appKey}/stickers/${path}`);
    Object.entries({ page: 1, per_page: 50, content_filter: ContentFilter.HIGH, ...params }).forEach(([k, v]) =>
      url.searchParams.set(k, String(v))
    );
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Klipy stickers request failed (${response.status})`);
    const body = await response.json();
    if (!body.result) throw new Error('Klipy stickers request failed');
    return body.data?.data ?? [];
  }

  parse(items) {
    const pick = (size) => size?.gif ?? size?.webp ?? size?.png;
    return items
      .map((item) => {
        const full = pick(item.file?.md);
        const preview = pick(item.file?.sm) ?? full;
        if (!full?.url || !preview?.url) return null;
        return {
          id: item.slug ?? String(item.id),
          imageUrl: full.url,
          width: Number(full.width),
          height: Number(full.height),
          description: item.title,
          preview: { imageUrl: preview.url, width: Number(preview.width), height: Number(preview.height) },
          provider: 'klipy',
          raw: item,
        };
      })
      .filter(Boolean);
  }

  async getTrending() {
    return this.parse(await this.fetchApi('trending', {}));
  }

  async search(term) {
    return this.parse(await this.fetchApi('search', { q: term }));
  }

  getCategories() {
    return [];
  }

  getAttribution() {
    return { searchPlaceholder: 'Search KLIPY stickers' };
  }
}

/**
 * The built-in GIF provider minus categories. Both services' category
 * endpoints ignore the rating/content filter, so their cover GIFs could show
 * anything; the picker then offers only (filtered) Trending and search.
 */
function withoutCategories(provider) {
  return {
    getTrending: () => provider.getTrending(),
    search: (term) => provider.search(term),
    getCategories: () => [],
    getAttribution: () => provider.getAttribution?.() ?? {},
    ...(provider.onClick ? { onClick: (gif, context) => provider.onClick(gif, context) } : {}),
  };
}

let cache = null;

/** { gif, sticker } providers, or null when no API key is configured. */
export function getGifProviders() {
  if (!gifPickerConfigured) return null;
  if (!cache) {
    cache =
      PROVIDER === 'klipy'
        ? { gif: withoutCategories(Klipy(API_KEY, { contentFilter: ContentFilter.HIGH })), sticker: new KlipyStickers(API_KEY) }
        : { gif: withoutCategories(Giphy(API_KEY, { rating: ContentRating.G })), sticker: new GiphyStickers(API_KEY) };
  }
  return cache;
}
