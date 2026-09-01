# ROJGARDWAAR.IN — Eligibility Engine Documentation

## Overview

The ROJGARDWAAR.IN Eligibility Engine is a client-side JavaScript module that calculates exam eligibility based on user inputs (Date of Birth, Category, and Qualification) against a structured JSON database of Indian competitive examinations.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   index.html    │────▶│    js/app.js     │────▶│  data/exams.json│
│  (UI/Inputs)    │     │ (Engine/Logic)   │     │  (Exam Database)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  css/style.css   │
                        │  (Presentation)  │
                        └──────────────────┘
```

## Data Flow

1. **User Input** → DOB, Category, Qualification
2. **Validation** → Client-side form validation
3. **Age Calculation** → Precise age in years/months/days from DOB to exam cutoff date
4. **Eligibility Determination** → Per-exam rules applied
5. **Result Rendering** → Summary + Filterable cards/table

## Core Functions

### `calculateAge(dobString, cutoffString)`

Calculates precise age from date of birth to a specific cutoff date.

**Parameters:**
- `dobString` (string): Date of birth in ISO format `YYYY-MM-DD`
- `cutoffString` (string): Cutoff date in ISO format `YYYY-MM-DD`

**Returns:**
```javascript
{
  years: number,        // Full years
  months: number,       // Remaining months
  days: number,         // Remaining days
  totalMonths: number,  // Total months
  decimalAge: number,   // Age as decimal (e.g., 24.25)
  formatted: string,    // Human readable (e.g., "24 years 3 months")
  shortFormatted: string // Compact (e.g., "24y 3m")
}
```

**Important:** Each exam uses its own `ageCutoffDate`, not today's date.

### `getRelaxation(exam, category)`

Retrieves category-specific age relaxation for a given exam.

**Parameters:**
- `exam` (Object): Exam object from database
- `category` (string): User category (General, OBC, SC, ST, EWS, PwD)

**Returns:** `number` — Relaxation in years

**Note:** Relaxation is defined per exam, not universally. Some exams (CDS, NDA) offer no relaxation.

### `checkQualification(userQualification, exam)`

Checks if user qualification meets exam requirements using hierarchy.

**Qualification Hierarchy:**
| Level | Qualification |
|-------|--------------|
| 1 | 10th Pass |
| 2 | 12th Pass |
| 3 | Graduation |
| 4 | Post-Graduation |

**Logic:** Higher qualification levels satisfy lower requirements.

**Returns:**
```javascript
{ met: boolean, reason: string }
```

### `determineEligibility(exam, age, category, qualification)`

Main eligibility decision function.

**Eligibility Statuses:**
| Status | Type | Color | Meaning |
|--------|------|-------|---------|
| Eligible | `eligible` | Green | Within age limit, no relaxation needed |
| Relaxation Applied | `relaxation` | Blue | Within relaxed age limit |
| Over Age | `over-age` | Red | Exceeds maximum age even with relaxation |
| Qualification Not Met | `qualification` | Orange | Qualification below requirement |
| Check Official Notification | `verify` | Gray | Below min age or uncertain conditions |

**Returns:** Complete result object with status, explanation, and metadata.

## Exam Data Structure

```json
{
  "id": "unique-identifier",
  "exam": "Exam Full Name",
  "organization": "Recruiting Organization",
  "minAge": 18,
  "maxAge": 27,
  "ageCutoffDate": "2026-08-01",
  "qualification": "Graduation",
  "qualificationLevel": 3,
  "relaxation": {
    "General": 0,
    "OBC": 3,
    "SC": 5,
    "ST": 5,
    "EWS": 0,
    "PwD": 10
  },
  "officialNotificationUrl": "https://official-site.gov.in/",
  "applyUrl": "https://official-site.gov.in/apply",
  "description": "Brief description of posts"
}
```

### Field Requirements

| Field | Required | Notes |
|-------|----------|-------|
| `id` | Yes | Unique, kebab-case |
| `exam` | Yes | Full official name |
| `organization` | Yes | Recruiting body |
| `minAge` | Yes | Minimum age in years |
| `maxAge` | Yes | Maximum age in years |
| `ageCutoffDate` | Yes | ISO date for age calculation |
| `qualification` | Yes | Minimum required qualification text |
| `qualificationLevel` | Yes | Numeric level (1-4) |
| `relaxation` | Yes | Object with all 6 categories |
| `officialNotificationUrl` | Yes | Must be official .gov.in or verified domain |
| `applyUrl` | No | Application portal URL |
| `description` | No | Brief post description |
| `verificationNote` | No | Displayed when exam has complex/variable criteria (e.g., CDS different ages per academy) |

## Adding a New Exam

1. Open `data/exams.json`
2. Add a new object to the `exams` array
3. Ensure all required fields are present
4. Verify `officialNotificationUrl` points to the official website
5. Test with multiple DOB/category/qualification combinations

## Updating Existing Exam Data

1. Locate the exam by `id` in `data/exams.json`
2. Update the relevant fields
3. If `ageCutoffDate` changes, update it to the new notification's cutoff
4. If relaxation rules change, update the `relaxation` object

## Validation Rules

### Date of Birth
- Must be provided
- Must be a valid date
- Cannot be in the future
- Cannot be before 1900 (browser-enforced)

### Category
- Must be one of: General, OBC, SC, ST, EWS, PwD
- Case-sensitive in data, case-insensitive in UI

### Qualification
- Must be one of: 10th Pass, 12th Pass, Graduation, Post-Graduation
- Higher qualifications automatically satisfy lower requirements

## Performance Considerations

- All calculations run client-side in O(n) time where n = number of exams
- No server round-trip required for eligibility check
- JSON data file is fetched once and cached by browser
- Results are computed in ~100ms even with 100+ exams

## Browser Compatibility

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Android)

## Accessibility

- All form inputs have proper labels
- Error messages use `aria-live="polite"` and `role="alert"`
- Results section uses `aria-live="polite"` for screen reader announcements
- Status badges include `aria-label` for screen readers
- Keyboard navigation supported throughout
- Focus states visible on all interactive elements

## Security

- No personal data transmitted to any server
- DOB, category, and qualification remain in browser memory only
- No cookies used for tracking
- All external links use `rel="noopener noreferrer"`

## File Size Budget

| File | Size (gzipped) |
|------|---------------|
| index.html | ~8 KB |
| css/style.css | ~4 KB |
| js/app.js | ~6 KB |
| data/exams.json | ~4 KB |
| **Total** | **~22 KB** |

## Future Enhancements

- [ ] Add more state PSC exams
- [ ] Add teaching eligibility exams (TET, NET)
- [ ] Add defence medical standards info
- [ ] Add attempt limit tracking
- [ ] Add physical fitness requirement notes
- [ ] Add exam calendar/timeline view
- [ ] Export results as PDF
- [ ] Save scan history (localStorage)

## Maintenance Checklist

- [ ] Verify all official URLs are still active (quarterly)
- [ ] Update age cutoff dates for new notification cycles (annually)
- [ ] Add new exams as notifications are released
- [ ] Check for relaxation rule changes in major exams
- [ ] Test on latest mobile devices and browsers
- [ ] Review and update SEO content

---

**Version:** 1.1.0  
**Last Updated:** September 1, 2026  
**Maintainer:** ROJGARDWAAR.IN Team
