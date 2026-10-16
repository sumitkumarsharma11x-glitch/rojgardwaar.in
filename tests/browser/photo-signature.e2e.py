"""Real-browser test of tools/photo-signature.html (Chromium via Playwright).
Run:  python3 tests/browser/photo-signature.e2e.py      (needs: pip install playwright pillow; playwright install chromium)
"""
import http.server, threading, os, io, sys, random, tempfile, functools
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{srv.server_address[1]}/tools/photo-signature.html'
tmp = tempfile.mkdtemp()
random.seed(1)

def noisy(w, h):
    im = Image.effect_noise((w, h), 80).convert('RGB')
    d = ImageDraw.Draw(im); d.ellipse((w*.25, h*.15, w*.75, h*.6), fill=(200, 150, 120))
    return im
def save(im, name, **kw):
    p = os.path.join(tmp, name); im.save(p, **kw); return p
photo = save(noisy(3000, 4000), 'photo.jpg', quality=92)
sign = Image.new('RGBA', (900, 300), (0, 0, 0, 0)); d = ImageDraw.Draw(sign)
for i in range(12): d.line((20+i*70, 250-(i%3)*60, 80+i*70, 60+(i%4)*40), fill=(10, 10, 120, 255), width=8)
sign = save(sign, 'sign.png')
huge = save(Image.new('RGB', (8000, 6000), (90, 140, 200)), 'huge.jpg', quality=70)
ex = Image.new('RGB', (400, 200), (255, 0, 0)); exif = Image.Exif(); exif[0x0112] = 6
rot = save(ex, 'rot.jpg', exif=exif)
txt = os.path.join(tmp, 'a.txt'); open(txt, 'w').write('hello')
fake = os.path.join(tmp, 'fake.jpg'); open(fake, 'wb').write(b'%PDF-1.4 not an image' * 50)
heic = os.path.join(tmp, 'x.heic'); open(heic, 'wb').write(b'\x00' * 100)

fails = []; passed = 0
def check(cond, label):
    global passed
    if cond: passed += 1; print('PASS', label)
    else: fails.append(label); print('FAIL', label)

def settle(page, ms=1800): page.wait_for_timeout(ms)
def text(page, sel): return page.inner_text(sel)
def dl(page, name):
    with page.expect_download() as d: page.click('#dl')
    path = os.path.join(tmp, name); d.value.save_as(path); return path

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 800}, device_scale_factor=2, accept_downloads=True, has_touch=True, is_mobile=True)
    page = ctx.new_page()
    errors, reqs = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('request', lambda r: reqs.append(r.url))
    page.goto(BASE); settle(page, 600)

    check('चुनें' in text(page, '#verdict') and page.is_disabled('#dl'), 'initial: asks for images, download disabled')
    # --- both images, 50 KB limit
    page.set_input_files('#fPhoto', photo); page.set_input_files('#fSign', sign); settle(page, 800)
    check('3000 × 4000' in text(page, '#nPhoto'), 'photo loaded and original dimensions shown')
    page.click('#kbChips [data-kb="50"]'); settle(page)
    stats = text(page, '#stats')
    check('413 × 767 px' in stats and 'JPG' in stats, 'stats show dimensions and format')
    f = dl(page, 'out1.jpg'); im = Image.open(f)
    check(im.size == (413, 767) and im.format == 'JPEG', 'downloaded file is JPEG 413x767')
    check(os.path.getsize(f) <= 50*1024, f'downloaded file {os.path.getsize(f)} B <= 50 KB')
    check('✓' in text(page, '#verdict') and 'msg ok' in page.get_attribute('#verdict', 'class'), 'verdict green only after real checks')
    # displayed size equals real size
    shown = float(stats.split('File size: ')[1].split(' KB')[0])
    check(abs(shown*1024 - os.path.getsize(f)) < 20, 'displayed KB equals real file size')
    # preview not blank
    px = page.evaluate("()=>{const c=document.getElementById('preview');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=new Set();for(let i=0;i<d.length;i+=400)s.add(d[i]+','+d[i+1]);return s.size}")
    check(px > 5, 'preview shows image content')
    # --- impossible target
    page.fill('#kb', '3'); settle(page)
    check('msg err' in page.get_attribute('#verdict', 'class') and '✗' in text(page, '#stats'), 'impossible 3 KB: red warning, ✗ shown')
    check('फिर भी' in text(page, '#dl'), 'impossible target: download labelled as over limit')
    f2 = dl(page, 'out2.jpg'); check(os.path.getsize(f2) > 3*1024, 'over-limit file is honestly larger than target')
    # --- PNG + side layout
    page.fill('#kb', ''); page.click('#kbChips [data-kb=""]')
    page.click('#layoutBox summary')
    page.select_option('#fmt', 'png'); page.click('input[name=layout][value=side] + span'); page.fill('#w', '800'); page.fill('#h', '300'); settle(page, 2000)
    f3 = dl(page, 'out3.png'); im3 = Image.open(f3)
    check(im3.size == (800, 300) and im3.format == 'PNG', 'PNG side-by-side 800x300')
    page.select_option('#fmt', 'jpeg'); page.fill('#w', '413'); page.fill('#h', '767'); page.click('input[name=layout][value=stack] + span')
    # --- gap and alignment: layout geometry in exported pixels (white gap rows)
    page.evaluate("()=>{const g=document.getElementById('gap');g.value=60;g.dispatchEvent(new Event('input',{bubbles:true}))}"); settle(page, 1500)
    f4 = dl(page, 'out4.jpg'); im4 = Image.open(f4).convert('RGB')
    ph = round((767 - 60) * 0.69)
    gap_ok = all(min(im4.getpixel((x, y))) > 250 for y in range(ph + 3, ph + 57) for x in range(0, 413, 20))
    check(gap_ok, f'60px gap is exactly white between photo (ends y={ph}) and signature')
    check(any(min(im4.getpixel((x, ph - 5))) < 200 for x in range(0, 413, 5)), 'photo content right above the gap')
    page.evaluate("()=>{const g=document.getElementById('gap');g.value=0;g.dispatchEvent(new Event('input',{bubbles:true}))}")
    # --- invalid inputs
    for fpath, label in [(txt, 'text file'), (fake, 'corrupt image'), (heic, 'HEIC')]:
        page.set_input_files('#fPhoto', fpath); settle(page, 500)
        check('msg err' in page.get_attribute('#ePhoto', 'class') and text(page, '#ePhoto').strip() != '', f'rejects {label} with message')
    check('3000 × 4000' in text(page, '#nPhoto'), 'previous valid photo kept after bad pick')
    page.fill('#w', '0'); settle(page, 500)
    check(page.is_disabled('#dl') and 'msg err' in page.get_attribute('#eReq', 'class'), 'width 0: error and download disabled')
    page.fill('#w', '413'); page.fill('#h', '99999'); settle(page, 500)
    check(page.is_disabled('#dl'), 'height 99999: download disabled')
    page.fill('#h', '767')
    page.fill('#kb', ''); settle(page, 1500)
    # --- huge image
    page.set_input_files('#fPhoto', huge); settle(page, 2500)
    check('8000 × 6000' in text(page, '#nPhoto') and 'छोटा करके' in text(page, '#nPhoto'), 'huge image loads and is downscaled for processing')
    check(not page.is_disabled('#dl'), 'huge image still exports')
    # --- EXIF orientation
    page.set_input_files('#fPhoto', rot); settle(page, 800)
    check('200 × 400' in text(page, '#nPhoto'), 'EXIF rotation honoured (400x200 stored -> 200x400)')
    # --- missing signature
    page.click('#reset'); settle(page, 500)
    page.set_input_files('#fPhoto', photo); settle(page, 1500)
    check(page.is_disabled('#dl') and 'हस्ताक्षर' in text(page, '#verdict'), 'photo only in combined mode: asks for signature')
    # --- photo-only mode
    page.click('input[name=mode][value=photo] + span'); settle(page, 1800)
    check(not page.is_disabled('#dl') and '413 × 531' in text(page, '#stats'), 'photo-only mode exports 413x531')
    # --- reset
    page.click('#reset'); settle(page, 600)
    check(page.input_value('#fPhoto') == '' and text(page, '#nPhoto') == '' and page.is_disabled('#dl') and page.input_value('#w') == '413' and page.input_value('#h') == '767', 'reset clears files, outputs and defaults')
    # --- mobile layout
    sw = page.evaluate('document.documentElement.scrollWidth'); iw = page.evaluate('window.innerWidth')
    check(sw <= iw, f'no horizontal scroll at 390px ({sw}<={iw})')
    small = page.evaluate("()=>[...document.querySelectorAll('button,.btn,select,input[type=number]')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height<44).map(e=>e.id||e.className)")
    check(not small, f'tap targets >= 44px {small}')
    ext = [r for r in reqs if not r.startswith(('http://127.0.0.1', 'blob:', 'data:'))]
    check(not ext, f'no external network requests {ext}')
    check(len([r for r in reqs if r.startswith('data:') is False]) < 8, f'few requests ({len(reqs)})')
    check(not errors, f'no console/page errors {errors}')
    # --- tiny screen
    page.set_viewport_size({'width': 320, 'height': 640}); settle(page, 300)
    check(page.evaluate('document.documentElement.scrollWidth') <= 320, 'no horizontal scroll at 320px')
    page.screenshot(path=os.path.join(tmp, 'mobile.png'), full_page=True)
    b.close()
print(f'\n{passed} passed, {len(fails)} failed', fails)
print('screenshot:', os.path.join(tmp, 'mobile.png'))
sys.exit(1 if fails else 0)
