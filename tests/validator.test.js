'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validate } = require('../scripts/validate-exams.js');
const base = { id: 'a', exam: 'A', organization: 'O', examCategory: 'ssc', qualification: 'Graduation', minAge: 18, maxAge: 30, ageCutoffDate: '2026-08-01', officialNotificationUrl: 'https://x.gov.in/n.pdf', applyUrl: 'https://x.gov.in/', relaxation: { OBC: 3 } };
const ev = { verifiedForCurrentCycle: true, verificationStatus: 'verified', verificationCheckedAt: '2026-10-15', verificationSourceTitle: 't', verificationNotes: 'n' };
const errs = exams => validate({ exams }).errors;

test('real dataset passes', () => {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'exams.json'), 'utf8'));
  assert.deepEqual(validate(d).errors, []);
});
test('rejects empty / missing exams array', () => { assert.ok(validate({}).errors.length); assert.ok(validate({ exams: [] }).errors.length); });
test('rejects duplicate ids', () => assert.ok(errs([base, { ...base }]).some(e => /duplicate/.test(e))));
test('rejects missing fields and bad dates/ages', () => {
  assert.ok(errs([{ ...base, exam: '' }]).length);
  assert.ok(errs([{ ...base, ageCutoffDate: '2026-02-30' }]).length);
  assert.ok(errs([{ ...base, minAge: 40 }]).length);
  assert.ok(errs([{ ...base, applyUrl: 'http://x' }]).length);
});
test('rejects verified flag without evidence, or contradictory metadata', () => {
  assert.ok(errs([{ ...base, verifiedForCurrentCycle: true }]).length);
  assert.ok(errs([{ ...base, ...ev, requiresVerification: true }]).length);
  assert.ok(errs([{ ...base, ...ev, sourceConflict: 'x' }]).length);
  assert.ok(errs([{ ...base, ...ev, ageRulesUnknown: true }]).length);
  assert.ok(errs([{ ...base, verificationStatus: 'verified' }]).length);
  assert.deepEqual(errs([{ ...base, ...ev }]), []);
});
test('supports open-ended age rules without numeric placeholder bounds', () => {
  assert.deepEqual(errs([{ ...base, minAge: null, maxAge: null, ageLimitType: 'none' }]), []);
  assert.deepEqual(errs([{ ...base, minAge: 17, maxAge: null, ageLimitType: 'minimum-only' }]), []);
  assert.deepEqual(errs([{ ...base, minAge: null, maxAge: null, ageLimitType: 'dob-window', ageRulesUnknown: true }]), []);
  assert.ok(errs([{ ...base, minAge: 0, maxAge: 100, ageLimitType: 'none' }]).some(e => /null minAge\/maxAge/.test(e)));
});
test('rejects bad applicationWindow and ageBands', () => {
  assert.ok(errs([{ ...base, applicationWindow: { start: '2026-07-01', end: '2026-06-01' } }]).length);
  assert.ok(errs([{ ...base, ageBands: [{ id: 'b', label: 'x', minAge: 18, maxAge: 5, posts: [] }] }]).length);
});
test('invalid JSON is caught by the CLI', () => {
  const { spawnSync } = require('node:child_process');
  const tmp = path.join(__dirname, '..', 'data', 'exams.json');
  const orig = fs.readFileSync(tmp);
  try { fs.writeFileSync(tmp, '{ not json'); const r = spawnSync('node', [path.join(__dirname, '..', 'scripts', 'validate-exams.js')]); assert.equal(r.status, 1); }
  finally { fs.writeFileSync(tmp, orig); }
});