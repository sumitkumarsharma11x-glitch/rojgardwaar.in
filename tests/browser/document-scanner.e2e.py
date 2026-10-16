"""Real-browser test of tools/document-scanner.html (Chromium via Playwright).
Run:  python3 tests/browser/document-scanner.e2e.py
Needs: pip install playwright pillow pypdf pypdfium2 ; playwright install chromium
Exits non-zero if any check fails.
"""
import http.server, threading, os, io, sys, random, tempfile, functools
from PIL import Image, ImageDraw, ImageFont
import pypdf, pypdfium2
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
HOST = f'127.0.0.1:{srv.server_address[1]}'
URL = f'http://{HOST}/tools/document-scanner.html'
tmp = tempfile.mkdtemp()
random.seed(7)

def make_doc(w=2400, h=3200):
    im = Image.new('RGB', (w, h), (236, 232, 222))
    d = ImageDraw.Draw(im)
    try: f = ImageFont.load_default(size=46)
    except TypeError: f = ImageFont.load_default()
    y = 220
    while y < h - 260:
        d.text((220, y), 'Sample application form line %d  Name: RAMESH KUMAR  DOB 01/01/2000' % (y // 70), fill=(25, 25, 35), font=f)
        y += 74
    d.ellipse((1500, 2500, 2100, 3000), outline=(200, 20, 20), width=14)   # red stamp
    d.text((1640, 2700), 'STAMP', fill=(200, 20, 20), font=f)
    noise = Image.effect_noise((w, h), 14).convert('RGB')                   # camera grain
    return Image.blend(im, noise, 0.07)

def save(im, name, **kw):
    p = os.path.join(tmp, name); im.save(p, **kw); return p

doc = save(make_doc(), 'doc.jpg', quality=90)
hard = save(Image.effect_noise((3000, 4000), 90).convert('RGB'), 'hard.jpg', quality=95)  # incompressible
txt = os.path.join(tmp, 'a.txt'); open(txt, 'w').write('hello')
fake = os.path.join(tmp, 'fake.jpg'); open(fake, 'wb').write(b'%PDF-1.4 not an image' * 50)
heic = os.path.join(tmp, 'x.heic'); open(heic, 'wb').write(b'\x00' * 100)
empty = os.path.join(tmp, 'empty.jpg'); open(empty, 'wb').close()

fails, passed = [], 0
def check(cond, label):
    global passed
    if cond: passed += 1; print('PASS', label)
    else: fails.append(label); print('FAIL', label)

def cls(page, sel): return page.get_attribute(sel, 'class') or ''
def upload(page, path):
    page.set_input_files('#file', path)
def make(page, fmt, kb, mode=None):
    if mode: page.check(f'input[name=mode][value={mode}]')
    page.select_option('#fmt', fmt); page.select_option('#tgt', str(kb))
    page.click('#make')
    page.wait_for_selector('#result:not([hidden])', timeout=90000)
    page.wait_for_function("!document.getElementById('make').disabled", timeout=30000)
def download(page, name):
    with page.expect_download() as d: page.click('#dl')
    p = os.path.join(tmp, name); d.value.save_as(p); return p
def mean_l(p):
    h = Image.open(p).convert('L').histogram(); return sum(i * c for i, c in enumerate(h)) / sum(h)
def shown_kb(page):
    t = page.inner_text('#resSize').split()
    v = float(t[0]); return v * 1024 if t[1] == 'KB' else v * 1048576

with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--no-sandbox'])
    ctx = br.new_context(viewport={'width': 1200, 'height': 900})
    ctx.add_init_script("""window.__u={c:0,r:0};const c=URL.createObjectURL.bind(URL),r=URL.revokeObjectURL.bind(URL);
      URL.createObjectURL=o=>{window.__u.c++;return c(o)};URL.revokeObjectURL=u=>{window.__u.r++;return r(u)};""")
    page = ctx.new_page()
    errors, hosts = [], set()
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: hosts.add(r.url.split('/')[2]) if r.url.startswith('http') else None)
    page.goto(URL)

    # --- initial state
    check(page.is_hidden('#sCrop') and page.is_hidden('#sEnh') and page.is_hidden('#sOut'), 'editing panels hidden before upload')
    check(page.get_attribute('#cam', 'capture') == 'environment', 'camera input uses capture=environment')
    check(page.is_hidden('#camBtn'), 'camera button hidden on non-touch desktop (no dead control)')

    # --- invalid inputs
    for path, label in [(txt, 'text file'), (fake, 'corrupted jpg'), (heic, 'HEIC'), (empty, 'empty file')]:
        upload(page, path); page.wait_for_timeout(700)
        check('err' in cls(page, '#msgLoad') and page.inner_text('#msgLoad').strip() != '', f'invalid input rejected with message: {label}')
        check(page.is_hidden('#sCrop'), f'no editor shown after {label}')

    # --- valid upload
    upload(page, doc); page.wait_for_selector('#sCrop:not([hidden])', timeout=20000)
    check('ok' in cls(page, '#msgLoad'), 'valid document loads')
    check(page.is_checked('input[name=mode][value=color]'), 'Color is the default mode')
    cw, ch = page.evaluate("[crop.width, crop.height]")
    check(ch > cw, 'original preview is portrait like the photo')
    page.click('#rotR'); cw2, ch2 = page.evaluate("[crop.width, crop.height]")
    check(ch2 < cw2 and abs((cw2 / ch2) - (ch / cw)) < 0.02, 'rotate right turns portrait preview into landscape (aspect inverted)')
    page.click('#rotL'); cw3, ch3 = page.evaluate("[crop.width, crop.height]")
    check(ch3 > cw3 and abs((cw3 / ch3) - (cw / ch)) < 0.02, 'rotate left restores portrait aspect')
    check(page.evaluate("prev.width>1 && prev.height>1"), 'processed preview is drawn')

    # --- JPG color at each target (uncropped)
    sizes = {}
    for kb in (100, 200, 500):
        make(page, 'jpg', kb, 'color')
        p = download(page, f'c{kb}.jpg'); actual = os.path.getsize(p)
        im = Image.open(p); im.load()
        met = 'ok' in cls(page, '#msgOut'); sizes[kb] = actual
        check(im.format == 'JPEG', f'JPG {kb}KB: downloaded file is a real JPEG')
        check(abs(shown_kb(page) - actual) <= 0.06 * 1024 + 1, f'JPG {kb}KB: displayed size matches real file ({actual} B)')
        check((met and actual <= kb * 1024) or (not met and actual > kb * 1024 and 'warn' in cls(page, '#msgOut')), f'JPG {kb}KB: message honest (met={met}, {actual} B)')
        if kb >= 200: check(met, f'JPG {kb}KB: target achievable for a normal document photo')
        check(min(im.size) >= 600, f'JPG {kb}KB: still readable resolution {im.size}')
        if kb == 500: color_ref = p
    check(sizes[100] < sizes[200] < sizes[500] or sizes[100] <= sizes[200] <= sizes[500], 'larger target never gives smaller file')

    # --- color vs gray vs bw
    def sat(p):
        im = Image.open(p).convert('RGB').resize((400, 530)); px = list(im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata())
        return max(max(a, b, c) - min(a, b, c) for a, b, c in px)
    check(sat(color_ref) > 60, 'Color mode keeps colour (red stamp survives)')
    make(page, 'jpg', 500, 'gray'); pg = download(page, 'gray.jpg')
    check(sat(pg) <= 6, 'Grayscale mode output has no colour')
    make(page, 'jpg', 500, 'bw'); pb = download(page, 'bw.jpg')
    hg = Image.open(pb).convert('L').histogram(); ext = (sum(hg[:50]) + sum(hg[206:])) / sum(hg)
    ink = sum(hg[:50]) / sum(hg)
    check(ext > 0.99 and 0.02 < ink < 0.5, f'Black & White output is pure black/white at native size (extreme={ext:.4f}, ink={ink:.3f})')
    page.check('input[name=mode][value=color]')

    # --- brightness changes output
    page.fill('#bri', '40'); page.dispatch_event('#bri', 'input')
    make(page, 'jpg', 500); pbr = download(page, 'bright.jpg')
    m1 = mean_l(color_ref); m2 = mean_l(pbr)
    check(m2 > m1, 'Brightness slider changes the exported image')
    page.click('#enhReset')

    # --- PDF at each target
    for kb in (100, 200, 500):
        make(page, 'pdf', kb, 'color')
        p = download(page, f't{kb}.pdf'); actual = os.path.getsize(p)
        met = 'ok' in cls(page, '#msgOut')
        rd = pypdf.PdfReader(p)
        check(len(rd.pages) == 1, f'PDF {kb}KB: opens with pypdf, 1 page')
        check(len(list(rd.pages[0].images)) == 1, f'PDF {kb}KB: contains the scanned image')
        r = pypdfium2.PdfDocument(p)[0].render(scale=0.5).to_pil().convert('L')
        rh = r.histogram()
        check(sum(rh[:80]) > 0 and sum(rh[200:]) > 0, f'PDF {kb}KB: renders with visible text on white page')
        check(abs(shown_kb(page) - actual) <= 0.06 * 1024 + 1, f'PDF {kb}KB: displayed size matches real file ({actual} B)')
        check((met and actual <= kb * 1024) or (not met and actual > kb * 1024), f'PDF {kb}KB: message honest (met={met})')
        check(page.get_attribute('#dl', 'download').endswith('.pdf'), f'PDF {kb}KB: .pdf filename')

    # --- crop drag: drag bottom-right corner to 50% width only -> output aspect must change to ~0.375
    make(page, 'jpg', 500); fw, fh = Image.open(download(page, 'full.jpg')).size
    page.locator('#crop').scroll_into_view_if_needed()
    box = page.locator('#crop').bounding_box()
    sx, sy = box['x'] + box['width'] - 3, box['y'] + box['height'] - 3
    page.mouse.move(sx, sy); page.mouse.down()
    page.mouse.move(box['x'] + box['width'] * .5, sy, steps=8); page.mouse.up()
    page.wait_for_timeout(200)
    make(page, 'jpg', 500); cw_, ch_ = Image.open(download(page, 'cropped.jpg')).size
    check(abs(fw / fh - 0.75) < 0.01 and abs(cw_ / ch_ - 0.375) < 0.03, f'crop drag applied: aspect {fw/fh:.3f} -> {cw_/ch_:.3f} (expected ~0.375)')
    page.click('#cropReset')
    make(page, 'jpg', 500); rw, rh = Image.open(download(page, 'reset.jpg')).size
    check(abs(rw / rh - 0.75) < 0.01, 'Crop reset restores full frame')

    # --- stale result is invalidated when settings change
    make(page, 'jpg', 200)
    page.select_option('#tgt', '100')
    check(page.is_hidden('#result') and page.get_attribute('#dl', 'href') is None, 'changing a setting hides stale result and removes download link')

    # --- object URL hygiene
    u = page.evaluate('window.__u'); check(u['c'] - u['r'] <= 2, f'object URLs revoked (created {u["c"]}, revoked {u["r"]})')

    # --- unreachable target is reported honestly
    upload(page, hard); page.wait_for_selector('#sCrop:not([hidden])'); page.wait_for_timeout(500)
    make(page, 'jpg', 100, 'color'); ph = download(page, 'hard100.jpg'); a = os.path.getsize(ph)
    check(a > 100 * 1024 and 'warn' in cls(page, '#msgOut') and 'NOT met' in page.inner_text('#msgOut') and 'ok' not in cls(page, '#msgOut'),
          f'impossible 100KB target is reported as NOT met (file {a} B)')

    # --- processing error handled
    page.evaluate("(()=>{HTMLCanvasElement.prototype.toBlob=function(cb){if(typeof cb==='function')cb(null)}})()")
    page.click('#make'); page.wait_for_selector('#msgOut.err', timeout=20000)
    check(not page.is_disabled('#make'), 'encoding failure shows error and re-enables the UI')

    check(errors == [], f'no console/page errors {errors[:2]}')
    check(hosts <= {HOST}, f'no requests to external hosts: {hosts - {HOST}}')

    # --- mobile layout
    mctx = br.new_context(viewport={'width': 360, 'height': 640}, has_touch=True, is_mobile=True, device_scale_factor=2)
    m = mctx.new_page(); m.goto(URL); m.set_input_files('#file', doc); m.wait_for_selector('#sCrop:not([hidden])')
    m.wait_for_timeout(500)
    check(m.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"), 'mobile 360px: no horizontal overflow')
    check(m.is_visible('#camBtn'), 'mobile: camera button visible on touch device')
    small = m.evaluate("[...document.querySelectorAll('button,.btn,select')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height<44).length")
    check(small == 0, 'mobile: all tap targets >= 44px')
    m.click('#rotR'); m.wait_for_timeout(200)
    check(m.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"), 'mobile: still no overflow after rotate')
    br.close()

print(f'\n{passed} passed, {len(fails)} failed')
if fails: print('FAILED:', *fails, sep='\n  '); sys.exit(1)
