/**
 * ROJGARDWAAR.IN - Eligibility engine (pure logic, no DOM).
 * Loaded by the browser as window.EligibilityEngine and by Node tests via require().
 *
 * Age rule used (matches SSC / RRB / UPSC / IBPS notices): a candidate must have
 * ATTAINED the minimum age and must NOT have attained the maximum age on the cutoff
 * date, i.e. "18-27 as on 01-08-2026" means born from 02-08-1999 to 01-08-2008.
 * Everything is compared as calendar dates (YYYY-MM-DD strings), never as decimal ages,
 * so there is no rounding error at a boundary and no timezone dependence.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EligibilityEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const ACADEMIC = { '10th Pass': 1, '12th Pass': 2, 'Graduation': 3, 'B.E. / B.Tech': 3, 'Post-Graduation': 4 };

  // Mutually exclusive outcomes. Every result has exactly one.
  const OUTCOMES = {
    eligible: { label: 'Eligible — Verified', badge: 'badge-success' },
    relaxation: { label: 'Eligible with Relaxation — Verified', badge: 'badge-info' },
    additional: { label: 'Additional Conditions Required', badge: 'badge-warning' },
    potential: { label: 'Potential Match — Not Verified', badge: 'badge-warning' },
    verification: { label: 'Official Verification Required', badge: 'badge-neutral' },
    unlikely: { label: 'Does Not Appear to Match — Not Verified', badge: 'badge-neutral' },
    'age-not-met': { label: 'Age Limit Not Met — Verified', badge: 'badge-danger' },
    'qualification-not-met': { label: 'Qualification Not Met — Verified', badge: 'badge-danger' }
  };
  const SORT_ORDER = ['eligible', 'relaxation', 'additional', 'potential', 'verification', 'unlikely', 'age-not-met', 'qualification-not-met'];

  // ---------- calendar helpers (ISO strings) ----------
  const pad = n => String(n).padStart(2, '0');
  const isLeap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysInMonth = (y, m) => [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  const toISO = (y, m, d) => `${String(y).padStart(4, '0')}-${pad(m)}-${pad(d)}`;

  function parseISODate(text) {
    if (typeof text !== 'string') return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    if (y < 1 || mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null;
    return { y, m: mo, d };
  }

  function addMonthsISO(iso, n) {
    const p = parseISODate(iso);
    if (!p) return null;
    const total = p.y * 12 + (p.m - 1) + n;
    const y = Math.floor(total / 12), m = ((total % 12) + 12) % 12 + 1;
    return toISO(y, m, Math.min(p.d, daysInMonth(y, m)));   // 29 Feb / 30 / 31 clamp to month end
  }

  function addDaysISO(iso, n) {
    const p = parseISODate(iso);
    if (!p) return null;
    const t = new Date(Date.UTC(p.y, p.m - 1, p.d) + n * 86400000);
    return toISO(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  }

  function diffDays(aISO, bISO) {
    const a = parseISODate(aISO), b = parseISODate(bISO);
    return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
  }

  function todayISO(now) {
    const d = now instanceof Date ? now : new Date();
    return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate());   // local calendar day (IST for Indian users)
  }

  function formatDate(iso) {
    const p = parseISODate(iso);
    return p ? `${p.d} ${MONTHS[p.m - 1]} ${p.y}` : String(iso || '');
  }

  /** Accepts DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY or YYYY-MM-DD. Rejects impossible and future dates. */
  function parseDob(text, today) {
    const t = String(text || '').trim();
    let y, m, d, mt;
    if ((mt = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(t))) { d = +mt[1]; m = +mt[2]; y = +mt[3]; }
    else if ((mt = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t))) { y = +mt[1]; m = +mt[2]; d = +mt[3]; }
    else return { ok: false, error: 'Please enter a valid date of birth (DD-MM-YYYY).' };
    const iso = toISO(y, m, d);
    if (!parseISODate(iso)) return { ok: false, error: 'Please enter a valid date of birth.' };
    if (iso > (today || todayISO())) return { ok: false, error: 'Date of birth cannot be in the future.' };
    if (y < 1900) return { ok: false, error: 'Please enter a valid date of birth.' };
    return { ok: true, iso };
  }

  /** Completed years / months / days from DOB to the cutoff (display only; never used for decisions). */
  function ageBreakdown(dobISO, cutoffISO) {
    if (!parseISODate(dobISO) || !parseISODate(cutoffISO)) return null;
    if (dobISO > cutoffISO) return { years: 0, months: 0, days: 0, beforeBirth: true, formatted: 'not yet born on the cutoff date', short: '—' };
    const d = parseISODate(dobISO), c = parseISODate(cutoffISO);
    let months = (c.y - d.y) * 12 + (c.m - d.m);
    let anniv = addMonthsISO(dobISO, months);
    if (anniv > cutoffISO) { months--; anniv = addMonthsISO(dobISO, months); }
    const days = diffDays(anniv, cutoffISO);
    const years = Math.floor(months / 12), mo = months % 12;
    return {
      years, months: mo, days, beforeBirth: false,
      formatted: `${years} years ${mo} months ${days} days`,
      short: `${years}y ${mo}m ${days}d`
    };
  }

  /** Born-between window for [minAge, maxAge + relaxation] on the cutoff. Ages may be fractional (e.g. 15.5). */
  function ageWindow(cutoffISO, minAge, maxAge, relaxation) {
    const maxM = Math.round((Number(maxAge) + Number(relaxation || 0)) * 12);
    const minM = Math.round(Number(minAge) * 12);
    const earliest = addDaysISO(addMonthsISO(cutoffISO, -maxM), 1);
    const latest = addMonthsISO(cutoffISO, -minM);
    return { earliestDob: earliest, latestDob: latest };
  }

  function checkAge(dobISO, cutoffISO, minAge, maxAge, relaxation) {
    const w = ageWindow(cutoffISO, minAge, maxAge, relaxation);
    if (!w.earliestDob || !w.latestDob) return { status: 'invalid' };
    let status = 'met';
    if (dobISO > w.latestDob) status = 'under';
    else if (dobISO < w.earliestDob) status = 'over';
    return { status, earliestDob: w.earliestDob, latestDob: w.latestDob, effectiveMax: Number(maxAge) + Number(relaxation || 0), relaxation: Number(relaxation || 0) };
  }

  // ---------- qualification ----------
  function checkQualification(user, exam) {
    const required = exam && exam.qualification;
    if (!user) return { met: false, reason: 'No qualification selected.' };
    if (!required) return { met: false, reason: 'This record has no qualification rule.', dataProblem: true };
    const accepted = Array.isArray(exam.acceptedQualifications) && exam.acceptedQualifications.length ? exam.acceptedQualifications : [required];
    if (accepted.includes(user)) return { met: true, reason: `${user} is accepted.` };
    const u = ACADEMIC[user], r = ACADEMIC[required];
    if (u && r) {
      if (required === 'B.E. / B.Tech') return { met: false, reason: 'Requires an engineering degree (B.E./B.Tech); a general degree is not enough.' };
      if (u >= r) return { met: true, reason: `${user} meets the minimum of ${required}.` };
      return { met: false, reason: `Requires ${required} or higher; you selected ${user}.` };
    }
    return { met: false, reason: `Requires ${required}; ${user} is not listed as accepted for this record.` };
  }

  // ---------- verification metadata ----------
  function evidenceProblems(exam) {
    const out = [];
    for (const f of ['verificationStatus', 'verificationCheckedAt', 'verificationSourceTitle', 'verificationNotes']) {
      if (typeof exam[f] !== 'string' || !exam[f].trim()) out.push(`missing ${f}`);
    }
    if (exam.verificationStatus !== 'verified') out.push('verificationStatus is not "verified"');
    if (!parseISODate(exam.verificationCheckedAt)) out.push('verificationCheckedAt is not a real date');
    if (exam.requiresVerification === true) out.push('requiresVerification is true');
    if (exam.ageRulesUnknown === true) out.push('ageRulesUnknown is true');
    if (exam.sourceConflict) out.push('sourceConflict is set');
    return out;
  }
  /** A record counts as verified only if the flag AND the full evidence trail agree. */
  function isVerified(exam) {
    return !!exam && exam.verifiedForCurrentCycle === true && evidenceProblems(exam).length === 0;
  }

  // ---------- recruitment cycle ----------
  function cycleStatus(exam, today) {
    const t = today || todayISO();
    const w = exam && exam.applicationWindow;
    if (w && parseISODate(w.end) && (!w.start || parseISODate(w.start))) {
      let status = 'open';
      if (w.start && t < w.start) status = 'upcoming';
      else if (t > w.end) status = 'closed';
      const text = { open: `Applications open until ${formatDate(w.end)}`, upcoming: `Applications open on ${formatDate(w.start)}`, closed: `Applications closed on ${formatDate(w.end)}` }[status];
      return { status, confirmed: true, label: text, start: w.start || null, end: w.end };
    }
    if (exam && ['open', 'closed', 'upcoming'].includes(exam.cycleHint)) {
      const text = { open: 'Cycle appears open', upcoming: 'Cycle appears upcoming', closed: 'Cycle appears closed' }[exam.cycleHint] + ' (not confirmed from the official notice)';
      return { status: exam.cycleHint, confirmed: false, label: text };
    }
    return { status: 'unknown', confirmed: false, label: 'Application dates not verified' };
  }

  // ---------- core evaluation ----------
  function relaxationFor(exam, band, category) {
    const pick = o => (o && Number.isFinite(o[category]) ? o[category] : null);
    const v = pick(band && band.relaxation);
    return v !== null ? v : (pick(exam.relaxation) || 0);
  }

  function bandsOf(exam) {
    if (Array.isArray(exam.ageBands) && exam.ageBands.length) return exam.ageBands;
    return [{ id: 'all', label: 'All posts', minAge: exam.minAge, maxAge: exam.maxAge, posts: [] }];
  }

  function dataIssues(exam) {
    const issues = [];
    const bands = bandsOf(exam);
    if (!parseISODate(exam.ageCutoffDate)) issues.push('The age cutoff date is missing or invalid in our data.');
    for (const b of bands) {
      if (!Number.isFinite(Number(b.minAge)) || !Number.isFinite(Number(b.maxAge)) || Number(b.minAge) > Number(b.maxAge)) {
        issues.push('The age limits stored for this recruitment are missing or invalid.'); break;
      }
    }
    if (exam.ageRulesUnknown === true) issues.push('Age limits and cutoff date depend on the specific notification and are not stored.');
    if (bands.some(b => Number(b.maxAge) >= 65)) issues.push('The stored maximum age is a placeholder, not an official rule.');
    if (exam.sourceConflict) issues.push(`Sources disagree: ${exam.sourceConflict}`);
    if (!exam.qualification) issues.push('The qualification rule is missing in our data.');
    return issues;
  }

  function make(base, type, explanation, extra) {
    return Object.assign(base, { statusType: type, status: OUTCOMES[type].label, explanation }, extra || {});
  }

  function evaluateExam(exam, profile, today) {
    const t = today || todayISO();
    const verified = isVerified(exam);
    const contradictory = exam.verifiedForCurrentCycle === true && !verified;
    const cycle = cycleStatus(exam, t);
    const age = ageBreakdown(profile.dob, exam.ageCutoffDate);
    const qual = checkQualification(profile.qualification, exam);
    const base = {
      exam, cycle, verified, age, qualification: qual, category: profile.category,
      cutoff: exam.ageCutoffDate, bands: [], posts: { clear: [], conditional: [], failed: [] },
      relaxation: 0, effectiveMaxAge: null, conditions: [],
      verificationState: verified ? 'verified' : (contradictory ? 'contradictory' : 'unverified')
    };

    // 1. Data we cannot trust -> never decide.
    const issues = dataIssues(exam);
    if (contradictory) issues.push(`Verification metadata is incomplete or contradictory (${evidenceProblems(exam).join('; ')}).`);
    if (!verified && exam.requiresVerification === true) issues.push(exam.verificationReason || 'Mandatory conditions are not captured by this form.');
    if (issues.length) {
      return make(base, 'verification', `No eligibility decision is made. ${issues.join(' ')} Check the official notification.`, { issues });
    }

    // 2. Age per band (post group) with the category relaxation that applies.
    const bands = bandsOf(exam).map(b => {
      const relax = relaxationFor(exam, b, profile.category);
      const withRelax = checkAge(profile.dob, exam.ageCutoffDate, b.minAge, b.maxAge, relax);
      const without = checkAge(profile.dob, exam.ageCutoffDate, b.minAge, b.maxAge, 0);
      return { id: b.id, label: b.label, minAge: b.minAge, maxAge: b.maxAge, relaxation: relax, effectiveMax: withRelax.effectiveMax,
        status: withRelax.status, metWithoutRelaxation: without.status === 'met', earliestDob: withRelax.earliestDob, latestDob: withRelax.latestDob, posts: b.posts || [] };
    });
    base.bands = bands;
    base.relaxation = bands.length ? bands[0].relaxation : 0;
    base.effectiveMaxAge = bands.length === 1 ? bands[0].effectiveMax : null;
    const anyAgeMet = bands.some(b => b.status === 'met');
    const examConditions = Array.isArray(exam.conditions) ? exam.conditions : [];
    base.conditions = examConditions;

    // 3. Post-level classification (only meaningful when posts are modelled).
    let clearPostsNeedRelaxation = false;
    const hasPosts = bands.some(b => b.posts.length);
    if (hasPosts) {
      let clearWithoutRelax = 0;
      for (const b of bands) for (const p of b.posts) {
        if (b.status !== 'met') { base.posts.failed.push(p.name); continue; }
        if (p.conditions && p.conditions.length) base.posts.conditional.push({ name: p.name, conditions: p.conditions });
        else { base.posts.clear.push(p.name); if (b.metWithoutRelaxation) clearWithoutRelax++; }
      }
      clearPostsNeedRelaxation = base.posts.clear.length > 0 && clearWithoutRelax === 0;
    }

    const ageText = age ? age.formatted : 'unknown';
    const windows = bands.map(b => `${b.label}: born ${formatDate(b.earliestDob)} to ${formatDate(b.latestDob)}`).join('; ');
    const relaxText = bands[0].relaxation > 0 ? ` (includes ${bands[0].relaxation} years ${profile.category} relaxation)` : '';

    // 4. Input-specific checks (ITI trade, class-12 year window).
    const extra = inputChecks(exam, profile, qual);

    // ---- verified record: decisive outcomes ----
    if (verified) {
      if (!qual.met) return make(base, 'qualification-not-met', `Verified rule: ${qual.reason}`);
      if (extra && extra.blocks) return make(base, extra.verifiedType || 'additional', extra.text);
      if (!anyAgeMet) {
        const under = bands.every(b => b.status === 'under');
        return make(base, 'age-not-met', under
          ? `On the cutoff date (${formatDate(exam.ageCutoffDate)}) you were ${ageText} old, below the minimum age. Eligible birth dates: ${windows}.`
          : `On the cutoff date (${formatDate(exam.ageCutoffDate)}) you were ${ageText} old. Eligible birth dates${relaxText}: ${windows}. Other relaxations (ex-servicemen, government employees, etc.) are not calculated here.`);
      }
      const confirmed = hasPosts ? base.posts.clear.length > 0 : examConditions.length === 0;
      if (confirmed) {
        const type = hasPosts ? (clearPostsNeedRelaxation ? 'relaxation' : 'eligible') : (bands[0].metWithoutRelaxation ? 'eligible' : 'relaxation');
        const tail = hasPosts ? ` ${base.posts.clear.length} post(s) need only this age and qualification; ${base.posts.conditional.length} more have extra conditions listed below.` : '';
        const closed = cycle.status === 'closed' ? 'This cycle is closed, so this shows only whether you met the 2026 rules (useful for planning the next cycle). ' : '';
        return make(base, type, `${closed}On the cutoff date (${formatDate(exam.ageCutoffDate)}) you were ${ageText} old. Age window${relaxText}: ${windows}. Qualification: ${qual.reason}${tail}`);
      }
      const conds = hasPosts ? base.posts.conditional.map(p => `${p.name} (${p.conditions.join(', ')})`).join('; ') : examConditions.join('; ');
      return make(base, 'additional', `Your age fits (${ageText} on ${formatDate(exam.ageCutoffDate)}), but the posts you could apply for need conditions this form cannot check: ${conds}.`);
    }

    // ---- unverified record: never definitive ----
    const verifyNote = ' This recruitment has not been checked against the current official notification, so treat it as a screening hint only.';
    if (extra && extra.blocks) return make(base, extra.type, extra.text);
    if (qual.met && anyAgeMet) {
      const cond = examConditions.length ? ` Known extra conditions: ${examConditions.join('; ')}.` : '';
      return make(base, 'potential', `Stored rules suggest you may fit: age ${ageText} on ${formatDate(exam.ageCutoffDate)} (stored window${relaxText}: ${windows}).${cond}${verifyNote}`);
    }
    const why = !qual.met ? qual.reason : (bands.every(b => b.status === 'under') ? 'Stored minimum age is above your age on the cutoff date.' : `Stored age window is ${windows}.`);
    return make(base, 'unlikely', `${why}${verifyNote}`);
  }

  function inputChecks(exam, profile, qual) {
    if (Array.isArray(exam.itiTrades) && profile.qualification === 'ITI' && qual.met) {
      if (!profile.trade) return { blocks: true, type: 'verification', verifiedType: 'additional', text: 'Select your ITI trade; this recruitment accepts only listed trades. Verify the list in the official notice.' };
      if (!exam.itiTrades.includes(profile.trade)) return { blocks: true, type: 'unlikely', verifiedType: 'qualification-not-met', text: `The stored trade list for this recruitment does not include ${profile.trade}. Verify the official notice.` };
    }
    if (exam.class12YearRule && profile.examCategory === exam.class12YearRule.examCategory && qual.met) {
      if (!profile.class12Year) return { blocks: true, type: 'verification', verifiedType: 'additional', text: exam.class12YearRule.missingText };
      if (!exam.class12YearRule.allowed.includes(profile.class12Year)) return { blocks: true, type: 'unlikely', verifiedType: 'qualification-not-met', text: exam.class12YearRule.failText };
      return { blocks: true, type: 'verification', verifiedType: 'additional', text: exam.class12YearRule.passText };
    }
    return null;
  }

  // ---------- summary / filters (counts always equal list lengths) ----------
  const GROUPS = [
    { key: 'confirmed', label: 'Eligible — Verified', types: ['eligible', 'relaxation'], tone: 'eligible' },
    { key: 'additional', label: 'Additional Conditions Required', types: ['additional'], tone: 'verify' },
    { key: 'potential', label: 'Potential Match — Not Verified', types: ['potential'], tone: 'verify' },
    { key: 'verification', label: 'Official Verification Required', types: ['verification'], tone: 'verify' },
    { key: 'unlikely', label: 'Does Not Appear to Match — Not Verified', types: ['unlikely'], tone: 'verify' },
    { key: 'not-eligible', label: 'Not Eligible — Verified', types: ['age-not-met', 'qualification-not-met'], tone: 'over-age' }
  ];

  function filterResults(results, key) {
    if (!key || key === 'all') return results.slice();
    if (key === 'open-now') return results.filter(r => r.cycle.status === 'open');
    const g = GROUPS.find(x => x.key === key);
    return g ? results.filter(r => g.types.includes(r.statusType)) : [];
  }

  function summarize(results) {
    const byType = {};
    for (const k of Object.keys(OUTCOMES)) byType[k] = 0;
    for (const r of results) byType[r.statusType]++;
    const groups = GROUPS.map(g => Object.assign({ count: filterResults(results, g.key).length }, g));
    return { total: results.length, byType, groups, openNow: filterResults(results, 'open-now').length };
  }

  function sortResults(results) {
    const rank = r => SORT_ORDER.indexOf(r.statusType);
    const cyc = r => ({ open: 0, upcoming: 1, unknown: 2, closed: 3 }[r.cycle.status] ?? 2);
    return results.slice().sort((a, b) => rank(a) - rank(b) || cyc(a) - cyc(b) || a.exam.exam.localeCompare(b.exam.exam));
  }

  function evaluateAll(exams, profile, today) {
    return sortResults(exams.map(e => evaluateExam(e, profile, today)));
  }

  return {
    OUTCOMES, GROUPS, SORT_ORDER,
    parseISODate, parseDob, addMonthsISO, addDaysISO, diffDays, todayISO, formatDate,
    ageBreakdown, ageWindow, checkAge, checkQualification,
    evidenceProblems, isVerified, cycleStatus,
    evaluateExam, evaluateAll, summarize, filterResults, sortResults
  };
});