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
    tradeSelect: document.getElementById('itiTrade')
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
  function calculateAge(dobString, cutoffString) {
    const dob = new Date(dobString);
    const cutoff = new Date(cutoffString);

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
    const decimalAge = years + (months / 12) + (days / 365.25);

    return {
      years,
      months,
      days,
      totalMonths,
      decimalAge: Math.round(decimalAge * 10000) / 10000,
      formatted: years === 0 && months === 0 
        ? `${days} days` 
        : years === 0 
          ? `${months} months ${days} days`
          : `${years} years ${months} months`,
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
      result.status = 'Qualification Not Met';
      result.statusType = 'qualification';
      result.explanation = `Your qualification (${qualification}) does not meet the requirement of ${exam.qualification}.`;
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
    if (age.decimalAge < exam.minAge) {
      result.status = 'Check Official Notification';
      result.statusType = 'verify';
      result.explanation = `Your age (${age.formatted}) is below the minimum required age of ${exam.minAge} years. Please verify if any exceptions apply in the official notification.`;
      return result;
    }

    // Check maximum age with relaxation
    if (age.decimalAge <= effectiveMaxAge) {
      // SAFETY: If exam has unchecked mandatory conditions, NEVER show definitive Eligible
      if (exam.requiresVerification) {
        result.status = '⚠️ Verification Required';
        result.statusType = 'verification';
        result.explanation = `Your age (${age.formatted}) and qualification (${qualification}) appear to meet the configured criteria. However, ${exam.verificationReason || 'this exam has additional eligibility conditions that this calculator does not verify.'} Please check the official notification before applying.`;
        return result;
      }

      if (relaxation > 0) {
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
    result.status = 'Over Age';
    result.statusType = 'over-age';
    result.explanation = `Your age on cutoff date: ${age.formatted}. Maximum age with applicable relaxation: ${effectiveMaxAge} years. You have exceeded the permissible age limit by approximately ${Math.round((age.decimalAge - effectiveMaxAge) * 12)} months.`;
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
      'verification': 'badge-warning'
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
      'verification': 'verify'
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
      verification: 0
    };

    currentResults.forEach(r => {
      if (counts[r.statusType] !== undefined) {
        counts[r.statusType]++;
      }
    });

    const totalEligible = counts.eligible + counts.relaxation;
    const totalVerify = counts.verify + counts.verification;

    elements.summaryGrid.innerHTML = `
      <div class="summary-card eligible">
        <div class="summary-number">${totalEligible}</div>
        <div class="summary-label">Eligible Exams</div>
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
            <span class="exam-detail-label">Qualification</span>
            <span class="exam-detail-value">${r.exam.qualification}</span>
          </div>
          <div class="exam-detail">
            <span class="exam-detail-label">Required</span>
            <span class="exam-detail-value">${r.qualificationMet ? '✓ Met' : '✗ Not Met'}</span>
          </div>
        </div>
        <div class="exam-card-explanation">
          <strong>Why:</strong> ${r.explanation}
        </div>
        ${r.exam.verificationNote ? `
        <div class="exam-card-explanation" style="background: var(--warning-bg); border-left: 3px solid var(--warning);">
          <strong>⚠️ Important:</strong> ${r.exam.verificationNote}
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
            <strong>⚠️</strong> ${r.exam.verificationNote}
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
    const selectedExams = examData.exams.filter(exam => examCategory === 'all' || exam.examCategory === examCategory || exam.examCategory === 'all');
    currentResults = selectedExams.map(exam => {
      const age = calculateAge(dob, exam.ageCutoffDate);
      const result = determineEligibility(exam, age, category, qualification);
      if (exam.itiTrades && qualification === 'ITI') {
        if (!selectedTrade) {
          result.status = 'Verification Required'; result.statusType = 'verification';
          result.explanation = 'Select your ITI trade and verify the official notification.';
        } else if (!exam.itiTrades.includes(selectedTrade)) {
          result.status = 'Qualification Not Met'; result.statusType = 'qualification';
          result.explanation = 'This configured post does not list the selected trade. Verify the official notification.';
        }
      }
      return result;
    });

    // Sort: Eligible first, then by name
    currentResults.sort((a, b) => {
      const priority = {
        'eligible': 0,
        'relaxation': 1,
        'verify': 2,
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
    elements.examCategorySelect?.addEventListener('change', () => {
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
