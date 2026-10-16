'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/document-scanner-core.js');

test('checkFile: accepts JPG/PNG/WebP, rejects others/HEIC/empty/oversized', () => {
  assert.equal(C.checkFile({ name: 'a.jpg', type: 'image/jpeg', size: 1000 }).ok, true);
  assert.equal(C.checkFile({ name: 'a.PNG', type: 'image/png', size: 1000 }).ok, true);
  assert.equal(C.checkFile({ name: 'a.webp', type: '', size: 1000 }).ok, true);
  assert.equal(C.checkFile({ name: 'a.pdf', type: 'application/pdf', size: 1000 }).code, 'type');
  assert.equal(C.checkFile({ name: 'a.txt', type: 'text/plain', size: 1000 }).code, 'type');
  assert.equal(C.checkFile({ name: 'a.svg', type: 'image/svg+xml', size: 1000 }).code, 'type');
  assert.equal(C.checkFile({ name: 'a.gif', type: 'image/gif', size: 1000 }).code, 'type');
  assert.equal(C.checkFile({ name: 'IMG.HEIC', type: 'image/heic', size: 1000 }).code, 'heic');
  assert.equal(C.checkFile({ name: 'a.jpg', type: 'image/jpeg', size: 0 }).code, 'empty');
  assert.equal(C.checkFile({ name: 'a.jpg', type: 'image/jpeg', size: 26 * 1024 * 1024 }).code, 'big');
  assert.equal(C.checkFile(null).code, 'none');
});

test('fitDims never upscales and keeps aspect', () => {
  assert.deepEqual(C.fitDims(4000, 2000, 2000), { w: 2000, h: 1000, scale: 0.5 });
  assert.equal(C.fitDims(800, 600, 2000).scale, 1);
  assert.deepEqual(C.rotatedDims(300, 200, 90), { w: 200, h: 300 });
  assert.deepEqual(C.rotatedDims(300, 200, 180), { w: 300, h: 200 });
});

test('clampCrop: bounds, ordering and minimum size', () => {
  assert.deepEqual(C.clampCrop({ x0: -1, y0: 0.2, x1: 2, y1: 0.8 }), { x0: 0, y0: 0.2, x1: 1, y1: 0.8 });
  const sw = C.clampCrop({ x0: 0.9, y0: 0.9, x1: 0.1, y1: 0.1 });
  assert.ok(sw.x0 < sw.x1 && sw.y0 < sw.y1);
  const tiny = C.clampCrop({ x0: 0.5, y0: 0.5, x1: 0.5, y1: 0.5 });
  assert.ok(tiny.x1 - tiny.x0 >= 0.0499 && tiny.y1 - tiny.y0 >= 0.0499);
  const edge = C.clampCrop({ x0: 1, y0: 1, x1: 1, y1: 1 });
  assert.ok(edge.x0 >= 0 && edge.x1 <= 1 && edge.x1 - edge.x0 >= 0.0499);
});

const px = (...rgb) => new Uint8ClampedArray(rgb.flatMap(p => [p[0], p[1], p[2], 255]));

test('applyFilter color: default settings leave pixels unchanged', () => {
  const d = px([10, 120, 250], [0, 0, 0]);
  const copy = Array.from(d);
  assert.equal(C.applyFilter(d, { mode: 'color', brightness: 0, contrast: 0 }), null);
  assert.deepEqual(Array.from(d), copy);
});

test('applyFilter color: brightness raises, negative lowers, channels stay independent', () => {
  const up = px([100, 50, 200]); C.applyFilter(up, { mode: 'color', brightness: 20, contrast: 0 });
  assert.ok(up[0] > 100 && up[1] > 50 && up[2] > 200);
  assert.notEqual(up[0], up[1]);
  const dn = px([100, 50, 200]); C.applyFilter(dn, { mode: 'color', brightness: -20, contrast: 0 });
  assert.ok(dn[0] < 100 && dn[1] < 50 && dn[2] < 200);
});

test('applyFilter color: contrast pushes darks darker and lights lighter', () => {
  const d = px([60, 60, 60], [200, 200, 200]); C.applyFilter(d, { mode: 'color', brightness: 0, contrast: 40 });
  assert.ok(d[0] < 60 && d[4] > 200);
});

test('applyFilter gray: R=G=B and uses luminance weights', () => {
  const d = px([255, 0, 0], [0, 255, 0], [0, 0, 255]); C.applyFilter(d, { mode: 'gray' });
  for (let i = 0; i < 12; i += 4) assert.ok(d[i] === d[i + 1] && d[i + 1] === d[i + 2]);
  assert.ok(d[4] > d[0] && d[0] > d[8]); // green > red > blue luminance
  assert.equal(d[3], 255);
});

test('applyFilter bw: only 0/255, text-like dark pixels become black, paper white', () => {
  const d = px(...[...Array(30)].map((_, i) => i < 8 ? [30, 30, 40] : [225, 220, 215]));
  const thr = C.applyFilter(d, { mode: 'bw' });
  assert.ok(thr > 30 && thr < 220, 'threshold ' + thr);
  for (let i = 0; i < d.length; i += 4) assert.ok(d[i] === 0 || d[i] === 255);
  assert.equal(d[0], 0); assert.equal(d[4 * 29], 255);
});

test('otsu separates a bimodal histogram and handles empty input', () => {
  const h = new Uint32Array(256); h[20] = 100; h[230] = 100;
  const t = C.otsu(h); assert.ok(t >= 20 && t < 230);
  assert.equal(C.otsu(new Uint32Array(256)), 128);
});

// Fake encoder: size shrinks with quality and scale^2
const fake = (base) => async (scale, q) => ({ size: Math.round(base * scale * scale * q * q), payload: { scale, q } });

test('searchToTarget: meets target at highest feasible quality', async () => {
  const target = 200 * 1024;
  const r = await C.searchToTarget(fake(900 * 1024), target, { width: 2000, height: 1500 });
  assert.equal(r.met, true);
  assert.ok(r.size <= target);
  assert.ok(r.quality >= 0.45);
  // not wastefully low: a bit higher quality should exceed the target
  const higher = await fake(900 * 1024)(r.scale, Math.min(0.92, r.quality + 0.06));
  assert.ok(higher.size > target || r.quality > 0.9);
});

test('searchToTarget: already-small image returns max quality immediately', async () => {
  const r = await C.searchToTarget(fake(50 * 1024), 500 * 1024, { width: 2000, height: 1500 });
  assert.equal(r.met, true); assert.equal(r.quality, 0.92); assert.equal(r.scale, 1); assert.equal(r.tried, 1);
});

test('searchToTarget: reports NOT met (never lies) when target unreachable, returns smallest tried', async () => {
  const target = 100 * 1024;
  const r = await C.searchToTarget(fake(40 * 1024 * 1024), target, { width: 2000, height: 1500 });
  assert.equal(r.met, false);
  assert.ok(r.size > target);
  assert.equal(r.quality, 0.45);
  assert.ok(r.scale < 1);
});

test('searchToTarget: never downscales below the readable side limit', async () => {
  const seen = [];
  const enc = async (s, q) => { seen.push(s); return { size: 10 * 1024 * 1024, payload: null }; };
  await C.searchToTarget(enc, 100 * 1024, { width: 1200, height: 900 });
  assert.deepEqual([...new Set(seen)].sort((x, y) => y - x), [1, 0.85]); // 0.7*1200=840 < 1000 is never tried
});

// minimal valid JPEG header: SOI + SOF0 (h=20,w=10,3 comps) + EOI
const tinyJpeg = (comps = 3) => Uint8Array.from([0xFF, 0xD8, 0xFF, 0xC0, 0, 8 + comps * 3, 8, 0, 20, 0, 10, comps, ...Array(comps * 3).fill(1), 0xFF, 0xD9]);

test('jpegInfo reads SOF dims and rejects non-JPEG', () => {
  assert.deepEqual(C.jpegInfo(tinyJpeg(3)), { h: 20, w: 10, comps: 3 });
  assert.equal(C.jpegInfo(tinyJpeg(1)).comps, 1);
  assert.equal(C.jpegInfo(Uint8Array.from([1, 2, 3, 4, 5, 6])), null);
  assert.equal(C.jpegInfo(null), null);
});

test('buildPdf: valid structure, correct xref offsets, embeds the JPEG bytes', () => {
  const jpg = tinyJpeg(3), pdf = C.buildPdf(jpg);
  const s = Buffer.from(pdf).toString('latin1');
  assert.ok(s.startsWith('%PDF-1.4'));
  assert.ok(s.trimEnd().endsWith('%%EOF'));
  const sx = +/startxref\n(\d+)\n/.exec(s)[1];
  assert.equal(s.slice(sx, sx + 4), 'xref');
  const entries = [...s.slice(sx).matchAll(/(\d{10}) 00000 n /g)].map(m => +m[1]);
  assert.equal(entries.length, 5);
  entries.forEach((off, i) => assert.ok(s.slice(off).startsWith(`${i + 1} 0 obj`), `obj ${i + 1} offset`));
  assert.ok(s.includes('/Width 10 /Height 20'));
  assert.ok(s.includes('/DeviceRGB'));
  assert.ok(Buffer.from(pdf).includes(Buffer.from(jpg)));
  assert.ok(C.buildPdf(tinyJpeg(1)).length > 0 && Buffer.from(C.buildPdf(tinyJpeg(1))).toString('latin1').includes('/DeviceGray'));
  const m = /\/Filter \/DCTDecode \/Length (\d+) >>/.exec(s);
  assert.ok(m, 'image Length entry present');
  assert.equal(+m[1], jpg.length);
});

test('buildPdf: rejects invalid data; landscape image gets landscape page', () => {
  assert.throws(() => C.buildPdf(Uint8Array.from([1, 2, 3, 4])));
  const wide = Uint8Array.from([0xFF, 0xD8, 0xFF, 0xC0, 0, 17, 8, 0, 10, 0, 20, 3, 1, 1, 0, 2, 1, 0, 3, 1, 0, 0xFF, 0xD9]);
  assert.ok(/MediaBox \[0 0 841\.89 595\.28\]/.test(Buffer.from(C.buildPdf(wide)).toString('latin1')));
});

test('formatSize', () => {
  assert.equal(C.formatSize(1024), '1.0 KB');
  assert.equal(C.formatSize(512 * 1024), '512.0 KB');
  assert.equal(C.formatSize(2 * 1048576), '2.00 MB');
});
