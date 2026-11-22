import { site } from '../config/site.ts';

export type Lang = 'es' | 'en';
export const langs: readonly Lang[] = ['es', 'en'];

export type PageKey = 'home' | 'pricing' | 'terms' | 'refunds' | 'privacy' | 'contact';
export const pageKeys: readonly PageKey[] = ['home', 'pricing', 'terms', 'refunds', 'privacy', 'contact'];

export const routes: Record<PageKey, Record<Lang, string>> = {
  home: { es: '/', en: '/en' },
  pricing: { es: '/precios', en: '/en/pricing' },
  terms: { es: '/terminos', en: '/en/terms' },
  refunds: { es: '/reembolsos', en: '/en/refunds' },
  privacy: { es: '/privacidad', en: '/en/privacy' },
  contact: { es: '/contacto', en: '/en/contact' },
};

export function pathFor(key: PageKey, lang: Lang): string {
  return routes[key][lang];
}

export function otherLang(lang: Lang): Lang {
  return lang === 'es' ? 'en' : 'es';
}

export function absoluteUrl(path: string): string {
  return site.siteUrl + path;
}

export function alternates(key: PageKey): { hreflang: 'es' | 'en' | 'x-default'; href: string }[] {
  return [
    { hreflang: 'es', href: absoluteUrl(pathFor(key, 'es')) },
    { hreflang: 'en', href: absoluteUrl(pathFor(key, 'en')) },
    { hreflang: 'x-default', href: absoluteUrl(pathFor(key, 'es')) },
  ];
}
