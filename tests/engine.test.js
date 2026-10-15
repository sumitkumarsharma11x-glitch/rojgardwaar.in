'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('../js/eligibility-engine.js');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'exams.json'), 'utf8'));
const TODAY = '2026-10-15';

// ---- helpers ----
const evidence = { verifiedForCurrentCycle: true, verificationStatus: 'verified', verificationCheckedAt: '2026-10-15', verificationSourceTitle: 't', verificationNotes: 'n' };
const mk = (o = {}) => Object.assign({ id: 'x', exam: 'X', organization: 'O', minAge: 18, maxAge: 27, ageCutoffDate: '2026-08-01', qualification: 'Graduation', relaxation: { OBC: 3, SC: 5, General: 0 }, examCategory: 'ssc' }, o);
const prof = (dob, o = {}) => Object.assign({ dob, category: 'General', qualification: 'Graduation' }, o);
const type = (exam, p) => E.evaluateExam(exam, p, TODAY).statusType;

test('age window: SSC 18-27 on 01-08-2026 is born 02-08-1999 .. 01-08-2008 (official notice)', () => {
  assert.deepEqual(E.ageWindow('2026-08-01', 18, 27, 0), { earliestDob: '1999-08-02', latestDob: '2008-08-01' });
  assert.deepEqual(E.ageWindow('2026-08-01', 18, 32, 0), { earliestDob: '1994-08-02', latestDob: '2008-08-01' });
  assert.deepEqual(E.ageWindow('2026-01-01', 18, 33, 3), { earliestDob: '1990-01-02', latestDob: '2008-01-01' }); // RRB-style OBC
});
test('boundaries: exactly min, exactly max, one day either side', () => {
  const c = '2026-08-01';
  assert.equal(E.checkAge('2008-08-01', c, 18, 27, 0).status, 'met');   // turns 18 on cutoff
  assert.equal(E.checkAge('2008-08-02', c, 18, 27, 0).status, 'under'); // one day short of 18
  assert.equal(E.checkAge('1999-08-02', c, 18, 27, 0).status, 'met');   // last eligible day
  assert.equal(E.checkAge('1999-08-01', c, 18, 27, 0).status, 'over');  // turned 27 on cutoff -> out
});
test('leap-day and month-end birthdays', () => {
  assert.equal(E.checkAge('2000-02-29', '2026-02-28', 18, 27, 0).status, 'met');
  assert.equal(E.addMonthsISO('2000-02-29', 12), '2001-02-28');
  assert.equal(E.addMonthsISO('2000-01-31', 1), '2000-02-29');
  assert.equal(E.addMonthsISO('2001-03-31', -1), '2001-02-28');
  assert.equal(E.checkAge('1996-08-30', '2026-08-31', 18, 30, 0).status, 'over');
  assert.equal(E.checkAge('1996-09-01', '2026-08-31', 18, 30, 0).status, 'met');
});
test('fractional minimum age (NDA 15.5)', () => {
  assert.equal(E.ageWindow('2026-01-01', 15.5, 18.5, 0).latestDob, '2010-07-01');
});
test('cutoff differs from today: age is measured on cutoff, not today', () => {
  const b = E.ageBreakdown('1999-09-17', '2026-08-01');
  assert.deepEqual([b.years, b.months, b.days], [26, 10, 15]);
  assert.equal(E.ageBreakdown('1999-09-17', '2026-01-01').formatted, '26 years 3 months 15 days');
});
test('ageBreakdown never returns negative parts (31 Jan -> 1 Mar)', () => {
  const b = E.ageBreakdown('2001-01-31', '2002-03-01');
  assert.ok(b.years >= 0 && b.months >= 0 && b.days >= 0);
});
test('category relaxation shifts the correct maximum age', () => {
  const ex = mk();
  assert.equal(E.checkAge('1997-01-01', '2026-08-01', 18, 27, 0).status, 'over');
  assert.equal(E.checkAge('1997-01-01', '2026-08-01', 18, 27, 3).status, 'met');
  assert.equal(E.checkAge('1994-08-02', '2026-08-01', 18, 27, 5).status, 'met');
  assert.equal(E.checkAge('1994-08-01', '2026-08-01', 18, 27, 5).status, 'over');
  assert.equal(type(mk(evidence), prof('1997-01-01', { category: 'OBC' })), 'relaxation');
  assert.equal(type(mk(evidence), prof('1997-01-01')), 'age-not-met');
  assert.ok(ex);
});
test('parseDob: formats, invalid and future dates', () => {
  assert.deepEqual(E.parseDob('17-09-1999', TODAY), { ok: true, iso: '1999-09-17' });
  assert.deepEqual(E.parseDob('1999-09-17', TODAY), { ok: true, iso: '1999-09-17' });
  assert.equal(E.parseDob('31-02-2000', TODAY).ok, false);
  assert.equal(E.parseDob('29-02-2001', TODAY).ok, false);
  assert.equal(E.parseDob('29-02-2000', TODAY).ok, true);
  assert.equal(E.parseDob('16-10-2026', TODAY).ok, false);
  assert.equal(E.parseDob('', TODAY).ok, false);
  assert.equal(E.parseDob('abc', TODAY).ok, false);
});
test('qualification hierarchy and accepted lists', () => {
  const q = (u, req, acc) => E.checkQualification(u, { qualification: req, acceptedQualifications: acc }).met;
  assert.equal(q('Graduation', '12th Pass'), true);
  assert.equal(q('12th Pass', 'Graduation'), false);
  assert.equal(q('Post-Graduation', 'Graduation'), true);
  assert.equal(q('B.E. / B.Tech', 'Graduation'), true);
  assert.equal(q('Graduation', 'B.E. / B.Tech'), false);       // old code wrongly said true
  assert.equal(q('ITI', '10th Pass'), false);
  assert.equal(q('ITI', '10th Pass', ['10th Pass', 'ITI']), true);
  assert.equal(q('Graduation', 'ITI'), false);
  assert.equal(q('Diploma', '12th Pass'), false);
  assert.equal(q('', 'Graduation'), false);
});
test('unverified records are never definitive', () => {
  const ok = mk();
  assert.equal(type(ok, prof('1999-09-17')), 'potential');
  assert.equal(type(ok, prof('1990-01-01')), 'unlikely');
  assert.equal(type(ok, prof('1999-09-17', { qualification: '10th Pass' })), 'unlikely');
  for (const t of ['eligible', 'relaxation', 'age-not-met', 'qualification-not-met']) assert.notEqual(type(ok, prof('1999-09-17')), t);
});
test('verified records give decisive outcomes', () => {
  const v = mk(evidence);
  assert.equal(type(v, prof('1999-09-17')), 'eligible');
  assert.equal(type(v, prof('1990-01-01')), 'age-not-met');
  assert.equal(type(v, prof('2009-01-01')), 'age-not-met');
  assert.equal(type(v, prof('1999-09-17', { qualification: '12th Pass' })), 'qualification-not-met');
});
test('missing mandatory conditions -> additional (verified) / verification (flagged)', () => {
  assert.equal(type(mk(Object.assign({ conditions: ['physical test'] }, evidence)), prof('1999-09-17')), 'additional');
  assert.equal(type(mk({ requiresVerification: true }), prof('1999-09-17')), 'verification');
});
test('missing or invalid cutoff / ages / placeholder -> verification, never a decision', () => {
  assert.equal(type(mk({ ageCutoffDate: '' }), prof('1999-09-17')), 'verification');
  assert.equal(type(mk({ ageCutoffDate: '2026-02-30' }), prof('1999-09-17')), 'verification');
  assert.equal(type(mk({ minAge: 'x' }), prof('1999-09-17')), 'verification');
  assert.equal(type(mk({ maxAge: 100 }), prof('1999-09-17')), 'verification');
  assert.equal(type(mk({ ageRulesUnknown: true }), prof('1999-09-17')), 'verification');
  assert.equal(type(mk({ sourceConflict: 'a vs b' }), prof('1999-09-17')), 'verification');
});

test('academic age-limit types distinguish no-upper-limit from fake 0-100 placeholder', () => {
  const base = mk({ minAge: 0, maxAge: 100, ageRulesUnknown: false, ageLimitType: 'none', requiresVerification: true });
  const result = E.evaluateExam(base, prof('1999-09-17'), TODAY);
  assert.equal(result.statusType, 'verification'); // still fail-closed until all academic criteria are modeled
  assert.ok(!result.issues.some(x => x.includes('maximum age is a placeholder')));
  const minimumOnly = E.evaluateExam(mk({ minAge: 17, maxAge: 100, ageRulesUnknown: false, ageLimitType: 'minimum-only', requiresVerification: true }), prof('2009-01-01'), TODAY);
  assert.equal(minimumOnly.statusType, 'verification');
  assert.ok(!minimumOnly.issues.some(x => x.includes('maximum age is a placeholder')));
});
test('JEE Advanced stores official 2026 criteria and remains fail-closed', () => {
  const ex = data.exams.find(e => e.id === 'jee-advanced-screening-2026');
  assert.equal(ex.ageLimitType, 'dob-window');
  assert.equal(ex.eligibilityCriteria.cycle, 2026);
  assert.match(ex.eligibilityCriteria.source, /^https:\/\//);
  assert.ok(ex.eligibilityCriteria.requirements.some(r => r.key === 'jeeMainRank'));
  assert.ok(ex.eligibilityCriteria.requirements.some(r => r.key === 'dateOfBirth'));
  assert.ok(ex.eligibilityCriteria.requirements.some(r => r.key === 'attempts'));
  assert.ok(ex.eligibilityCriteria.requirements.some(r => r.key === 'class12FirstAppearance'));
  assert.ok(ex.eligibilityCriteria.requirements.some(r => r.key === 'priorIITAdmission'));
  assert.equal(ex.eligibilityCriteria.requiresManualReview, true);
  assert.equal(E.evaluateExam(ex, prof('2005-01-01'), TODAY).statusType, 'verification');
});
test('contradictory verification metadata is not trusted', () => {
  assert.equal(E.isVerified(mk(evidence)), true);
  assert.equal(E.isVerified(mk({ verifiedForCurrentCycle: true })), false);
  assert.equal(E.isVerified(mk(Object.assign({}, evidence, { verificationStatus: 'needs-audit' }))), false);
  assert.equal(E.isVerified(mk(Object.assign({}, evidence, { requiresVerification: true }))), false);
  assert.equal(E.isVerified(mk(Object.assign({}, evidence, { verificationCheckedAt: '2026-13-40' }))), false);
  assert.equal(type(mk({ verifiedForCurrentCycle: true }), prof('1990-01-01')), 'verification');
});
test('recruitment cycle status uses today, not the cutoff', () => {
  const w = { applicationWindow: { start: '2026-05-21', end: '2026-06-22' } };
  assert.equal(E.cycleStatus(mk(w), '2026-06-22').status, 'open');
  assert.equal(E.cycleStatus(mk(w), '2026-06-23').status, 'closed');
  assert.equal(E.cycleStatus(mk(w), '2026-05-20').status, 'upcoming');
  assert.equal(E.cycleStatus(mk(), TODAY).status, 'unknown');
  assert.equal(E.cycleStatus(mk({ cycleHint: 'closed' }), TODAY).confirmed, false);
});
test('post-wise bands: same candidate, different posts', () => {
  const ex = mk(Object.assign({ ageBands: [
    { id: 'a', label: '18-27', minAge: 18, maxAge: 27, posts: [{ name: 'A' }] },
    { id: 'b', label: '18-32', minAge: 18, maxAge: 32, posts: [{ name: 'B', conditions: ['maths'] }] }] }, evidence));
  const r = E.evaluateExam(ex, prof('1996-01-01'), TODAY);   // too old for 18-27, fine for 18-32
  assert.equal(r.statusType, 'additional');
  assert.deepEqual(r.posts.failed, ['A']);
  assert.equal(E.evaluateExam(ex, prof('1999-09-17'), TODAY).statusType, 'eligible');
});
test('ITI trade and JEE year inputs', () => {
  const iti = mk({ qualification: 'ITI', itiTrades: ['Fitter'] });
  assert.equal(type(iti, prof('1999-09-17', { qualification: 'ITI' })), 'verification');
  assert.equal(type(iti, prof('1999-09-17', { qualification: 'ITI', trade: 'Welder' })), 'unlikely');
  assert.equal(type(iti, prof('1999-09-17', { qualification: 'ITI', trade: 'Fitter' })), 'potential');
});

// ---- dataset-level ----
test('dataset: unique ids and valid cutoff/age fields on every record', () => {
  const ids = data.exams.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const e of data.exams) assert.ok(E.parseISODate(e.ageCutoffDate), e.id);
});
test('dataset: SSC CGL 2026 matches the official notice dates', () => {
  const cgl = data.exams.find(e => e.id === 'ssc-cgl-2026');
  assert.equal(E.isVerified(cgl), false); // post-specific conditions are not fully modeled, so fail closed
  const w = Object.fromEntries(cgl.ageBands.map(b => [b.id, E.ageWindow(cgl.ageCutoffDate, b.minAge, b.maxAge, 0)]));
  assert.equal(w.b27.earliestDob, '1999-08-02');
  assert.equal(w.b2030.earliestDob, '1996-08-02'); assert.equal(w.b2030.latestDob, '2006-08-01');
  assert.equal(w.b1830.earliestDob, '1996-08-02'); assert.equal(w.b1830.latestDob, '2008-08-01');
  assert.equal(w.b1832.earliestDob, '1994-08-02');
});
test('REPRODUCIBLE CASE: DOB 17-09-1999, General, Graduation, All exams', () => {
  const p = prof(E.parseDob('17-09-1999', TODAY).iso);
  const results = E.evaluateAll(data.exams, p, TODAY);
  const s = E.summarize(results);
  assert.equal(s.total, data.exams.length);
  assert.equal(Object.values(s.byType).reduce((a, b) => a + b, 0), s.total);
  assert.equal(s.groups.reduce((a, g) => a + g.count, 0), s.total);          // exclusive groups sum to total
  for (const g of s.groups) assert.equal(E.filterResults(results, g.key).length, g.count);
  const cgl = results.find(r => r.exam.id === 'ssc-cgl-2026');
  assert.equal(cgl.statusType, 'verification'); // do not claim verified eligibility until CGL post rules are modeled
  assert.equal(cgl.cycle.status, 'closed');
  assert.equal(cgl.age.formatted, '26 years 10 months 15 days');
  assert.equal(cgl.posts.clear.length, 0); // fail-closed verification returns before post classification
  assert.ok(s.byType.verification >= 1); // the dataset currently has no fully audited current-cycle records
  assert.equal(s.openNow, 0);
});
test('summary: filters are consistent with counts for every status', () => {
  const results = E.evaluateAll(data.exams, prof('1999-09-17', { qualification: '10th Pass', category: 'OBC' }), TODAY);
  const s = E.summarize(results);
  assert.equal(s.groups.reduce((a, g) => a + g.count, 0), results.length);
});