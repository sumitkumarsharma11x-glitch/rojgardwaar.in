# Eligibility dataset audit — 2026-10-16

## Safety rule
Do not set `verifiedForCurrentCycle: true` merely because an official homepage or a notice URL exists. Verification requires the exact cycle notification/corrigenda, age cutoff and post-wise DOB bands, qualification and crucial date, applicable relaxations, mandatory physical/medical/subject/trade/state conditions, application window/cycle state, and a second-person or automated consistency review. Until then, results must remain screening-only / verification-required.

## Current dataset snapshot
The draft branch dataset contains 32 records. At the start of this audit, all 32 had `verifiedForCurrentCycle: false`. This audit does not change any record to verified without complete evidence.

## Official-source findings checked on 2026-10-16

| Dataset ID | Official evidence found | Audit outcome / required action |
|---|---|---|
| `ssc-cgl-2026` | SSC CGL 2026 official notification: https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf | Notification exists; post-wise age bands, additional post conditions and special relaxations must be represented exactly. Not fully verified. |
| `ssc-chsl-2026` | Current exact CHSL 2026 notification not confirmed in this audit; current record links only to SSC homepage. | Not verified. Replace homepage with exact cycle notice and verify DOB range, LDC/JSA vs DEO qualification/subject requirements. |
| `ssc-mts-2026` | Current exact MTS 2026 notification not confirmed in this audit; record links only to SSC homepage. | Not verified. Need post-wise 18–25 / 18–27 bands and cycle-specific dates/relaxations from official notice. |
| `ssc-gd-2026` | Current exact GD 2026 notification not confirmed in this audit; record links only to SSC homepage. | Not verified. Need exact cutoff, DOB bands, CAPF/SSF/NIA/Assam Rifles post conditions and physical/medical standards. |
| `upsc-cse-2026` | UPSC official CSE 2026 page: https://www.upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination%2C%202026 | Notification exists. Must extract exact DOB range, attempts, category relaxations, qualification completion rules; not fully verified. |
| `upsc-cds-2026` | UPSC official exam notification archive: https://www.upsc.gov.in/exams-related-info/exam-notification/archives lists CDS II 2026; record currently points to generic UPSC homepage. | Not verified. CDS age limits vary by academy/course and marital status; a single 19–25 range is unsafe. |
| `upsc-nda-2026` | UPSC official NDA I 2026 page: https://www.upsc.gov.in/examinations/National%20Defence%20Academy%20and%20Naval%20Academy%20Examination%20%28I%29%2C%202026 and NDA II 2026 page: https://www.upsc.gov.in/examinations/National%20Defence%20Academy%20and%20Naval%20Academy%20Examination%20%28II%29%2C%202026 | Two cycles have distinct exact DOB windows. Current generic cutoff/range is not sufficient; not verified. |
| `rrb-ntpc-2026` | RRB official NTPC-UG CEN 07/2025 notice page listed on https://www.rrbcdg.gov.in/employment-notices.php; dataset links to CEN PDF. | Official cycle source exists. Need exact age table and qualification crucial date from CEN/corrigenda. Not fully verified. |
| `rrb-ntpc-graduate-cen-06-2025` | RRB official CEN 06/2025 page: https://www.rrbcdg.gov.in/2025-06-ntpcg.php; official FAQ says age crucial date is 01.01.2026 and qualification had to be acquired by 20.11.2025: https://www.rrbcdg.gov.in/uploads/2025/06-NTPCG/062025NTPCG-ApplicationFAQs.pdf | Cycle and crucial dates confirmed, but all post-wise age/qualification/category cases still need exact extraction and testing. Not fully verified. |
| `rrb-group-d-2026` | Official RRB CEN 09/2025 Level-1 page: https://www.rrbcdg.gov.in/2025-09-level1.php | Current recruitment exists and has corrigenda. Existing data must be checked against latest corrigendum and post parameters before verification. |
| `ibps-po-2026` | IBPS official PO/MT-XVI notification page: https://www.ibps.in/index.php/window-notification-for-crp-po-mts-xvi/ | Record is named 2026 but data/source need exact XVI notification and corrected dates. Not fully verified. |
| `ibps-clerk-2026` | IBPS official CSA-XVI page: https://www.ibps.in/index.php/clerical-cadre-xvi/ | Exact cycle exists; dataset must be checked against its notification and corrigenda. Not fully verified. |
| `sbi-po-2026` | Exact SBI PO 2026 notification not confirmed in this audit; record links only to SBI homepage. | Not verified. |
| `sbi-clerk-2026` | Exact SBI Junior Associate 2026 notification not confirmed in this audit; record links only to SBI homepage. | Not verified. |
| `afcat-2026` | Exact AFCAT cycle notification not extracted in this audit. | Not verified. AFCAT age differs by Flying vs Ground Duty and qualification; one range is unsafe. |
| `capf-ac-2026` | UPSC official CAPF AC 2026 page: https://www.upsc.gov.in/examinations/Central%20Armed%20Police%20Forces%20%28ACs%29%20Examination%2C%202026 | Official cycle exists. Exact DOB bounds, degree, physical/medical standards and relaxation need extraction. Not fully verified. |
| `ctet-2026` | Exact CTET cycle bulletin not extracted in this audit. | Not verified. CTET is an eligibility test; generic age 18–65 is not established by the record's source and must not be presented as an official age range. |
| `bpsc-69-2026` | Record title itself identifies a historical 69th CCE (2023), not a 2026 recruitment cycle. | Misleading cycle label. Must be historical-only or removed from current-cycle eligibility results; not verified for 2026. |
| `mppsc-2026` | Exact MPPSC State Service 2026 notification not extracted in this audit. | Not verified. Age depends on category, gender, domicile and post. |
| `uppsc-pcs-2026` | Exact UPPSC PCS 2026 notification not extracted in this audit. | Not verified. Age and relaxations must follow current notice and applicable state rules. |
| `rpsc-ras-2026` | Exact RPSC RAS 2026 notification not extracted in this audit. | Not verified. Age and category relaxations require current official notice. |
| `rrb-technician-iti-screening` | Official RRB employment-notice index lists CEN 02/2025 Technician and CEN 02/2026 is not established by this record: https://www.rrbcdg.gov.in/employment-notices.php | Not verified. Record's generic URL and 2026 cutoff are not sufficient; split by exact CEN and technician grade/trade. |
| `rrb-alp-iti-screening` | Official RRB employment-notice index lists CEN 01/2025 ALP and CEN 01/2026 ALP: https://www.rrbcdg.gov.in/employment-notices.php | Not verified. Need exact cycle choice, age relaxation/corrigenda, medical vision and trade-specific qualification. |
| `rrb-group-d-iti-screening` | Same official CEN 09/2025 Level-1 page: https://www.rrbcdg.gov.in/2025-09-level1.php | Duplicate/overlapping with `rrb-group-d-2026`; merge or clearly distinguish the screening purpose. Not verified. |
| `rrb-paramedical-cen-03-2025` | RRB employment notice index lists CEN 03/2025 Paramedical: https://www.rrbcdg.gov.in/employment-notices.php | 0–100 age range is a placeholder, not an eligibility rule. Must split post-wise ages and professional qualifications; not verified. |
| `neet-ug-screening-2026` | Exact NTA NEET UG 2026 bulletin was not extracted in this audit. | 17–100 should not be described as a verified maximum-age rule. Need official age condition, subjects, qualifying exam and year-specific rules. |
| `jee-main-screening-2026` | Exact JEE Main 2026 information bulletin not extracted in this audit. | 0–100 is a placeholder; verify allowed Class XII passing years, subjects, attempt limits and programme-specific conditions. |
| `jee-advanced-screening-2026` | Exact JEE Advanced 2026 information brochure not extracted in this audit. | 0–100 is a placeholder; verify attempts, first Class XII appearance year, age/date-of-birth rules and category relaxations. |
| `cuet-ug-screening-2026` | Exact CUET UG 2026 bulletin and participating-university course rules not extracted in this audit. | 0–100 is a placeholder; eligibility differs by university/course. Cannot mark globally verified. |
| `ctet-teacher-screening-2026` | Exact CTET Sept 2026 bulletin URL is recorded, but its rules were not extracted in this audit. | 0–100 is a placeholder; CTET eligibility is qualification-specific and should not be represented as a generic age-based recruitment. Not verified. |
| `state-tet-screening` | Generic Ministry of Education URL only. | Not a single exam; state-specific rules differ. Must ask state/board or keep clearly as non-definitive screening. Not verified. |
| `iti-trade-screening` | DGT homepage only; not a single recruitment notice. | Qualification checker, not a recruitment eligibility record. Keep separate from confirmed recruitment eligibility. Not verified. |
| `apprenticeship-iti-screening` | DGT FAQ only; no specific establishment/trade/advertisement is attached. | Apprenticeship age/qualification differ by establishment and trade; 14–100 range is not a verified upper-age rule. Not verified. |

## Priority fixes
1. Do not turn any record verified until the complete evidence checklist is satisfied.
2. Replace generic homepage URLs and placeholder 0–100 / 17–100 / 18–65 ranges with exact official cycle notice and real rules, or disable the age verdict for that record.
3. Split exams with materially different posts/courses/cycles (SSC CGL, CDS, NDA, AFCAT, RRB Technician/ALP/Paramedical, admissions).
4. Mark historical or expired cycles clearly and never imply applications are open.
5. Add notification/corrigendum URLs, exact cited paragraph/page, checked date, age-band table, category relaxation and mandatory conditions to every record.
6. After data changes, run validator/tests and manually verify rendered desktop/mobile results.

## Important limitation
This is an initial evidence audit, not a claim that all 32 exams have been fully verified. Official source existence alone does not prove every rule is correctly encoded. No exam was promoted to verified by this report.
