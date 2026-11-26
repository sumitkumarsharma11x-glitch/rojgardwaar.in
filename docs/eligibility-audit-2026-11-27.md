# Eligibility data safety audit — 2026-11-27

## Status

**All 33 records remain unverified for a definitive current-cycle eligibility decision.** This is a safety review and fail-closed change, not a claim that the 33 notifications have all been independently checked.

- Records in dataset: 33
- Marked verified for current cycle: 0
- Forced to require official verification before a result: 33
- Dataset safety status: `screening-only-pending-official-review`

## Required verification before any record can be marked verified

For each exact recruitment cycle, a reviewer must open the official authority's notice and every relevant corrigendum and record:
1. Exact notice/CEN/advt number, official PDF/page URL, title and publication date.
2. Age cut-off date and exact inclusive DOB boundaries, including post-wise/branch-wise bands.
3. Qualification, subject, trade, marks and crucial date requirements.
4. Category relaxations and combined relaxations (for example, PwBD plus OBC/SC/ST), where applicable.
5. Physical, medical, marital-status, domicile, language, attempt-limit and other mandatory conditions.
6. Application dates and whether the cycle is open, upcoming or closed.
7. Evidence location (paragraph/table/page), reviewer and checked date.
8. Independent consistency review and tests for boundary DOBs and categories.

A generic authority homepage, third-party mirror, old-cycle notice or a passing JSON-schema check is not sufficient evidence.

## Records awaiting official review

1. `ssc-cgl-2026` — pending official-cycle verification; calculator must fail closed.
2. `ssc-chsl-2026` — pending official-cycle verification; calculator must fail closed.
3. `ssc-mts-2026` — pending official-cycle verification; calculator must fail closed.
4. `ssc-gd-2026` — pending official-cycle verification; calculator must fail closed.
5. `upsc-cse-2026` — pending official-cycle verification; calculator must fail closed.
6. `upsc-cds-2026` — pending official-cycle verification; calculator must fail closed.
7. `upsc-nda-2026` — pending official-cycle verification; calculator must fail closed.
8. `rrb-ntpc-2026` — pending official-cycle verification; calculator must fail closed.
9. `rrb-ntpc-graduate-cen-06-2025` — pending official-cycle verification; calculator must fail closed.
10. `rrb-group-d-2026` — pending official-cycle verification; calculator must fail closed.
11. `ibps-po-2026` — pending official-cycle verification; calculator must fail closed.
12. `ibps-clerk-2026` — pending official-cycle verification; calculator must fail closed.
13. `sbi-po-2026` — pending official-cycle verification; calculator must fail closed.
14. `sbi-clerk-2026` — pending official-cycle verification; calculator must fail closed.
15. `afcat-2026` — pending official-cycle verification; calculator must fail closed.
16. `capf-ac-2026` — pending official-cycle verification; calculator must fail closed.
17. `ctet-2026` — pending official-cycle verification; calculator must fail closed.
18. `bpsc-69-2026` — pending official-cycle verification; calculator must fail closed.
19. `mppsc-2026` — pending official-cycle verification; calculator must fail closed.
20. `uppsc-pcs-2026` — pending official-cycle verification; calculator must fail closed.
21. `rpsc-ras-2026` — pending official-cycle verification; calculator must fail closed.
22. `rrb-technician-iti-screening` — pending official-cycle verification; calculator must fail closed.
23. `rrb-alp-iti-screening` — pending official-cycle verification; calculator must fail closed.
24. `rrb-group-d-iti-screening` — pending official-cycle verification; calculator must fail closed.
25. `rrb-paramedical-cen-03-2025` — pending official-cycle verification; calculator must fail closed.
26. `neet-ug-screening-2026` — pending official-cycle verification; calculator must fail closed.
27. `jee-main-screening-2026` — pending official-cycle verification; calculator must fail closed.
28. `jee-advanced-screening-2026` — pending official-cycle verification; calculator must fail closed.
29. `cuet-ug-screening-2026` — pending official-cycle verification; calculator must fail closed.
30. `ctet-teacher-screening-2026` — pending official-cycle verification; calculator must fail closed.
31. `state-tet-screening` — pending official-cycle verification; calculator must fail closed.
32. `iti-trade-screening` — pending official-cycle verification; calculator must fail closed.
33. `apprenticeship-iti-screening` — pending official-cycle verification; calculator must fail closed.

## Safety implementation

All records have `verifiedForCurrentCycle: false` and `requiresVerification: true`. The validator now rejects an unverified record that does not explicitly require official verification. The calculator therefore returns **Official Verification Required** rather than presenting stored age/qualification values as a reliable eligibility verdict.

Do not remove the fail-closed flag or mark any record verified simply to reduce the pending count. Update each record only after its own evidence checklist is complete.
