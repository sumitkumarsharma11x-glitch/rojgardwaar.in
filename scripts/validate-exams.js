#!/usr/bin/env node
'use strict';

// Guardrail for the eligibility dataset. This checks data integrity and the
// evidence required before a record can ever be labelled "verified".
// It cannot prove the legal correctness of a notification; human source review
// is still required before setting verifiedForCurrentCycle=true.

const fs = require('node:fs');
const path = require('node:path');

const filePath = path.join(__dirname, '..', 'data', 'exams.json');
let data;
try {
  data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
} catch (error) {
  console.error('FAIL: data/exams.json is not valid JSON:', error.message);
  process.exit(1);
}

const errors = [];
const warnings = [];
if (!data || !Array.isArray(data.exams) || data.exams.length === 0) {
  console.error('FAIL: expected a non-empty "exams" array.');
  process.exit(1);
}

const seen = new Set();
const allowedCategories = new Set(['General', 'OBC', 'SC', 'ST', 'EWS', 'PwD']);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const validDate = value => {
  if (typeof value !== 'string' || !datePattern.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

for (const [index, exam] of data.exams.entries()) {
  const label = exam && (exam.id || exam.exam) ? (exam.id || exam.exam) : `record #${index + 1}`;
  if (!exam || typeof exam !== 'object' || Array.isArray(exam)) {
    errors.push(`${label}: record must be an object.`);
    continue;
  }

  if (!exam.id || typeof exam.id !== 'string') errors.push(`${label}: missing string id.`);
  else if (seen.has(exam.id)) errors.push(`${label}: duplicate id.`);
  else seen.add(exam.id);

  for (const field of ['exam', 'organization', 'qualification', 'examCategory']) {
    if (typeof exam[field] !== 'string' || !exam[field].trim()) {
      errors.push(`${label}: missing ${field}.`);
    }
  }

  if (!Number.isFinite(exam.minAge) || !Number.isFinite(exam.maxAge)) {
    errors.push(`${label}: minAge/maxAge must be numbers.`);
  } else if (exam.minAge < 0 || exam.maxAge < exam.minAge || exam.maxAge > 100) {
    errors.push(`${label}: invalid age range ${exam.minAge}-${exam.maxAge}.`);
  }

  if (!validDate(exam.ageCutoffDate)) {
    errors.push(`${label}: ageCutoffDate must be a real YYYY-MM-DD date.`);
  }

  for (const field of ['officialNotificationUrl', 'applyUrl']) {
    if (typeof exam[field] !== 'string' || !/^https:\/\//i.test(exam[field])) {
      errors.push(`${label}: ${field} must be an HTTPS URL.`);
    }
  }

  if (exam.relaxation !== undefined) {
    if (!exam.relaxation || typeof exam.relaxation !== 'object' || Array.isArray(exam.relaxation)) {
      errors.push(`${label}: relaxation must be an object.`);
    } else {
      for (const [category, years] of Object.entries(exam.relaxation)) {
        if (!allowedCategories.has(category)) warnings.push(`${label}: unfamiliar relaxation category "${category}".`);
        if (!Number.isFinite(years) || years < 0 || years > 30) {
          errors.push(`${label}: invalid relaxation for ${category}.`);
        }
      }
    }
  }

  if (exam.verifiedForCurrentCycle === true) {
    const requiredEvidence = [
      'verificationStatus',
      'verificationCheckedAt',
      'verificationSourceTitle',
      'verificationNotes'
    ];
    for (const field of requiredEvidence) {
      if (typeof exam[field] !== 'string' || !exam[field].trim()) {
        errors.push(`${label}: cannot be marked verified without ${field}.`);
      }
    }
    if (exam.verificationStatus !== 'verified') {
      errors.push(`${label}: verifiedForCurrentCycle=true requires verificationStatus="verified".`);
    }
    if (!validDate(exam.verificationCheckedAt)) {
      errors.push(`${label}: verificationCheckedAt must be a real YYYY-MM-DD date.`);
    }
    if (exam.requiresVerification === true || exam.ageRulesUnknown === true) {
      errors.push(`${label}: cannot be fully verified while requiresVerification/ageRulesUnknown is true.`);
    }
  } else if (exam.verificationStatus === 'verified') {
    errors.push(`${label}: verificationStatus says verified but verifiedForCurrentCycle is not true.`);
  }
}

if (warnings.length) {
  console.warn('\nWarnings:');
  for (const warning of warnings) console.warn('WARN:', warning);
}

if (errors.length) {
  console.error(`\nFAIL: ${errors.length} data validation error(s) across ${data.exams.length} exam records:`);
  for (const error of errors) console.error('-', error);
  process.exit(1);
}

const verified = data.exams.filter(exam => exam.verifiedForCurrentCycle === true).length;
const provisional = data.exams.length - verified;
console.log(`PASS: ${data.exams.length} exam records; unique IDs and data schema valid.`);
console.log(`Verified records with required evidence: ${verified}`);
console.log(`Unverified/provisional records: ${provisional}`);
console.log('NOTE: schema validation does not replace official-notification review.');
