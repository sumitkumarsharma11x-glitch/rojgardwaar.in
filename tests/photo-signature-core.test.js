'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/photo-signature-core.js');

test('checkFile: accepts JPG/PNG/WebP, rejects others, HEIC, empty and oversized', () => {
  assert.equal(C.checkFile({ name: 'a.jpg', type: 'image/jpeg', size: 1000 }).ok, true);
  assert.equal(C.checkFile({ name: 'a.PNG', type: 'image/png', size: 1000 }).ok, true);
  assert.equal(C.checkFile({ name: 'a.jpeg', type: '', size: 1000 }).ok, true);          // type missing, extension ok
  assert.equal(C.checkFile({ name: 'a.pdf', type: 'application/pdf', size: 1000 }).code, 'type');
  assert.equal(C.checkFile({ name: 'a.gif', type: 'image/gif', size: 1000 }).code, 'type');
  assert.equal(C.checkFile({ name: 'a.svg', type: 'image/svg+xml', size: 1000 }).code, 'type');
  assert.equal(C.checkFile({ name: 'IMG.HEIC', type: 'image/heic', size: 1000 }).code, 'heic');
  assert.equal(C.checkFile({ name: 'a.jpg', type: 'image/jpeg', size: 0 }).code, 'empty');
  assert.equal(C.checkFile({ name: 'a.jpg', type: 'image/jpeg', size: 21 * 1024 * 1024 }).code, 'big');
  assert.equal(C.checkFile(null).code, 'none');
});
test('validateDims: whole pixels within limits', () => {
  assert.deepEqual(C.validateDims('413', '531'), { ok: true, W: 413, H: 531 });
  for (const [w, h] of [['', '100'], ['100', ''], ['abc', '100'], ['10.5', '100'], ['19', '100'], ['100', '4001'], [null, 5], ['-5', '100'], ['4000', '4000']])
    assert.equal(C.validateDims(w, h).ok, false, `${w}x${h}`);
});
test('parseTargetKB', () => {
  assert.deepEqual(C.parseTargetKB(''), { ok: true, kb: 0 });
  assert.deepEqual(C.parseTargetKB('0'), { ok: true, kb: 0 });
  assert.deepEqual(C.parseTargetKB('45.5'), { ok: true, kb: 45.5 });
  for (const v of ['abc', '-1', '0.5', '99999']) assert.equal(C.parseTargetKB(v).ok, false, v);
});
test('computeSlots: stacked slots tile the canvas exactly, honouring gap', () => {
  const s = C.computeSlots({ W: 413, H: 767, layout: 'stack', share: 0.69, gap: 10 });
  assert.equal(s.photo.x, 0); assert.equal(s.photo.w, 413); assert.equal(s.sign.w, 413);
  assert.equal(s.photo.h + 10 + s.sign.h, 767);
  assert.equal(s.sign.y, s.photo.h + 10);
});
test('computeSlots: side-by-side, no overlap, inside canvas', () => {
  const s = C.computeSlots({ W: 800, H: 300, layout: 'side', share: 0.5, gap: 20 });
  assert.equal(s.photo.w + 20 + s.sign.w, 800);
  assert.ok(s.photo.x + s.photo.w <= s.sign.x);
  assert.equal(s.photo.h, 300);
});
test('computeSlots: extreme share/gap are clamped; single modes fill the canvas', () => {
  for (const share of [0, 1, -5, 99, NaN]) for (const gap of [0, 5000, -3]) for (const layout of ['stack', 'side']) {
    const s = C.computeSlots({ W: 100, H: 100, layout, share, gap });
    for (const k of ['photo', 'sign']) { assert.ok(s[k].w >= 1 && s[k].h >= 1); assert.ok(s[k].x + s[k].w <= 100 && s[k].y + s[k].h <= 100); }
  }
  assert.deepEqual(C.computeSlots({ W: 50, H: 60, mode: 'photo' }).photo, { x: 0, y: 0, w: 50, h: 60 });
  assert.deepEqual(C.computeSlots({ W: 50, H: 60, mode: 'sign' }).sign, { x: 0, y: 0, w: 50, h: 60 });
});
test('placeImage: never distorts the aspect ratio', () => {
  for (const fit of ['cover', 'contain']) for (const zoom of [1, 1.7, 3]) {
    const r = C.placeImage(4000, 3000, { x: 0, y: 0, w: 413, h: 531 }, { fit, zoom });
    assert.ok(Math.abs(r.dw / r.dh - 4000 / 3000) < 1e-9);
  }
});
test('placeImage: cover fully covers the slot at every pan extreme; contain fits whole image', () => {
  const slot = { x: 0, y: 100, w: 300, h: 400 };
  for (const [iw, ih] of [[4000, 3000], [3000, 4000], [300, 400], [50, 50]]) for (const zoom of [1, 2.5]) for (const px of [-100, 0, 100]) for (const py of [-100, 0, 100]) {
    const r = C.placeImage(iw, ih, slot, { fit: 'cover', zoom, panX: px, panY: py });
    assert.ok(C.covers(r, slot), `${iw}x${ih} z${zoom} ${px},${py}`);
  }
  const c = C.placeImage(1000, 500, { x: 0, y: 0, w: 400, h: 400 }, { fit: 'contain' });
  assert.ok(c.dw <= 400 && c.dh <= 400);
});
test('placeImage: alignment only matters for images narrower than the slot', () => {
  const slot = { x: 0, y: 0, w: 400, h: 200 };
  assert.equal(C.placeImage(100, 100, slot, { fit: 'contain', align: 'left' }).dx, 0);
  assert.equal(C.placeImage(100, 100, slot, { fit: 'contain', align: 'right' }).dx, 200);
  assert.equal(C.placeImage(100, 100, slot, { fit: 'contain', align: 'center' }).dx, 100);
  assert.equal(C.placeImage(800, 100, slot, { fit: 'cover', align: 'left' }).dx, C.placeImage(800, 100, slot, { fit: 'cover', align: 'right' }).dx);
});

// ---- fitQuality with a fake monotonic encoder ----
const fake = (sizeAt, calls) => q => { if (calls) calls.n++; return Promise.resolve({ size: Math.round(sizeAt(q)), q }); };
test('fitQuality: no limit uses best quality, one encode', async () => {
  const calls = { n: 0 }; const r = await C.fitQuality(fake(q => 100000 * q, calls), 0);
  assert.equal(r.met, true); assert.equal(calls.n, 1);
});
test('fitQuality: finds the highest quality that really fits', async () => {
  const sizeAt = q => 200000 * q * q; const target = 50 * 1024;
  const r = await C.fitQuality(fake(sizeAt), target);
  assert.equal(r.met, true); assert.ok(r.blob.size <= target);
  assert.ok(sizeAt(r.quality + 0.02) > target * 0.9, 'quality is close to the best possible');
});
test('fitQuality: impossible target is reported as NOT met (never claims success)', async () => {
  const r = await C.fitQuality(fake(q => 90000 + 10000 * q), 20 * 1024);
  assert.equal(r.met, false); assert.equal(r.reason, 'too-small-target'); assert.equal(r.quality, C.LIMITS.minQuality);
  assert.ok(r.blob.size > 20 * 1024);
});
test('fitQuality: encoder failure is handled', async () => {
  assert.equal((await C.fitQuality(() => Promise.resolve(null), 1000)).reason, 'encode-failed');
});
test('fitQuality: target barely reachable at min quality', async () => {
  const min = C.LIMITS.minQuality, sizeAt = q => 10000 + 100000 * (q - min);   // exactly 10000 at min
  const r = await C.fitQuality(fake(sizeAt), 10000);
  assert.equal(r.met, true); assert.ok(r.blob.size <= 10000);
});
test('decodeSize downsizes only oversized images and keeps ratio', () => {
  assert.deepEqual(C.decodeSize(1000, 800, 3200), { w: 1000, h: 800, scaled: false });
  const d = C.decodeSize(8000, 6000, 3200);
  assert.deepEqual([d.w, d.h, d.scaled], [3200, 2400, true]);
});
test('page makes no network requests and loads no external code', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'tools', 'photo-signature.html'), 'utf8');
  const js = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js', 'photo-signature-core.js'), 'utf8');
  for (const src of [html, js]) assert.doesNotMatch(src, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage/);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/i);
  assert.doesNotMatch(html, /<link(?![^>]+rel="canonical")[^>]+href="https?:/i);
});
