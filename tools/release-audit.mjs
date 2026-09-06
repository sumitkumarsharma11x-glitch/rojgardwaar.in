// RELEASE AUDIT — production-level browser audit against local preview (:8000).
// Covers: routes, landing regression, content counts, practice (4 chapters),
// mock engine (+randomization across 2 sessions), revision, language toggle,
// deep links, chemistry C03 shell behavior, mobile viewport, JS errors.
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:8000';
const results = [];
const jsErrors = [];        // global gate (all pages except C03 shell, tracked separately)
const failedRequests = [];  // global gate (local URLs only)
const externalFails = [];  // sandbox-offline artifacts, reported separately
function pass(name) { results.push([name, true]); console.log(`  PASS  ${name}`); }
function fail(name, why) { results.push([name, false]); console.log(`  FAIL  ${name} :: ${why}`); }
async function check(name, condFn) {
  try { const v = await condFn(); v ? pass(name) : fail(name, 'condition false'); }
  catch (e) { fail(name, e.message.split('\n')[0]); }
}

const browser = await chromium.launch({
  executablePath: '/tmp/chromium', headless: true,
  env: { ...process.env, LD_LIBRARY_PATH: '/tmp/al2023/lib' },
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--single-process'],
});

function wire(page, bucket = jsErrors) {
  page.on('pageerror', (e) => bucket.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') bucket.push(`console: ${m.text()}`); });
  const localOnly = (u) => u.startsWith(BASE) || u.startsWith('/');
  page.on('response', (r) => { if (r.status() >= 400 && localOnly(r.url())) failedRequests.push(`${r.status()} ${r.url().replace(BASE, '')}`); });
  page.on('requestfailed', (r) => { if (localOnly(r.url())) failedRequests.push(`REQFAIL ${r.url().replace(BASE, '')}`); else externalFails.push(r.url().slice(0, 80)); });
}
const ctx = await browser.newContext();
let page = await ctx.newPage();
wire(page);

console.log('== A. ROUTES ==');
await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 45000 });
await check('A1 / → 200 + Eligibility Tool intact (title)', async () =>
  (await page.title()).includes('Check Your Exam Eligibility'));
const homeBody = await page.evaluate(() => document.body.innerText);
await check('A2 / eligibility content renders (form/app present)', () => homeBody.trim().length > 200);

await page.goto(BASE + '/mock-test.html', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForSelector('#rjd-home-root, #rjd-app-root, body *', { timeout: 20000 });
const landingText = await page.evaluate(() => document.body.innerText);
await check('A3/B1 /mock-test.html → Science Preparation branding', async () =>
  /science preparation/i.test(await page.title()) || /science preparation|विज्ञान/i.test(landingText));
await check('B2 subjects listed: Biology + Physics + Chemistry', () =>
  /biology/i.test(landingText) && /physics/i.test(landingText) && /chemistry/i.test(landingText));
await check('B3 language toggle present on landing', async () =>
  (await page.locator('[data-lang], .rjd-lang-toggle, #rjd-lang-toggle, button:has-text("EN"), button:has-text("हिं")').count()) > 0);

// B4 chapter navigation: click Biology subject → chapter links appear
let bioChapters = 0;
try {
  const bioCard = page.locator('a:has-text("Biology"), [class*="subject"]:has-text("Biology"), button:has-text("Biology")').first();
  await bioCard.click({ timeout: 8000 });
  await page.waitForTimeout(1200);
  bioChapters = await page.locator('a[href*="chapter.html"]').count();
} catch { /* stay */ }
await check('B4 subject → chapter navigation (Biology chapters visible)', () => bioChapters >= 12);

console.log('== B. CONTENT (manifest via app loader) ==');
const manifestInfo = await page.evaluate(async () => {
  const m = await (await fetch('data/manifest.json')).json();
  const subs = {};
  for (const s of m.subjects || []) subs[s.subject] = (s.chapters || []).length;
  return subs;
});
await check('B5 manifest: bio 12 / physics 12 / chemistry 12 listed', () =>
  manifestInfo.biology === 12 && manifestInfo.physics === 12 && manifestInfo.chemistry === 12);

console.log('== C. PRACTICE (B01, P06, C01, C02) ==');
const PRACTICE = [
  ['biology-ch01', 'biology', 'chapter-01', 150],
  ['physics-ch06', 'physics', 'chapter-06', 150],
  ['chem-C01', 'chemistry', 'chapter-01', 200],
  ['chem-C02', 'chemistry', 'chapter-02', 200],
];
for (const [label, subj, ch, n] of PRACTICE) {
  await page.goto(`${BASE}/chapter.html?subject=${subj}&chapter=${ch}`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForSelector('#rjd-app-root *', { timeout: 20000 });
  const hubText = await page.evaluate(() => document.getElementById('rjd-app-root').innerText);
  await check(`C1-${label} hub renders + stats ${n}+`, () => new RegExp(`${n}\\+`).test(hubText));
  await page.locator('[data-tab="practice"]').click();
  await page.waitForSelector('#rjd-practice-container .rjd-practice-card', { timeout: 20000 });
  const eyebrow = await page.locator('.rjd-practice-card__meta .rjd-eyebrow').innerText();
  const optCount = await page.locator('.rjd-option').count();
  await check(`C2-${label} practice Q1/${n}, 4 options`, () =>
    new RegExp(`1\\s*\\/\\s*${n}`).test(eyebrow) && optCount === 4);
  const bank = await page.evaluate(async ({ s, c }) => {
    const b = await DataLoader.loadChapter('6', s, c);
    return { correct0: b.questions[0].correct, expl0: b.questions[0].explanation.hi, q0: b.questions[0].question.hi };
  }, { s: subj, c: ch });
  await page.locator(`.rjd-option[data-index="${(bank.correct0 + 1) % 4}"]`).click();
  await page.locator('#rjd-check').click();
  await page.waitForSelector('#rjd-feedback:not([hidden])', { timeout: 10000 });
  const fb = await page.locator('#rjd-feedback').innerText();
  await check(`C3-${label} answer check + real Hindi explanation`, () =>
    (fb.includes('✅') || fb.includes('❌')) && fb.includes(bank.expl0.slice(0, 12)));
  await page.locator('#rjd-next').click();
  await page.waitForTimeout(400);
  const eb2 = await page.locator('.rjd-practice-card__meta .rjd-eyebrow').innerText();
  await page.locator('#rjd-prev').click();
  await page.waitForTimeout(400);
  const eb1 = await page.locator('.rjd-practice-card__meta .rjd-eyebrow').innerText();
  await check(`C4-${label} next/prev + progress counter`, () =>
    new RegExp(`2\\s*\\/\\s*${n}`).test(eb2) && new RegExp(`1\\s*\\/\\s*${n}`).test(eb1));
}

console.log('== D. MOCK TEST (P06) ==');
async function runMockSession(b = browser) {
  const c = await b.newContext();
  const p = await c.newPage();
  wire(p);
  await p.goto(`${BASE}/chapter.html?subject=physics&chapter=chapter-06`, { waitUntil: 'networkidle', timeout: 45000 });
  await p.waitForSelector('#rjd-app-root *', { timeout: 20000 });
  await p.locator('[data-tab="mocktests"]').click();
  await p.waitForSelector('.rjd-testcard-grid', { timeout: 20000 });
  const href = await p.locator('.rjd-testcard-grid a[href*="mode=mock"]').first().getAttribute('href');
  await p.goto(BASE + '/' + href, { waitUntil: 'networkidle', timeout: 45000 });
  await p.waitForSelector('#rjd-question-area *', { timeout: 20000 });
  const firstId = await p.evaluate(() => (window.currentTestSession?.questions?.[0]?.id) || null);
  const qText = (await p.locator('#rjd-question-area').innerText()).slice(0, 60);
  const opt0 = await p.locator('#rjd-question-area .rjd-option').first().innerText();
  return { c, p, firstId, qText, opt0, href };
}
const s1 = await runMockSession();
await check('D1 mock opens, question renders', () => s1.qText.trim().length > 10);
const paletteCount = await s1.p.locator('#rjd-palette *').count();
await check('D2 palette renders 30 questions', () => paletteCount === 30);
await s1.p.locator('#rjd-question-area .rjd-option[data-index="0"]').click();
await s1.p.waitForTimeout(250);
const att1 = await s1.p.locator('#rjd-palette .rjd-palette__cell--attempted').count();
await check('D3 attempted state marks on palette', () => att1 === 1);
for (let i = 1; i < 30; i++) {
  await s1.p.locator(`#rjd-palette .rjd-palette__cell[data-index="${i}"]`).click();
  await s1.p.waitForTimeout(100);
  await s1.p.locator('#rjd-question-area .rjd-option[data-index="0"]').click();
  await s1.p.waitForTimeout(50);
}
const attAll = await s1.p.locator('#rjd-palette .rjd-palette__cell--attempted').count();
await check('D4 all 30 answered via palette navigation', () => attAll === 30);
await s1.p.locator('#rjd-submit').click();
await s1.p.waitForSelector('.rjd-modal [data-action="confirm"]', { timeout: 10000 });
await s1.p.locator('.rjd-modal [data-action="confirm"]').click();
await s1.p.waitForSelector('.rjd-result', { timeout: 20000 });
const scoreText = await s1.p.locator('.rjd-result__score').innerText();
await check('D5 submit → result + score %', () => /%/.test(scoreText));
const wrongIds = await s1.p.evaluate(() => WrongQuestionManager.getIds('6', 'physics', 'chapter-06'));
const validWrong = wrongIds.every((id) => /^phy6_q\d+$/.test(id));
await check('D6 wrong questions recorded, valid IDs', () => wrongIds.length >= 1 && validWrong);
console.log(`   diag: score='${scoreText.trim()}' wrongs=${wrongIds.length}`);



console.log('== E. REVISION ==');
await s1.p.goto(`${BASE}/chapter.html?subject=physics&chapter=chapter-06&open=practice-wrong`, { waitUntil: 'networkidle', timeout: 45000 });
await s1.p.waitForSelector('#rjd-practice-container .rjd-practice-card, #rjd-practice-container .rjd-empty-state', { timeout: 20000 });
const revText = await s1.p.locator('#rjd-practice-container').innerText();
const revCount = await s1.p.locator('#rjd-practice-container .rjd-practice-card').count();
const m = revText.match(/(\d+)\s*\/\s*(\d+)/);
await check('E1 revision lists exactly wrongly answered (1/n)', () =>
  revCount === 1 && m && m[1] === '1' && Number(m[2]) === wrongIds.length);
console.log(`   diag: revision 1/${m ? m[2] : '?'} vs wrongs=${wrongIds.length}`);
await s1.c.close().catch(() => {});

// D7 randomization across two fresh sessions (separate browser instance for stability)
const browser2 = await chromium.launch({
  executablePath: '/tmp/chromium', headless: true,
  env: { ...process.env, LD_LIBRARY_PATH: '/tmp/al2023/lib' },
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--single-process'],
});
const s2 = await runMockSession(browser2);
const randDiff = (s1.firstId !== s2.firstId) || (s1.qText !== s2.qText) || (s1.opt0 !== s2.opt0);
await check('D7 question/option randomization differs across sessions', () => randDiff);
console.log(`   diag: s1 id=${s1.firstId} | s2 id=${s2.firstId} | opt0 equal=${s1.opt0 === s2.opt0}`);
await s2.c.close().catch(() => {});
await browser2.close().catch(() => {});

await ctx.close().catch(() => {});
await browser.close().catch(() => {});
const browserF = await chromium.launch({ executablePath: '/tmp/chromium', headless: true, env: { ...process.env, LD_LIBRARY_PATH: '/tmp/al2023/lib' }, args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process'] });
const ctxF = await browserF.newContext();
page = await ctxF.newPage();
wire(page);

console.log('== F. LANGUAGE (hi → en → hi on C01 practice) ==');
await page.goto(`${BASE}/chapter.html?subject=chemistry&chapter=chapter-01`, { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForSelector('#rjd-app-root *', { timeout: 20000 });
await page.locator('[data-tab="practice"]').click();
await page.waitForSelector('#rjd-practice-container .rjd-practice-card', { timeout: 20000 });
const qHi1 = (await page.locator('.rjd-practice-card .rjd-question-text, #rjd-practice-container .rjd-practice-card').first().innerText()).slice(0, 40);
const c01q = await page.evaluate(async () => {
  const b = await DataLoader.loadChapter('6', 'chemistry', 'chapter-01');
  return { hi: b.questions[0].question.hi.slice(0, 20), en: b.questions[0].question.en.slice(0, 20) };
});
await page.locator('.rjd-lang-toggle, [data-lang="en"]').first().click();
await page.waitForTimeout(600);
const enBtn = await page.locator('[data-lang="en"]:visible').count();
if (enBtn > 0) { await page.locator('[data-lang="en"]:visible').first().click(); await page.waitForTimeout(600); }
const qEn = (await page.locator('.rjd-practice-card .rjd-question-text, #rjd-practice-container .rjd-practice-card').first().innerText()).slice(0, 40);
await check('F1 Hindi → English switch (question text changes to EN)', () =>
  qEn.includes(c01q.en.slice(0, 12)) && qEn !== qHi1);
await page.locator('.rjd-lang-toggle, [data-lang="hi"]').first().click();
await page.waitForTimeout(600);
const hiBtn = await page.locator('[data-lang="hi"]:visible').count();
if (hiBtn > 0) { await page.locator('[data-lang="hi"]:visible').first().click(); await page.waitForTimeout(600); }
const qHi2 = (await page.locator('.rjd-practice-card .rjd-question-text, #rjd-practice-container .rjd-practice-card').first().innerText()).slice(0, 40);
await check('F2 English → Hindi switch (question back to HI)', () => qHi2.includes(c01q.hi.slice(0, 10)));

await ctxF.close().catch(() => {});
await browserF.close().catch(() => {});
const browserG = await chromium.launch({ executablePath: '/tmp/chromium', headless: true, env: { ...process.env, LD_LIBRARY_PATH: '/tmp/al2023/lib' }, args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process'] });
const ctxG = await browserG.newContext();
page = await ctxG.newPage();
wire(page);

console.log('== G. DEEP LINKS (direct load + reload) ==');
for (const [subj, ch] of [['biology', 'chapter-01'], ['physics', 'chapter-06'], ['chemistry', 'chapter-01'], ['chemistry', 'chapter-02']]) {
  await page.goto(`${BASE}/chapter.html?subject=${subj}&chapter=${ch}`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForSelector('#rjd-app-root *', { timeout: 20000 });
  await page.reload({ waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForSelector('#rjd-app-root *', { timeout: 20000 });
  const t = await page.evaluate(() => document.getElementById('rjd-app-root').innerText);
  await check(`G ${subj}/${ch} deep link + reload intact`, () => t.trim().length > 100);
}

console.log('== H. CHEMISTRY C03 SHELL (not-yet-released chapter) ==');
const shellErrors = [];
await ctxG.close().catch(() => {});
await browserG.close().catch(() => {});
const browserH = await chromium.launch({ executablePath: '/tmp/chromium', headless: true, env: { ...process.env, LD_LIBRARY_PATH: '/tmp/al2023/lib' }, args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process'] });
const shellCtx = await browserH.newContext();
const shellPage = await shellCtx.newPage();
shellPage.on('pageerror', (e) => shellErrors.push(`pageerror: ${e.message}`));
shellPage.on('console', (msg) => { if (msg.type() === 'error') shellErrors.push(`console: ${msg.text()}`); });
let shellRendered = false;
try {
  await shellPage.goto(`${BASE}/chapter.html?subject=chemistry&chapter=chapter-03`, { waitUntil: 'networkidle', timeout: 45000 });
  await shellPage.waitForTimeout(2500);
  const st = await shellPage.evaluate(() => ({
    rootLen: (document.getElementById('rjd-app-root')?.innerText || '').trim().length,
    bodyLen: document.body.innerText.trim().length,
  }));
  shellRendered = st.rootLen > 50 || st.bodyLen > 100;
} catch (e) { shellErrors.push('nav: ' + e.message.split('\n')[0]); }
await shellCtx.close().catch(() => {});
await browserH.close().catch(() => {});
console.log(`   diag: C03 rendered=${shellRendered}, pageerrors=${shellErrors.filter((e) => e.startsWith('pageerror')).length}, consoleErrors=${shellErrors.filter((e) => e.startsWith('console')).length}`);
if (shellErrors.filter((e) => e.startsWith('pageerror')).length > 0) {
  fail('H1 C03 shell must not crash (pageerror = critical)', `${shellErrors[0]}`);
} else {
  pass(`H1 C03 shell degrades without crash (rendered=${shellRendered})`);
}

console.log('== I. MOBILE (360×640) ==');
const browserI = await chromium.launch({ executablePath: '/tmp/chromium', headless: true, env: { ...process.env, LD_LIBRARY_PATH: '/tmp/al2023/lib' }, args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process'] });
const mob = await browserI.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
const mp = await mob.newPage();
wire(mp);
async function mobCheck(name, url, extra) {
  try {
    await mp.goto(BASE + url, { waitUntil: 'networkidle', timeout: 45000 });
    if (extra) await extra();
    await mp.waitForTimeout(400);
    const o = await mp.evaluate(() => ({
      sw: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      iw: window.innerWidth,
    }));
    const ok = o.sw <= o.iw + 2;
    ok ? pass(name) : fail(name, `horizontal overflow: scrollWidth=${o.sw} > innerWidth=${o.iw}`);
  } catch (e) { fail(name, e.message.split('\n')[0]); }
}
await mobCheck('I1 mobile / no horizontal overflow', '/');
await mobCheck('I2 mobile /mock-test.html no overflow', '/mock-test.html');
await mobCheck('I3 mobile chapter hub + practice card no overflow', '/chapter.html?subject=chemistry&chapter=chapter-02', async () => {
  await mp.waitForSelector('#rjd-app-root *', { timeout: 20000 });
  await mp.locator('[data-tab="practice"]').click().catch(() => {});
  await mp.waitForTimeout(800);
});
await mobCheck('I4 mobile mock test no overflow', '/test.html?class=6&subject=chemistry&chapter=chapter-02&mode=mock', async () => {
  await mp.waitForTimeout(1500);
});
const touch = await mp.evaluate(() => {
  const els = [...document.querySelectorAll('button, a, [role="button"]')];
  const small = els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.width < 24 || r.height < 24); });
  return { total: els.length, small: small.length };
});
console.log(`   diag: touch targets — ${touch.total} interactive, ${touch.small} below 24px (advisory)`);
await mob.close().catch(() => {});

console.log('== J. JS ERRORS / FAILED REQUESTS ==');
// Separate: (a) real JS errors vs (b) 'Failed to load resource' console shadows of
// EXTERNAL fetch failures (offline sandbox; e.g. Google Fonts on the pre-existing
// tracked index.html). (b) resolves in production and is not a site defect.
const resourceLoadShadows = jsErrors.filter((e) => e.includes('Failed to load resource'));
const realErrors = jsErrors.filter((e) => !e.includes('Failed to load resource'));
console.log(`   diag: ${resourceLoadShadows.length} resource-load console shadows == ${externalFails.length} external fetch failures (offline sandbox artifact)`);
await check('J1 0 real JS errors (pageerror/console, all audited pages)', () => realErrors.length === 0);
if (realErrors.length) realErrors.slice(0, 8).forEach((e) => console.log('   JS-ERR:', e.slice(0, 150)));
await check('J2 0 failed/404 local requests', () => failedRequests.length === 0);
console.log(`   diag: ${externalFails.length} external fetch failures (offline sandbox artifact, not site defects)`);
if (failedRequests.length) failedRequests.slice(0, 10).forEach((r) => console.log('   BAD-REQ:', r));

await browser.close().catch(() => {});
const nPass = results.filter((r) => r[1]).length;
console.log(`\nRELEASE AUDIT RESULT: ${nPass}/${results.length} checks passed`);
process.exit(nPass === results.length ? 0 : 1);
