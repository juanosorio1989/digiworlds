import { test } from 'node:test';
import assert from 'node:assert/strict';
import es from '../src/i18n/es.json' with { type: 'json' };
import en from '../src/i18n/en.json' with { type: 'json' };
import { t, tHtml, tRaw, isPlaceholder } from '../src/i18n/t.ts';

function keyPaths(node: unknown, prefix = ''): string[] {
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

test('t basic lookup', () => {
  assert.equal(t('es', 'nav.pricing'), 'Precios');
  assert.equal(t('en', 'nav.pricing'), 'Pricing');
});

test('t throws on missing key', () => {
  assert.throws(() => t('es', 'nope'), /Missing i18n key "nope" for es/);
});

test('key parity between es and en', () => {
  assert.deepEqual(keyPaths(es), keyPaths(en));
});

test('unknown token throws', () => {
  (es as any).tmp = { bad: 'x {foo} y' };
  try {
    assert.throws(() => t('es', 'tmp.bad'), /Unknown token/);
  } finally {
    delete (es as any).tmp;
  }
});

test('known tokens interpolate', () => {
  (es as any).tmp = { ok: '{supportEmail} {price} {year} {date}' };
  try {
    assert.equal(t('es', 'tmp.ok'), 'info@digiworlds.store 9.99 2026 2026-11-22');
  } finally {
    delete (es as any).tmp;
  }
});

test('tHtml escapes', () => {
  (es as any).tmp = { lt: 'a < b' };
  try {
    assert.equal(tHtml('es', 'tmp.lt'), 'a &lt; b');
  } finally {
    delete (es as any).tmp;
  }
});

test('tHtml marks placeholder', () => {
  (es as any).tmp = { op: 'By {operatorName}' };
  try {
    assert.equal(tHtml('es', 'tmp.op'), 'By <mark class="placeholder">OPERATOR_NAME</mark>');
    assert.equal(tHtml('es', 'tmp.op', { operatorName: 'Ana' }), 'By Ana');
  } finally {
    delete (es as any).tmp;
  }
});

test('tRaw interpolates nested', () => {
  (es as any).tmp = { list: [{ a: 'x {operatorName}' }] };
  try {
    const r = tRaw<{ a: string }[]>('es', 'tmp.list');
    assert.equal(r[0].a, 'x <mark class="placeholder">OPERATOR_NAME</mark>');
  } finally {
    delete (es as any).tmp;
  }
});

test('isPlaceholder', () => {
  assert.equal(isPlaceholder('info@digiworlds.store'), false);
  assert.equal(isPlaceholder('OPERATOR_NAME'), true);
  assert.equal(isPlaceholder('SUPPORT_EMAIL'), true);
});

test('inherited names are not tokens or keys', () => {
  (es as any).tmp = { c: '{constructor}' };
  try {
    assert.throws(() => t('es', 'tmp.c'), /Unknown token/);
    assert.throws(() => tHtml('es', 'tmp.c'), /Unknown token/);
  } finally {
    delete (es as any).tmp;
  }
  assert.throws(() => tRaw('es', 'nav.constructor'), /Missing i18n key/);
});

test('malformed tokens throw', () => {
  (es as any).tmp = { a: 'x {support-email}', b: 'x { price }' };
  try {
    assert.throws(() => t('es', 'tmp.a'), /Unknown token/);
    assert.throws(() => t('es', 'tmp.b'), /Unknown token/);
  } finally {
    delete (es as any).tmp;
  }
});
