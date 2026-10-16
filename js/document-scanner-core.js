/**
 * ROJGARDWAAR.IN - Document Scanner: pure logic (no DOM, no network).
 * Browser: window.DocScanCore. Node: require() for unit tests.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DocScanCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const LIMITS = { maxFileBytes: 25 * 1024 * 1024, maxSourceSide: 3200, exportMaxSide: 2000, minReadableSide: 1000, minQuality: 0.45, maxQuality: 0.92 };
  const TARGETS_KB = [100, 200, 500];
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;

  /** Input file check -> {ok, code, message} (Hindi + English). */
  function checkFile(file) {
    if (!file) return { ok: false, code: 'none', message: 'कोई फ़ाइल नहीं चुनी गई (No file selected)' };
    const name = String(file.name || '');
    if (/\.(heic|heif)$/i.test(name) || /image\/hei[cf]/i.test(file.type || '')) {
      return { ok: false, code: 'heic', message: 'HEIC/HEIF फ़ाइल समर्थित नहीं है। फोन कैमरा सेटिंग में "Most Compatible/JPG" चुनें, या कैमरा बटन से सीधे फोटो लें (HEIC not supported)' };
    }
    const typeOk = ALLOWED_TYPES.includes(file.type) || (!file.type && ALLOWED_EXT.test(name));
    if (!typeOk) return { ok: false, code: 'type', message: 'केवल JPG, PNG या WebP image चुनें (Only JPG, PNG or WebP images)' };
    if (!(file.size > 0)) return { ok: false, code: 'empty', message: 'फ़ाइल खाली है (File is empty)' };
    if (file.size > LIMITS.maxFileBytes) return { ok: false, code: 'big', message: 'फ़ाइल 25 MB से बड़ी है; छोटी फोटो चुनें (File over 25 MB)' };
    return { ok: true };
  }

  /** Scale (w,h) down so the longest side <= maxSide. Never upscales. Returns whole pixels >= 1. */
  function fitDims(w, h, maxSide) {
    const s = Math.min(1, maxSide / Math.max(w, h));
    return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)), scale: s };
  }

  function rotatedDims(w, h, rot) { return (rot % 180 === 0) ? { w, h } : { w: h, h: w }; }

  /** Crop rect (normalised 0..1) clamped; min size 5% each side. */
  function clampCrop(c) {
    const MIN = 0.05;
    let x0 = Math.min(Math.max(+c.x0 || 0, 0), 1), y0 = Math.min(Math.max(+c.y0 || 0, 0), 1);
    let x1 = Math.min(Math.max(+c.x1 || 0, 0), 1), y1 = Math.min(Math.max(+c.y1 || 0, 0), 1);
    if (x1 < x0) [x0, x1] = [x1, x0];
    if (y1 < y0) [y0, y1] = [y1, y0];
    if (x1 - x0 < MIN) { if (x0 + MIN <= 1) x1 = x0 + MIN; else { x1 = 1; x0 = 1 - MIN; } }
    if (y1 - y0 < MIN) { if (y0 + MIN <= 1) y1 = y0 + MIN; else { y1 = 1; y0 = 1 - MIN; } }
    return { x0, y0, x1, y1 };
  }

  /** Otsu threshold from a 256-bin histogram. */
  function otsu(hist) {
    let total = 0, sum = 0;
    for (let i = 0; i < 256; i++) { total += hist[i]; sum += i * hist[i]; }
    if (!total) return 128;
    let wB = 0, sumB = 0, best = -1, thr = 128;
    for (let t = 0; t < 256; t++) {
      wB += hist[t]; if (!wB) continue;
      const wF = total - wB; if (!wF) break;
      sumB += t * hist[t];
      const mB = sumB / wB, mF = (sum - sumB) / wF;
      const v = wB * wF * (mB - mF) * (mB - mF);
      if (v > best) { best = v; thr = t; }
    }
    return thr;
  }

  /**
   * In-place filter on RGBA data. opts: {mode:'color'|'gray'|'bw', brightness:-50..50, contrast:-50..50}
   * Returns the threshold used for 'bw' (else null).
   */
  function applyFilter(data, opts) {
    const mode = (opts && opts.mode) || 'color';
    const b = Math.max(-50, Math.min(50, Number(opts && opts.brightness) || 0)) * 2.55;
    const cc = Math.max(-50, Math.min(50, Number(opts && opts.contrast) || 0)) * 2.55;
    const f = (259 * (cc + 255)) / (255 * (259 - cc));
    const adj = v => { v = f * (v - 128) + 128 + b; return v < 0 ? 0 : v > 255 ? 255 : v; };
    const lut = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) lut[i] = Math.round(adj(i));
    const n = data.length;
    if (mode === 'color') {
      if (!b && !cc) return null;
      for (let i = 0; i < n; i += 4) { data[i] = lut[data[i]]; data[i + 1] = lut[data[i + 1]]; data[i + 2] = lut[data[i + 2]]; }
      return null;
    }
    const hist = new Uint32Array(256);
    for (let i = 0; i < n; i += 4) {
      const l = lut[Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])];
      data[i] = data[i + 1] = data[i + 2] = l; hist[l]++;
    }
    if (mode !== 'bw') return null;
    const thr = otsu(hist);
    for (let i = 0; i < n; i += 4) { const v = data[i] > thr ? 255 : 0; data[i] = data[i + 1] = data[i + 2] = v; }
    return thr;
  }

  /**
   * Find the best JPEG quality/scale that fits targetBytes while keeping text readable.
   * encode(scale, quality) -> Promise<{size:number, payload:any}>
   * Returns {met, scale, quality, size, payload, tried}. If not met, returns the smallest result tried.
   */
  async function searchToTarget(encode, targetBytes, o) {
    o = o || {};
    const minQ = o.minQuality != null ? o.minQuality : LIMITS.minQuality;
    const maxQ = o.maxQuality != null ? o.maxQuality : LIMITS.maxQuality;
    const minSide = o.minSide != null ? o.minSide : LIMITS.minReadableSide;
    const longest = Math.max(o.width || 0, o.height || 0);
    const scales = [1, 0.85, 0.7, 0.58, 0.48].filter((s, i) => i === 0 || !longest || longest * s >= minSide);
    let tried = 0, smallest = null;
    const run = async (s, q) => { tried++; const r = await encode(s, q); r.scale = s; r.quality = q; if (!smallest || r.size < smallest.size) smallest = r; return r; };
    for (const s of scales) {
      const top = await run(s, maxQ);
      if (top.size <= targetBytes) return { met: true, scale: s, quality: maxQ, size: top.size, payload: top.payload, tried };
      const low = await run(s, minQ);
      if (low.size > targetBytes) continue;
      let lo = minQ, hi = maxQ, best = low;
      for (let k = 0; k < 6; k++) {
        const mid = (lo + hi) / 2, r = await run(s, mid);
        if (r.size <= targetBytes) { best = r; lo = mid; } else hi = mid;
      }
      return { met: true, scale: s, quality: best.quality, size: best.size, payload: best.payload, tried };
    }
    return { met: false, scale: smallest.scale, quality: smallest.quality, size: smallest.size, payload: smallest.payload, tried };
  }

  /** Read width/height/components from JPEG bytes (SOF marker). Returns null if not a JPEG. */
  function jpegInfo(b) {
    if (!b || b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return null;
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xFF) { i++; continue; }
      const m = b[i + 1];
      if (m === 0xFF) { i++; continue; }
      if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
      const len = (b[i + 2] << 8) | b[i + 3];
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
        return { h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8], comps: b[i + 9] };
      }
      i += 2 + len;
    }
    return null;
  }

  /** Minimal single-page PDF embedding a JPEG (no library). Returns Uint8Array. */
  function buildPdf(jpeg) {
    const info = jpegInfo(jpeg);
    if (!info || !info.w || !info.h) throw new Error('Invalid JPEG data');
    const A4 = [595.28, 841.89], M = 18;
    const land = info.w > info.h;
    const pw = land ? A4[1] : A4[0], ph = land ? A4[0] : A4[1];
    const s = Math.min((pw - 2 * M) / info.w, (ph - 2 * M) / info.h);
    const w = info.w * s, h = info.h * s, x = (pw - w) / 2, y = (ph - h) / 2;
    const cs = info.comps === 1 ? '/DeviceGray' : '/DeviceRGB';
    const enc = new TextEncoder();
    const f = v => v.toFixed(2);
    const content = `q ${f(w)} 0 0 ${f(h)} ${f(x)} ${f(y)} cm /Im0 Do Q`;
    const parts = [], offsets = [];
    let pos = 0;
    const push = u8 => { parts.push(u8); pos += u8.length; };
    const str = s => push(enc.encode(s));
    str('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'.replace(/[\x80-\xFF]/g, '?'));
    const obj = (n, body) => { offsets[n] = pos; str(`${n} 0 obj\n${body}\nendobj\n`); };
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(pw)} ${f(ph)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
    offsets[4] = pos;
    str(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${info.w} /Height ${info.h} /ColorSpace ${cs} /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    push(jpeg);
    str('\nendstream\nendobj\n');
    obj(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const xref = pos;
    let t = 'xref\n0 6\n0000000000 65535 f \n';
    for (let n = 1; n <= 5; n++) t += String(offsets[n]).padStart(10, '0') + ' 00000 n \n';
    t += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    str(t);
    const out = new Uint8Array(pos);
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  }

  function formatSize(bytes) {
    return bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';
  }

  return { LIMITS, TARGETS_KB, checkFile, fitDims, rotatedDims, clampCrop, otsu, applyFilter, searchToTarget, jpegInfo, buildPdf, formatSize };
});
