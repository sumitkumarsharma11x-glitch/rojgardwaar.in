/**
 * ROJGARDWAAR.IN - Photo + Signature tool: pure logic (no DOM, no network).
 * Browser: window.PhotoSignCore. Node: require() for unit tests.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PhotoSignCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const LIMITS = { minPx: 20, maxPx: 4000, maxPixels: 12000000, maxFileBytes: 20 * 1024 * 1024, minQuality: 0.35, maxQuality: 0.92, maxKB: 10000 };
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;

  /** Input file check. Returns {ok, code, message} (message in Hindi + English). */
  function checkFile(file) {
    if (!file) return { ok: false, code: 'none', message: 'कोई फाइल नहीं चुनी गई। (No file selected)' };
    const name = String(file.name || '');
    if (/\.(heic|heif)$/i.test(name) || /image\/hei[cf]/i.test(file.type || '')) {
      return { ok: false, code: 'heic', message: 'HEIC/HEIF फोटो समर्थित नहीं है। फोन की सेटिंग में "Most Compatible/JPG" चुनें, या फोटो का screenshot लें। (HEIC not supported)' };
    }
    const typeOk = ALLOWED_TYPES.includes(file.type) || (!file.type && ALLOWED_EXT.test(name));
    if (!typeOk) return { ok: false, code: 'type', message: 'सिर्फ JPG, JPEG या PNG फाइल चुनें। (Only JPG, JPEG or PNG files)' };
    if (!(file.size > 0)) return { ok: false, code: 'empty', message: 'यह फाइल खाली है। (File is empty)' };
    if (file.size > LIMITS.maxFileBytes) return { ok: false, code: 'big', message: 'फाइल 20 MB से बड़ी है। कृपया छोटी फोटो चुनें। (File over 20 MB)' };
    return { ok: true };
  }

  /** Output size check. Accepts numbers or numeric strings; only whole pixels. */
  function validateDims(w, h) {
    const W = Number(w), H = Number(h);
    if (w === '' || h === '' || w == null || h == null || !Number.isInteger(W) || !Number.isInteger(H)) return { ok: false, message: 'Width और Height पूरे अंकों (pixels) में भरें।' };
    if (W < LIMITS.minPx || H < LIMITS.minPx || W > LIMITS.maxPx || H > LIMITS.maxPx) return { ok: false, message: `Width और Height ${LIMITS.minPx} से ${LIMITS.maxPx} px के बीच रखें।` };
    if (W * H > LIMITS.maxPixels) return { ok: false, message: 'इतना बड़ा size फोन पर नहीं बन पाएगा। छोटा size चुनें।' };
    return { ok: true, W, H };
  }

  /** Target size in KB: '' / 0 means no limit. */
  function parseTargetKB(v) {
    if (v === '' || v == null) return { ok: true, kb: 0 };
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > LIMITS.maxKB) return { ok: false, message: 'File size KB में सही संख्या भरें।' };
    if (n === 0) return { ok: true, kb: 0 };
    if (n < 1) return { ok: false, message: 'File size कम से कम 1 KB रखें।' };
    return { ok: true, kb: n };
  }

  /**
   * Where photo / signature go on the W x H canvas.
   * layout: 'stack' (photo above signature) | 'side' (photo left, signature right).
   * share: fraction (0.15-0.85) of the main axis given to the photo. Slots never overlap or leave the canvas.
   */
  function computeSlots(opts) {
    const W = opts.W, H = opts.H, mode = opts.mode || 'both';
    if (mode === 'photo') return { photo: { x: 0, y: 0, w: W, h: H }, sign: null };
    if (mode === 'sign') return { photo: null, sign: { x: 0, y: 0, w: W, h: H } };
    const share = Math.min(0.85, Math.max(0.15, Number(opts.share) || 0.5));
    const vertical = opts.layout !== 'side';
    const axis = vertical ? H : W;
    const gap = Math.max(0, Math.min(Math.round(Number(opts.gap) || 0), Math.floor(axis * 0.3)));
    const usable = axis - gap;
    let a = Math.round(usable * share);
    a = Math.max(1, Math.min(usable - 1, a));
    const b = usable - a;
    return vertical
      ? { photo: { x: 0, y: 0, w: W, h: a }, sign: { x: 0, y: a + gap, w: W, h: b } }
      : { photo: { x: 0, y: 0, w: a, h: H }, sign: { x: a + gap, y: 0, w: b, h: H } };
  }

  /**
   * Draw rectangle for an image inside a slot. Never changes the image's aspect ratio.
   * fit: 'cover' (fill the frame, crop overflow) | 'contain' (show whole image).
   * zoom >= 1; pan sliders -100..100 move the image across its available overflow/free space.
   * align: 'left'|'center'|'right' (used only when the image is narrower than the slot).
   */
  function placeImage(iw, ih, slot, o) {
    o = o || {};
    const zoom = Math.max(1, Number(o.zoom) || 1);
    const base = o.fit === 'contain' ? Math.min(slot.w / iw, slot.h / ih) : Math.max(slot.w / iw, slot.h / ih);
    const s = base * zoom, dw = iw * s, dh = ih * s;
    const af = { left: 0, right: 1 }[o.align] ?? 0.5;
    const pan = v => Math.max(-100, Math.min(100, Number(v) || 0)) / 100;
    const px = dw >= slot.w ? 0.5 : af, py = 0.5;
    const dx = slot.x + (slot.w - dw) * px + pan(o.panX) * Math.abs(dw - slot.w) / 2;
    const dy = slot.y + (slot.h - dh) * py + pan(o.panY) * Math.abs(dh - slot.h) / 2;
    return { dx, dy, dw, dh, scale: s };
  }

  /** Does a cover-fit placement fully cover its slot (no white gaps)? */
  function covers(r, slot) {
    const e = 0.5;
    return r.dx <= slot.x + e && r.dy <= slot.y + e && r.dx + r.dw >= slot.x + slot.w - e && r.dy + r.dh >= slot.y + slot.h - e;
  }

  /**
   * Find the highest JPEG quality whose real encoded size fits targetBytes.
   * encode(q) -> Promise<Blob-like {size}>. Returns {blob, quality, met, reason}.
   * `met` is true ONLY if the returned blob's real size <= targetBytes.
   */
  async function fitQuality(encode, targetBytes, cfg) {
    const lo0 = (cfg && cfg.min) || LIMITS.minQuality, hi0 = (cfg && cfg.max) || LIMITS.maxQuality, steps = (cfg && cfg.steps) || 7;
    const top = await encode(hi0);
    if (!top) return { blob: null, quality: hi0, met: false, reason: 'encode-failed' };
    if (!targetBytes || top.size <= targetBytes) return { blob: top, quality: hi0, met: true, reason: targetBytes ? 'fits-at-best-quality' : 'no-limit' };
    const bottom = await encode(lo0);
    if (!bottom) return { blob: null, quality: lo0, met: false, reason: 'encode-failed' };
    if (bottom.size > targetBytes) return { blob: bottom, quality: lo0, met: false, reason: 'too-small-target' };
    let lo = lo0, hi = hi0, best = bottom, bestQ = lo0;
    for (let i = 0; i < steps; i++) {
      const mid = (lo + hi) / 2, b = await encode(mid);
      if (!b) break;
      if (b.size <= targetBytes) { best = b; bestQ = mid; lo = mid; } else hi = mid;
    }
    return { blob: best, quality: bestQ, met: best.size <= targetBytes, reason: 'searched' };
  }

  function formatKB(bytes) { return (bytes / 1024).toFixed(bytes < 10240 ? 2 : 1) + ' KB'; }

  /** Longest-edge downscale target so huge camera photos do not exhaust phone memory. */
  function decodeSize(w, h, maxEdge) {
    const m = Math.max(w, h);
    if (m <= maxEdge) return { w, h, scaled: false };
    const k = maxEdge / m;
    return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)), scaled: true };
  }

  return { LIMITS, checkFile, validateDims, parseTargetKB, computeSlots, placeImage, covers, fitQuality, formatKB, decodeSize };
});
