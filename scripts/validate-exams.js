#!/usr/bin/env node
'use strict';
// Guardrail for the eligibility dataset: checks data integrity and that a record marked
// "verified" carries a full evidence trail. It CANNOT prove a notification is legally
// correct; a human must read the official notice before setting verifiedForCurrentCycle=true.

const fs = require('node:fs');
const path = require('node:path');
const E = require('../js/eligibility-engine.js');

const CATS = new Set(['General', 'OBC', 'SC', 'ST', 'EWS', 'PwD']);

function validate(data) {
  const errors = [], warnings = [];
  if (!data || !Array.isArray(data.exams) || data.exams.length === 0) return { errors: ['expected a non-empty "exams" array.'], warnings };
  const seen = new Set();
  data.exams.forEach((exam, i) => {
    const label = exam && (exam.id || exam.exam) ? (exam.id || exam.exam) : `record #${i + 1}`;
    if (!exam || typeof exam !== 'object' || Array.isArray(exam)) { errors.push(`${label}: record must be an object.`); return; }
    if (!exam.id || typeof exam.id !== 'string') errors.push(`${label}: missing string id.`);
    else if (seen.has(exam.id)) errors.push(`${label}: duplicate id.`); else seen.add(exam.id);
    for (const f of ['exam', 'organization', 'qualification', 'examCategory']) if (typeof exam[f] !== 'string' || !exam[f].trim()) errors.push(`${label}: missing ${f}.`);
    const agePairs = [[exam.minAge, exam.maxAge, 'record']].concat((exam.ageBands || []).map(b => [b.minAge, b.maxAge, `band ${b.id}`]));
    for (const [mn, mx, where] of agePairs) {
      if (!Number.isFinite(mn) || !Number.isFinite(mx)) errors.push(`${label}: minAge/maxAge must be numbers (${where}).`);
      else if (mn < 0 || mx < mn || mx > 100) errors.push(`${label}: invalid age range ${mn}-${mx} (${where}).`);
    }
    if (!E.parseISODate(exam.ageCutoffDate)) errors.push(`${label}: ageCutoffDate must be a real YYYY-MM-DD date.`);
    for (const f of ['officialNotificationUrl', 'applyUrl']) if (typeof exam[f] !== 'string' || !/^https:\/\//i.test(exam[f])) errors.push(`${label}: ${f} must be an HTTPS URL.`);
    if (exam.relaxation !== undefined) {
      if (!exam.relaxation || typeof exam.relaxation !== 'object' || Array.isArray(exam.relaxation)) errors.push(`${label}: relaxation must be an object.`);
      else for (const [c, y] of Object.entries(exam.relaxation)) {
        if (!CATS.has(c)) warnings.push(`${label}: unfamiliar relaxation category "${c}".`);
        if (!Number.isFinite(y) || y < 0 || y > 30) errors.push(`${label}: invalid relaxation for ${c}.`);
      }
    }
    if (exam.applicationWindow !== undefined) {
      const w = exam.applicationWindow;
      if (!w || !E.parseISODate(w.end) || (w.start && !E.parseISODate(w.start)) || (w.start && w.start > w.end)) errors.push(`${label}: applicationWindow needs real dates with start <= end.`);
    }
    if (exam.cycleHint !== undefined && !['open', 'closed', 'upcoming'].includes(exam.cycleHint)) errors.push(`${label}: cycleHint must be open, closed or upcoming.`);
    for (const b of exam.ageBands || []) {
      if (!b.id || !b.label || !Array.isArray(b.posts)) errors.push(`${label}: each ageBand needs id, label and posts[].`);
      if (b.posts && b.posts.some(p => !p.name)) errors.push(`${label}: every post needs a name.`);
    }
    if (exam.verifiedForCurrentCycle === true) {
      const problems = E.evidenceProblems(exam);
      for (const p of problems) errors.push(`${label}: cannot be marked verified — ${p}.`);
      if (!E.parseISODate(exam.ageCutoffDate)) errors.push(`${label}: verified record needs a valid cutoff date.`);
      if (!exam.applicationWindow) warnings.push(`${label}: verified record has no applicationWindow, so cycle status will show "not verified".`);
    } else if (exam.verificationStatus === 'verified') {
      errors.push(`${label}: verificationStatus says verified but verifiedForCurrentCycle is not true.`);
    }
    if (exam.ageRulesUnknown === true && exam.verifiedForCurrentCycle === true) errors.push(`${label}: ageRulesUnknown contradicts verified.`);
  });
  return { errors, warnings };
}

module.exports = { validate };

if (require.main === module) {
  let data;
  try { data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'exams.json'), 'utf8')); }
  catch (e) { console.error('FAIL: data/exams.json is not valid JSON:', e.message); process.exit(1); }
  const { errors, warnings } = validate(data);
  warnings.forEach(w => console.warn('WARN:', w));
  if (errors.length) { console.error(`\nFAIL: ${errors.length} data validation error(s):`); errors.forEach(e => console.error('-', e)); process.exit(1); }
  const verified = data.exams.filter(E.isVerified).length;
  console.log(`PASS: ${data.exams.length} exam records; unique IDs and schema valid.`);
  console.log(`Fully verified with evidence: ${verified}`);
  console.log(`Unverified: ${data.exams.length - verified}`);
  console.log('NOTE: schema validation does not replace official-notification review.');
}
