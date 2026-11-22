import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathFor, routes, pageKeys, langs, otherLang, absoluteUrl, alternates } from '../src/i18n/routes.ts';

test('pathFor', () => {
  assert.equal(pathFor('pricing', 'en'), '/en/pricing');
  assert.equal(pathFor('home', 'es'), '/');
  assert.equal(pathFor('home', 'en'), '/en');
});

test('every key has both langs and 12 unique paths', () => {
  const all: string[] = [];
  for (const k of pageKeys) for (const l of langs) {
    assert.ok(routes[k][l]);
    all.push(routes[k][l]);
  }
  assert.equal(all.length, 12);
  assert.equal(new Set(all).size, 12);
});

test('absoluteUrl', () => {
  assert.equal(absoluteUrl('/'), 'https://digiworlds.store/');
  assert.equal(absoluteUrl('/precios'), 'https://digiworlds.store/precios');
});

test('alternates', () => {
  assert.deepEqual(alternates('terms'), [
    { hreflang: 'es', href: 'https://digiworlds.store/terminos' },
    { hreflang: 'en', href: 'https://digiworlds.store/en/terms' },
    { hreflang: 'x-default', href: 'https://digiworlds.store/terminos' },
  ]);
});

test('otherLang', () => {
  assert.equal(otherLang('es'), 'en');
  assert.equal(otherLang('en'), 'es');
});
