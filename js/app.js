/**
 * ROJGARDWAAR.IN - Universal Exam Eligibility Matrix
 * Production-ready JavaScript Engine
 */

(function() {
  'use strict';

  // ============================================
  // Configuration
  // ============================================
  const CONFIG = {
    dataPath: './data/exams.json',
    qualificationLevels: {
      '10th Pass': 1,
      '12th Pass': 2,
      'Graduation': 3,
      'Post-Graduation': 4,
      'ITI': 1,
      'Diploma': 2,
      'B.E. / B.Tech': 3,
      'Professional Qualification': 2
    }
  };

  // ============================================
  // State
  // ============================================
  let examData = null;
  let currentResults = [];
  let activeFilter = 'all';

  // ============================================
  // DOM Elements
  // ============================================
  const elements = {
    form: document.getElementById('eligibilityForm'),
    dobInput: document.getElementById('dob'),
    categorySelect: document.getElementById('category'),
    qualificationSelect: document.getElementById('qualification'),
    scanButton: document.getElementById('scanButton'),
    resultsSection: document.getElementById('resultsSection'),
    summaryGrid: document.getElementById('summaryGrid'),
    filterTabs: document.getElementById('filterTabs'),
    examCards: document.getElementById('examCards'),
    examTableBody: document.getElementById('examTableBody'),
    noResults: document.getElementById('noResults'),
    mobileMenu: document.getElementById('mobileMenu'),
    menuToggle: document.getElementById('menuToggle'),
    dobError: document.getElementById('dobError'),
    categoryError: document.getElementById('categoryError'),
    qualificationError: document.getElementById('qualificationError'),
    examCategorySelect: document.getElementById('examCategory'),
    tradeGroup: document.getElementById('tradeGroup'),
    tradeSelect: document.getElementById('itiTrade'),
    class12YearGroup: document.getElementById('class12YearGroup'),
    class12YearSelect: document.getElementById('class12Year')
  };

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Calculate precise age in years and months from DOB to cutoff date
   * @param {string} dobString - Date of birth (YYYY-MM-DD)
   * @param {string} cutoffString - Cutoff date (YYYY-MM-DD)
   * @returns {Object} Age details
   */
  function parseISODateLocal(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function calculateAge(dobString, cutoffString) {
    // Parse date-only values as local calendar dates. new Date('YYYY-MM-DD')
    // parses as UTC and can shift the day in time zones such as India.
    const dob = parseISODateLocal(dobString);
    const cutoff = parseISODateLocal(cutoffString);
    if (!dob || !cutoff || dob > cutoff) return null;

    let years = cutoff.getFullYear() - dob.getFullYear();
    let months = cutoff.getMonth() - dob.getMonth();
    let days = cutoff.getDate() - dob.getDate();

    if (days < 0) {
      months--;
      days += new Date(cutoff.getFullYear(), cutoff.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const totalMonths = years * 12 + months;
    const totalDays = Math.floor((Date.UTC(cutoff.getFullYear(), cutoff.getMonth(), cutoff.getDate()) -
      Date.UTC(dob.getFullYear(), dob.getMonth(), dob.getDate())) / 86400000);
    const decimalAge = years + (months / 12) + (days / 365.2425);

    return {
      years,
      months,
      days,
      totalMonths,
      totalDays,
      decimalAge: Math.round(decimalAge * 10000) / 10000,
      formatted: years === 0 && months === 0
        ? `${days} days`
        : years === 0
          ? `${months} months ${days} days`
          : `${years} years ${months} months ${days} days`,
      shortFormatted: `${years}y ${months}m`
    };
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  function formatDate(dateString) {
    const parts = String(dateString || '').split('-').map(Number);
    const date = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Get category relaxation for an exam
   * @param {Object} exam - Exam object
   * @param {string} category - User category
   * @returns {number} Relaxation years
   */
  function getRelaxation(exam, category) {
    if (!exam.relaxation || !exam.relaxation[category]) return 0;
    return exam.relaxation[category];
  }

  /**
   * Determine if user meets qualification requirement
   * @param {string} userQualification - User's qualification
   * @param {Object} exam - Exam object
   * @returns {Object} Qualification check result
   */
  function checkQualification(userQualification, exam) {
    const userLevel = CONFIG.qualificationLevels[userQualification] || 0;
    const examLevel = exam.qualificationLevel || (CONFIG.qualificationLevels[exam.qualification] || 0);

    const acceptedQualifications = exam.acceptedQualifications || [exam.qualification];
    if (acceptedQualifications.includes(userQualification)) {
      return { met: true, reason: 'Qualification matches an accepted option' };
    }

    // Only academic qualifications use the general minimum-level comparison.
    // ITI, Diploma and professional certificates are not treated as interchangeable
    // with school/degree qualifications unless an exam explicitly accepts them.
    const academicLevels = {
      '10th Pass': 1,
      '12th Pass': 2,
      'Graduation': 3,
      'B.E. / B.Tech': 3,
      'Post-Graduation': 4
    };
    const userAcademicLevel = academicLevels[userQualification] || 0;
    const requiredAcademicLevel = academicLevels[exam.qualification] || 0;
    if (userAcademicLevel > 0 && requiredAcademicLevel > 0 && userAcademicLevel >= requiredAcademicLevel) {
      return { met: true, reason: 'Academic qualification meets the configured minimum level; verify post-specific rules' };
    }

    if (exam.qualification && exam.qualification !== userQualification) {
      return { met: false, reason: `Requires ${exam.qualification}; check whether your qualification is explicitly accepted` };
    }

    return { met: true, reason: 'Qualification matches' };
  }

  /**
   * Determine eligibility status for an exam
   * @param {Object} exam - Exam object
   * @param {Object} age - Calculated age object
   * @param {string} category - User category
   * @param {string} qualification - User qualification
   * @returns {Object} Eligibility result
   */
  function determineEligibility(exam, age, category, qualification) {
    if (!age) {
      return {
        exam,
        age: null,
        qualificationMet: false,
        status: 'Age Check Unavailable',
        statusType: 'verification',
        explanation: 'The date of birth or age cutoff date is invalid, or the date of birth is after the cutoff date. Check both dates; no eligibility decision was made.'
      };
    }

    // Fail-closed safety gate: do not issue definitive eligibility decisions
    // until this exact exam record has been audited against its current official
    // notification and all mandatory inputs are represented in the form.
    // Keep records with unknown/complex rules fail-closed. Records with a basic
    // age cutoff and qualification can be screened provisionally, but never called
    // definitively eligible/ineligible until their current-cycle notice is audited.
    // Historical recruitment cycles must never appear as current potential matches.
    if (exam.recruitmentStatus === 'historical') {
      const relaxation = getRelaxation(exam, category);
      const qualCheck = checkQualification(qualification, exam);
      return {
        exam,
        age,
        relaxation,
        effectiveMaxAge: Number.isFinite(Number(exam.maxAge)) ? Number(exam.maxAge) + relaxation : null,
        qualificationMet: qualCheck.met,
        qualificationReason: qualCheck.reason,
        status: 'Historical Recruitment — Not Current',
        statusType: 'verification',
        explanation: exam.verificationReason || 'This recruitment cycle is historical and must not be treated as a current application opportunity. Check the latest official notification.'
      };
    }

    const isPreliminary = exam.verifiedForCurrentCycle !== true;
    const needsHardVerification = isPreliminary && (
      exam.requiresVerification === true ||
      exam.ageRulesUnknown === true ||
      !exam.ageCutoffDate ||
      !Number.isFinite(Number(exam.minAge)) ||
      !Number.isFinite(Number(exam.maxAge)) ||
      Number(exam.maxAge) >= 65
    );
    if (needsHardVerification) {
      const relaxation = getRelaxation(exam, category);
      const qualCheck = checkQualification(qualification, exam);
      const effectiveMaxAge = Number.isFinite(Number(exam.maxAge))
        ? Number(exam.maxAge) + relaxation
        : null;
      const ageIsUsable = age && Number.isFinite(age.decimalAge);
      const hasAgeRange = Number.isFinite(Number(exam.minAge)) && Number.isFinite(Number(exam.maxAge));
      let screeningSummary = 'Age screening could not be calculated reliably from the saved record.';
      if (ageIsUsable && hasAgeRange) {
        if (age.years < Number(exam.minAge)) {
          screeningSummary = `Saved-data age screen: age ${age.formatted} is below the configured minimum ${exam.minAge} years.`;
        } else if (age.years > effectiveMaxAge) {
          screeningSummary = `Saved-data age screen: age ${age.formatted} is above the configured maximum ${effectiveMaxAge} years including the saved ${category} relaxation.`;
        } else {
          screeningSummary = `Saved-data age screen: age ${age.formatted} falls within the configured ${exam.minAge}–${effectiveMaxAge}-year range.`;
        }
      }
      const qualificationSummary = qualCheck.met
        ? `The selected qualification (${qualification}) meets the dataset's configured minimum (${exam.qualification}), but post-specific subject, passing-year or other conditions may still apply.`
        : `The selected qualification (${qualification}) does not match the dataset's configured minimum (${exam.qualification}); check accepted qualifications and post-specific rules.`;
      const cutoffSummary = exam.ageCutoffDate
        ? `Configured age cutoff: ${formatDate(exam.ageCutoffDate)}.`
        : 'No reliable age cutoff date is stored.';
      return {
        exam,
        age,
        relaxation,
        effectiveMaxAge,
        qualificationMet: qualCheck.met,
        qualificationReason: qualCheck.reason,
        screeningOnly: true,
        status: 'Official Verification Required',
        statusType: 'verification',
        explanation: `${screeningSummary} ${cutoffSummary} ${qualificationSummary} This is a preliminary screen using saved data, NOT a confirmed eligibility decision. Verify the current official notification and all post/category-specific conditions before applying.`
      };
    }
    const relaxation = getRelaxation(exam, category);
    const effectiveMaxAge = exam.maxAge + relaxation;
    const qualCheck = checkQualification(qualification, exam);

    const result = {
      exam: exam,
      age: age,
      relaxation: relaxation,
      effectiveMaxAge: effectiveMaxAge,
      qualificationMet: qualCheck.met,
      qualificationReason: qualCheck.reason,
      status: '',
      statusType: '',
      explanation: ''
    };

    // Check qualification first
    if (!qualCheck.met) {
      result.status = isPreliminary ? 'Qualification Check — Not Verified' : 'Qualification Not Met';
      result.statusType = isPreliminary ? 'preliminary' : 'qualification';
      result.explanation = isPreliminary
        ? `Saved data suggests this qualification may not match ${exam.qualification}, but this exam's current-cycle rules have not been officially audited. Treat this as a preliminary screening result only.`
        : `Your qualification (${qualification}) does not meet the requirement of ${exam.qualification}.`;
      return result;
    }

    // Some technical entries are intentionally screening-only until their current
    // notification has been verified. Never infer age eligibility from placeholders.
    if (exam.ageRulesUnknown) {
      result.status = 'Verification Required';
      result.statusType = 'verification';
      result.explanation = exam.verificationReason || 'Age cutoff and eligibility rules must be verified in the current official notification.';
      return result;
    }

    // Check minimum age
    if (age.years < exam.minAge) {
      result.status = isPreliminary ? 'Age Check — Not Verified' : 'Check Official Notification';
      result.statusType = isPreliminary ? 'preliminary' : 'verify';
      result.explanation = isPreliminary
        ? `Saved data suggests your age (${age.formatted}) is below the configured minimum of ${exam.minAge} years. The current-cycle rule is not verified; confirm the official notification.`
        : `Your age (${age.formatted}) is below the minimum required age of ${exam.minAge} years. Please verify if any exceptions apply in the official notification.`;
      return result;
    }

    // Check maximum age with relaxation
    if (age.years <= effectiveMaxAge) {
      // SAFETY: If exam has unchecked mandatory conditions, NEVER show definitive Eligible
      if (exam.requiresVerification) {
        result.status = '⚠️ Verification Required';
        result.statusType = 'verification';
        result.explanation = `Your age (${age.formatted}) and qualification (${qualification}) appear to meet the configured criteria. However, ${exam.verificationReason || 'this exam has additional eligibility conditions that this calculator does not verify.'} Please check the official notification before applying.`;
        return result;
      }

      if (isPreliminary) {
        result.status = 'Potential Match — Not Verified';
        result.statusType = 'preliminary';
        result.explanation = `Saved rules suggest your age (${age.formatted}) and qualification may fit the configured criteria (maximum age ${effectiveMaxAge} years including any configured relaxation). This is NOT a confirmed eligibility result because the current-cycle official notification has not been audited.`;
      } else if (relaxation > 0) {
        result.status = 'Eligible with Relaxation';
        result.statusType = 'relaxation';
        result.explanation = `Your age on cutoff date: ${age.formatted}. Maximum age with ${category} relaxation (${relaxation} years): ${effectiveMaxAge} years. You appear to meet the configured age and qualification criteria.`;
      } else {
        result.status = 'Eligible';
        result.statusType = 'eligible';
        result.explanation = `Your age on cutoff date: ${age.formatted}. Maximum age: ${exam.maxAge} years. You appear to meet the configured age and qualification criteria.`;
      }
      return result;
    }

    // Over age
    result.status = isPreliminary ? 'Age Limit Check — Not Verified' : 'Over Age';
    result.statusType = isPreliminary ? 'preliminary' : 'over-age';
    result.explanation = isPreliminary
      ? `Saved rules suggest your age (${age.formatted}) exceeds the configured maximum age of ${effectiveMaxAge} years. Because the current-cycle official notification is not audited, this is only a preliminary flag, not a final rejection.`
      : `Your age on cutoff date: ${age.formatted}. Maximum age with applicable relaxation: ${effectiveMaxAge} years. You have exceeded the permissible age limit by approximately ${Math.round((age.decimalAge - effectiveMaxAge) * 12)} months.`;
    return result;
  }

  /**
   * Get badge class based on status type
   * @param {string} statusType - Status type
   * @returns {string} CSS class
   */
  function getBadgeClass(statusType) {
    const map = {
      'eligible': 'badge-success',
      'relaxation': 'badge-info',
      'over-age': 'badge-danger',
      'qualification': 'badge-warning',
      'verify': 'badge-neutral',
      'verification': 'badge-warning',
      'preliminary': 'badge-warning'
    };
    return map[statusType] || 'badge-neutral';
  }

  /**
   * Get summary card class based on status type
   * @param {string} statusType - Status type
   * @returns {string} CSS class
   */
  function getSummaryClass(statusType) {
    const map = {
      'eligible': 'eligible',
      'relaxation': 'eligible',
      'over-age': 'over-age',
      'qualification': 'qualification',
      'verify': 'verify',
      'verification': 'verify',
      'preliminary': 'verify'
    };
    return map[statusType] || 'verify';
  }

  // ============================================
  // UI Functions
  // ============================================

  /**
   * Show error message
   * @param {HTMLElement} element - Error element
   * @param {string} message - Error message
   */
  function showError(element, message) {
    element.textContent = message;
    element.classList.add('visible');
    element.previousElementSibling?.classList.add('error');
  }

  /**
   * Hide error message
   * @param {HTMLElement} element - Error element
   */
  function hideError(element) {
    element.classList.remove('visible');
    element.previousElementSibling?.classList.remove('error');
  }

  function parseDobInput(value) {
    const text = String(value || '').trim();
    let match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    let year, month, day;
    if (match) { day = Number(match[1]); month = Number(match[2]); year = Number(match[3]); }
    else { match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if (!match) return null; year = Number(match[1]); month = Number(match[2]); day = Number(match[3]); }
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    date.setHours(0,0,0,0); const today = new Date(); today.setHours(0,0,0,0);
    return date <= today ? date : null;
  }

  /**
   * Validate form
   * @returns {boolean} Is valid
   */
  function validateForm() {
    let isValid = true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate DOB
    const dobValue = elements.dobInput.value;
    if (!dobValue) {
      showError(elements.dobError, 'Please enter your date of birth.');
      isValid = false;
    } else {
      const dob = parseDobInput(dobValue);
      if (!dob) {
        showError(elements.dobError, 'Please enter a valid date of birth.');
        isValid = false;
      } else if (dob > today) {
        showError(elements.dobError, 'Date of birth cannot be in the future.');
        isValid = false;
      } else {
        hideError(elements.dobError);
      }
    }

    // Validate Category
    if (!elements.categorySelect.value) {
      showError(elements.categoryError, 'Please select your category.');
      isValid = false;
    } else {
      hideError(elements.categoryError);
    }

    // Validate Qualification
    if (!elements.qualificationSelect.value) {
      showError(elements.qualificationError, 'Please select your qualification.');
      isValid = false;
    } else {
      hideError(elements.qualificationError);
    }

    return isValid;
  }

  /**
   * Set button loading state
   * @param {boolean} loading - Is loading
   */
  function setButtonLoading(loading) {
    if (loading) {
      elements.scanButton.classList.add('loading');
      elements.scanButton.disabled = true;
    } else {
      elements.scanButton.classList.remove('loading');
      elements.scanButton.disabled = false;
    }
  }

  /**
   * Render summary cards
   */
  function renderSummary() {
    const counts = {
      eligible: 0,
      relaxation: 0,
      'over-age': 0,
      qualification: 0,
      verify: 0,
      verification: 0,
      preliminary: 0
    };

    currentResults.forEach(r => {
      if (counts[r.statusType] !== undefined) counts[r.statusType]++;
    });

    // A useful screening metric, separate from confirmed eligibility:
    // count only records with a known cutoff/range where saved age + qualification
    // both match. Exclude unknown age rules and explicitly historical records.
    const savedRulePotentialMatches = currentResults.filter(r => {
      const exam = r.exam || {};
      const age = r.age;
      if (!age || exam.recruitmentStatus === 'historical') return false;
      if (!exam.ageCutoffDate ||
          !Number.isFinite(Number(exam.minAge)) ||
          !Number.isFinite(Number(exam.maxAge)) ||
          r.qualificationMet !== true) return false;

      // Do not count broad placeholder ranges (for example 0–100) as matches.
      // A record with a plausible configured range can be shown as a potential
      // match even when ageRulesUnknown is true, but it must remain unverified.
      const minAge = Number(exam.minAge);
      const savedMaxAge = Number(exam.maxAge);
      if (minAge < 14 || savedMaxAge >= 65 || savedMaxAge < minAge) return false;

      const decimalAge = Number(age.decimalAge);
      if (!Number.isFinite(decimalAge)) return false;
      const maxAge = savedMaxAge + (Number(r.relaxation) || 0);
      return decimalAge >= minAge && decimalAge <= maxAge;
    }).length;

    // These are the only results the tool may present as officially confirmed.
    const officiallyVerifiedEligible = currentResults.filter(r =>
      r.exam?.verifiedForCurrentCycle === true &&
      (r.statusType === 'eligible' || r.statusType === 'relaxation')
    ).length;
    const totalVerify = counts.verify + counts.verification;

    elements.summaryGrid.innerHTML = `
      <div class="summary-card verify" title="Age and qualification match the saved record only; official conditions may still apply.">
        <div class="summary-number">${savedRulePotentialMatches}</div>
        <div class="summary-label">Potential Matches (Saved Rules)</div>
      </div>
      <div class="summary-card over-age">
        <div class="summary-number">${counts['over-age']}</div>
        <div class="summary-label">Over-age Exams</div>
      </div>
      <div class="summary-card qualification">
        <div class="summary-number">${counts.qualification}</div>
        <div class="summary-label">Qualification Not Met</div>
      </div>
      <div class="summary-card verify">
        <div class="summary-number">${totalVerify}</div>
        <div class="summary-label">Verification Required</div>
      </div>
      <div class="summary-card eligible">
        <div class="summary-number">${officiallyVerifiedEligible}</div>
        <div class="summary-label">Officially Verified Eligible</div>
      </div>
    `;
  }

  /**
   * Render filter tabs
   */
  function renderFilterTabs() {
    const filters = [
      { key: 'all', label: 'All Exams' },
      { key: 'eligible', label: 'Eligible' },
      { key: 'relaxation', label: 'With Relaxation' },
      { key: 'verification', label: '⚠️ Verification Required' },
      { key: 'preliminary', label: 'Preliminary (Not Verified)' },
      { key: 'over-age', label: 'Over Age' },
      { key: 'qualification', label: 'Qualification Issue' },
      { key: 'verify', label: 'Below Min Age' }
    ];

    elements.filterTabs.innerHTML = filters.map(f => `
      <button class="filter-tab ${activeFilter === f.key ? 'active' : ''}" 
              data-filter="${f.key}"
              aria-pressed="${activeFilter === f.key}">
        ${f.label}
      </button>
    `).join('');

    // Add event listeners
    elements.filterTabs.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        activeFilter = this.dataset.filter;
        renderResults();
      });
    });
  }

  // Hindi companion text for the preliminary explanation and exam-specific caution.
  // Keep the original English text as well, so the tool remains bilingual.
  function getHindiPreliminaryExplanation(result) {
    const age = result.age?.formatted || 'उपलब्ध नहीं';
    const min = Number(result.exam.minAge);
    const max = Number(result.effectiveMaxAge ?? result.exam.maxAge);
    let ageText = 'उम्र की जाँच उपलब्ध डेटा से भरोसेमंद तरीके से नहीं हो सकी।';
    if (result.age && Number.isFinite(min) && Number.isFinite(max)) {
      if (result.age.years < min) {
        ageText = `सेव किए गए डेटा के अनुसार आपकी उम्र ${age} है, जो निर्धारित न्यूनतम उम्र ${min} वर्ष से कम है।`;
      } else if (result.age.years > max) {
        ageText = `सेव किए गए डेटा के अनुसार आपकी उम्र ${age} है, जो ${result.category || ''} श्रेणी की दर्ज छूट सहित अधिकतम ${max} वर्ष से अधिक है।`;
      } else {
        ageText = `सेव किए गए डेटा के अनुसार आपकी उम्र ${age} निर्धारित ${min}–${max} वर्ष की सीमा में आती है।`;
      }
    }
    const cutoff = result.exam.ageCutoffDate
      ? `आयु की निर्धारित कटऑफ तारीख: ${formatDate(result.exam.ageCutoffDate)}।`
      : 'आयु की विश्वसनीय कटऑफ तारीख डेटा में दर्ज नहीं है।';
    const qualification = result.qualificationMet
      ? `आपकी चुनी गई योग्यता (${result.userQualification || 'चयनित योग्यता'}) डेटा में दर्ज न्यूनतम योग्यता (${result.exam.qualification}) से मेल खाती है। फिर भी पद के अनुसार विषय, पास होने का वर्ष या अन्य शर्तें लागू हो सकती हैं।`
      : `आपकी चुनी गई योग्यता (${result.userQualification || 'चयनित योग्यता'}) डेटा में दर्ज न्यूनतम योग्यता (${result.exam.qualification}) से मेल नहीं खाती। स्वीकार्य योग्यता और पद-विशेष नियम जाँचें।`;
    return `${ageText} ${cutoff} ${qualification} यह केवल सेव किए गए डेटा पर आधारित प्रारंभिक जाँच है, पक्की पात्रता का निर्णय नहीं। आवेदन करने से पहले वर्तमान आधिकारिक भर्ती सूचना और पद/श्रेणी से जुड़ी सभी शर्तें ज़रूर जाँचें।`;
  }

  function getHindiVerificationNote(note) {
    const translations = {
      'ALP eligibility includes strict technical and medical conditions; verify the official notice.': 'ALP के लिए तकनीकी योग्यता और मेडिकल मानक सख्त होते हैं। आवेदन से पहले आधिकारिक भर्ती सूचना में इन शर्तों की पुष्टि ज़रूर करें।'
    };
    return translations[note] || 'महत्वपूर्ण: ऊपर दी गई शर्त के साथ आधिकारिक भर्ती सूचना भी ध्यान से जाँचें। पद, योग्यता, आयु-सीमा और मेडिकल/शारीरिक मानक अलग हो सकते हैं।';
  }

  /**
   * Render exam cards (mobile view)
   * @param {Array} results - Filtered results
   */
  function renderExamCards(results) {
    if (results.length === 0) {
      elements.examCards.innerHTML = '';
      elements.noResults.style.display = 'block';
      return;
    }

    elements.noResults.style.display = 'none';
    elements.examCards.innerHTML = results.map(r => `
      <article class="exam-card status-${r.statusType}">
        <div class="exam-card-header">
          <h4 class="exam-card-title">${r.exam.exam}</h4>
          <span class="badge ${getBadgeClass(r.statusType)}" aria-label="Status: ${r.status}">
            ${r.status}
          </span>
        </div>
        <p class="exam-card-org">${r.exam.organization}</p>
        <div class="exam-card-details">
          <div class="exam-detail">
            <span class="exam-detail-label">Min Age</span>
            <span class="exam-detail-value">${r.exam.ageRulesUnknown ? "Check notification" : `${r.exam.minAge} years`}</span>
          </div>
          <div class="exam-detail">
            <span class="exam-detail-label">Max Age</span>
            <span class="exam-detail-value">${r.exam.ageRulesUnknown ? "Check notification" : `${r.exam.maxAge} years`}</span>
          </div>
          <div class="exam-detail">
            <span class="exam-detail-label">Your Age</span>
            <span class="exam-detail-value">${r.age.formatted}</span>
          </div>
          <div class="exam-detail">
            <span class="exam-detail-label">Cutoff Date</span>
            <span class="exam-detail-value">${r.exam.ageRulesUnknown ? "Notification-specific" : formatDate(r.exam.ageCutoffDate)}</span>
          </div>
          ${r.relaxation > 0 ? `
          <div class="exam-detail">
            <span class="exam-detail-label">Relaxation</span>
            <span class="exam-detail-value">+${r.relaxation} years (${elements.categorySelect.value})</span>
          </div>
          <div class="exam-detail">
            <span class="exam-detail-label">Effective Max</span>
            <span class="exam-detail-value">${r.effectiveMaxAge} years</span>
          </div>
          ` : ''}
          <div class="exam-detail">
            <span class="exam-detail-label">Your Qualification</span>
            <span class="exam-detail-value">${r.userQualification || 'Not selected'}</span>
          </div>
          <div class="exam-detail">
            <span class="exam-detail-label">Required Qualification</span>
            <span class="exam-detail-value">${r.exam.qualification}${r.exam.acceptedQualifications && r.exam.acceptedQualifications.length > 1 ? ' (or listed equivalent)' : ''}</span>
          </div>
          <div class="exam-detail">
            <span class="exam-detail-label">Qualification Check</span>
            <span class="exam-detail-value">${r.qualificationMet ? '✓ Saved-data match' : '✗ No configured match'}</span>
          </div>
        </div>
        <div class="exam-card-explanation">
          <strong>Preliminary screening (प्रारंभिक जाँच):</strong> ${r.explanation}<p lang="hi" class="hindi-explanation"><strong>हिंदी में:</strong> ${getHindiPreliminaryExplanation({...r, category: elements.categorySelect.value})}</p>
        </div>
        ${r.exam.verificationNote ? `
        <div class="exam-card-explanation" style="background: var(--warning-bg); border-left: 3px solid var(--warning);">
          <strong>⚠️ Important (महत्वपूर्ण):</strong> ${r.exam.verificationNote}<p lang="hi" class="hindi-explanation"><strong>हिंदी में:</strong> ${getHindiVerificationNote(r.exam.verificationNote)}</p>
        </div>
        ` : ''}
        <div class="exam-card-actions">
          <a href="${r.exam.officialNotificationUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            View Notification
          </a>
          ${r.exam.applyUrl ? `
          <a href="${r.exam.applyUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Apply Officially
          </a>
          ` : ''}
        </div>
      </article>
    `).join('');
  }

  /**
   * Render exam table (desktop view)
   * @param {Array} results - Filtered results
   */
  function renderExamTable(results) {
    if (results.length === 0) {
      elements.examTableBody.innerHTML = '';
      return;
    }

    elements.examTableBody.innerHTML = results.map(r => `
      <tr>
        <td class="exam-name-cell">
          <strong>${r.exam.exam}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${r.exam.description}</div>
        </td>
        <td class="exam-org-cell">${r.exam.organization}</td>
        <td>${r.exam.ageRulesUnknown ? "Check notification" : `${r.exam.minAge} - ${r.exam.maxAge} yrs`}</td>
        <td>
          <strong>${r.age.shortFormatted}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">as of ${r.exam.ageRulesUnknown ? "notification-specific date" : formatDate(r.exam.ageCutoffDate)}</div>
        </td>
        <td>
          ${r.relaxation > 0 ? `+${r.relaxation} yrs (${elements.categorySelect.value})` : 'None'}
        </td>
        <td>${r.exam.qualification}</td>
        <td>
          <span class="badge ${getBadgeClass(r.statusType)}">${r.status}</span>
        </td>
        <td style="min-width: 200px;">
          <div style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">${r.explanation}</div>
          ${r.exam.verificationNote ? `
          <div style="font-size: 0.875rem; color: var(--warning); line-height: 1.5; margin-top: 0.5rem; padding: 0.5rem; background: var(--warning-bg); border-radius: var(--radius); border-left: 3px solid var(--warning);">
            <strong>⚠️ Important (महत्वपूर्ण):</strong> ${r.exam.verificationNote}<p lang="hi" class="hindi-explanation"><strong>हिंदी में:</strong> ${getHindiVerificationNote(r.exam.verificationNote)}</p>
          </div>
          ` : ''}
        </td>
        <td>
          <div style="display: flex; gap: 0.5rem; flex-direction: column;">
            <a href="${r.exam.officialNotificationUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="width: 100%;">
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              Notification
            </a>
            ${r.exam.applyUrl ? `
            <a href="${r.exam.applyUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="width: 100%;">
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Apply
            </a>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Render all results
   */
  function renderResults() {
    let filtered = currentResults;

    if (activeFilter !== 'all') {
      filtered = currentResults.filter(r => r.statusType === activeFilter);
    }

    renderSummary();
    renderFilterTabs();
    renderExamCards(filtered);
    renderExamTable(filtered);
  }

  /**
   * Process eligibility scan
   */
  async function processScan() {
    if (!validateForm()) return;

    setButtonLoading(true);

    // Small delay for UX feedback
    await new Promise(resolve => setTimeout(resolve, 600));

    const parsedDob = parseDobInput(elements.dobInput.value);
    const dob = `${parsedDob.getFullYear()}-${String(parsedDob.getMonth()+1).padStart(2,'0')}-${String(parsedDob.getDate()).padStart(2,'0')}`;
    const category = elements.categorySelect.value;
    const qualification = elements.qualificationSelect.value;
    const examCategory = elements.examCategorySelect?.value || 'all';
    const selectedTrade = elements.tradeSelect?.value || '';
    const class12Year = elements.class12YearSelect?.value || '';
    const selectedExams = examData.exams.filter(exam => {
      if (examCategory === 'all') return true;
      // "ITI" is a qualification/trade filter, not just an exam-sector category:
      // railway ALP and Technician records belong to the railway sector but are
      // relevant to ITI candidates and must be included in ITI screening.
      if (examCategory === 'iti') {
        const accepted = exam.acceptedQualifications || [exam.qualification];
        return exam.examCategory === 'iti' ||
          exam.qualification === 'ITI' ||
          accepted.includes('ITI') ||
          (Array.isArray(exam.itiTrades) && exam.itiTrades.length > 0);
      }
      return exam.examCategory === examCategory || exam.examCategory === 'all';
    });
    if (!window.EligibilityEngine) {
      setButtonLoading(false);
      console.error('Eligibility engine did not load.');
      alert('Eligibility engine load nahi hua. Page refresh karke dobara try karein.');
      return;
    }

    const engineProfile = { dob, category, qualification, trade: selectedTrade, examCategory, class12Year };
    const evaluated = window.EligibilityEngine.evaluateAll(selectedExams, engineProfile);
    currentResults = evaluated.map(item => {
      const typeMap = {
        eligible: 'eligible', relaxation: 'relaxation', additional: 'verification',
        potential: 'preliminary', verification: 'verification', unlikely: 'preliminary',
        'age-not-met': 'over-age', 'qualification-not-met': 'qualification'
      };
      const result = {
        exam: item.exam, age: item.age ? { ...item.age, shortFormatted: item.age.short, decimalAge: item.age.years + item.age.months / 12 + item.age.days / 365.2425 } : null,
        status: item.status, statusType: typeMap[item.statusType] || 'verification',
        explanation: item.explanation, qualificationMet: !!(item.qualification && item.qualification.met),
        qualificationReason: item.qualification ? item.qualification.reason : 'Qualification could not be verified.',
        relaxation: item.relaxation || 0, effectiveMaxAge: item.effectiveMaxAge,
        screeningOnly: !item.verified, verificationState: item.verificationState,
        cycle: item.cycle, engineResult: item
      };
      result.userQualification = qualification; result.userTrade = selectedTrade;
      return result;
    });

    // Sort: Eligible first, then by name
    currentResults.sort((a, b) => {
      const priority = {
        'eligible': 0,
        'relaxation': 1,
        'verification': 2,
        'qualification': 3,
        'over-age': 4
      };
      const diff = (priority[a.statusType] ?? 5) - (priority[b.statusType] ?? 5);
      if (diff !== 0) return diff;
      return a.exam.exam.localeCompare(b.exam.exam);
    });

    activeFilter = 'all';
    renderResults();

    elements.resultsSection.classList.add('visible');
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setButtonLoading(false);
  }

  // ============================================
  // Data Loading
  // ============================================

  /**
   * Load exam data
   */
  async function loadExamData() {
    try {
      const response = await fetch(CONFIG.dataPath);
      if (!response.ok) throw new Error('Failed to load exam data');
      examData = await response.json();

      // Update qualification levels from data if available
      if (examData.qualificationHierarchy) {
        Object.assign(CONFIG.qualificationLevels, examData.qualificationHierarchy);
      }

      if (!Array.isArray(examData.exams)) throw new Error('Exam database format is invalid');
      console.log(`✅ Loaded ${examData.exams.length} exams`);
    } catch (error) {
      console.error('Error loading exam data:', error);
      // Fallback data
      examData = {
        exams: [],
        qualificationHierarchy: CONFIG.qualificationLevels
      };
      alert('Unable to load exam database. Please refresh the page or try again later.');
    }
  }

  // ============================================
  // Event Handlers
  // ============================================

  function initEventListeners() {
    // Form submission
    elements.form.addEventListener('submit', function(e) {
      e.preventDefault();
      processScan();
    });

    // Clear errors on input
    elements.dobInput.addEventListener('input', () => hideError(elements.dobError));
    elements.categorySelect.addEventListener('change', () => hideError(elements.categoryError));
    elements.qualificationSelect.addEventListener('change', () => {
      hideError(elements.qualificationError);
      if (elements.tradeGroup) elements.tradeGroup.hidden = elements.qualificationSelect.value !== 'ITI';
    });
    const updateClass12YearVisibility = () => {
      if (elements.class12YearGroup) elements.class12YearGroup.hidden = elements.examCategorySelect?.value !== 'jee';
    };
    updateClass12YearVisibility();
    elements.examCategorySelect?.addEventListener('change', () => {
      updateClass12YearVisibility();
      if (elements.resultsSection.classList.contains('visible')) processScan();
    });
    elements.class12YearSelect?.addEventListener('change', () => {
      if (elements.resultsSection.classList.contains('visible')) processScan();
    });
    elements.tradeSelect?.addEventListener('change', () => {
      if (elements.resultsSection.classList.contains('visible')) processScan();
    });

    // Mobile menu toggle
    elements.menuToggle.addEventListener('click', function() {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !isExpanded);
      elements.mobileMenu.classList.toggle('active');
    });

    // FAQ accordion
    document.querySelectorAll('.faq-question').forEach(button => {
      button.addEventListener('click', function() {
        const item = this.closest('.faq-item');
        const isActive = item.classList.contains('active');

        // Close all
        document.querySelectorAll('.faq-item').forEach(i => {
          i.classList.remove('active');
          i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });

        // Open clicked if wasn't active
        if (!isActive) {
          item.classList.add('active');
          this.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // Keyboard navigation for FAQ
    document.querySelectorAll('.faq-question').forEach(button => {
      button.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });
  }

  // ============================================
  // Initialize
  // ============================================

  async function init() {
    await loadExamData();
    initEventListeners();

    // Set max date for DOB input to today
    // DOB picker supports DD-MM-YYYY text entry and its own date validation.

    console.log('🚀 ROJGARDWAAR.IN Eligibility Matrix initialized');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
