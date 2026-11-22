import { site } from '../config/site.ts';
import es from './es.json' with { type: 'json' };
import en from './en.json' with { type: 'json' };
import type { Lang } from './routes.ts';

const dictionaries: Record<Lang, unknown> = { es, en };

const placeholders = ['SUPPORT_EMAIL', 'OPERATOR_NAME'];

export function isPlaceholder(value: string): boolean {
  return placeholders.includes(value);
}

function siteVars(): Record<string, string> {
  return {
    supportEmail: site.supportEmail,
    operatorName: site.operatorName,
    price: site.premiumPriceUsd,
    appUrl: site.appUrl,
    date: site.legalUpdated,
    year: String(site.copyrightYear),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function lookup(lang: Lang, key: string): unknown {
  let node: unknown = dictionaries[lang];
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && Object.hasOwn(node, part)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return node;
}

function interpolate(
  template: string,
  key: string,
  vars: Record<string, string> | undefined,
  html: boolean,
): string {
  const all = { ...siteVars(), ...vars };
  let out = '';
  let last = 0;
  for (const m of template.matchAll(/\{([^{}]*)\}/g)) {
    const name = m[1];
    if (!Object.hasOwn(all, name)) throw new Error(`Unknown token "{${name}}" in "${key}"`);
    const value = all[name];
    const idx = m.index ?? 0;
    const literal = template.slice(last, idx);
    out += html ? escapeHtml(literal) : literal;
    if (html) {
      out += isPlaceholder(value)
        ? `<mark class="placeholder">${escapeHtml(value)}</mark>`
        : escapeHtml(value);
    } else {
      out += value;
    }
    last = idx + m[0].length;
  }
  const tail = template.slice(last);
  return out + (html ? escapeHtml(tail) : tail);
}

function getString(lang: Lang, key: string): string {
  const v = lookup(lang, key);
  if (typeof v !== 'string') throw new Error(`Missing i18n key "${key}" for ${lang}`);
  return v;
}

export function t(lang: Lang, key: string, vars?: Record<string, string>): string {
  return interpolate(getString(lang, key), key, vars, false);
}

export function tHtml(lang: Lang, key: string, vars?: Record<string, string>): string {
  return interpolate(getString(lang, key), key, vars, true);
}

export function tRaw<T>(lang: Lang, key: string): T {
  const node = lookup(lang, key);
  if (node === undefined) throw new Error(`Missing i18n key "${key}" for ${lang}`);
  const walk = (n: unknown): unknown => {
    if (typeof n === 'string') return interpolate(n, key, undefined, true);
    if (Array.isArray(n)) return n.map(walk);
    if (n && typeof n === 'object') {
      return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, walk(v)]));
    }
    return n;
  };
  return walk(node) as T;
}
