# StudyOS audit and repair

## Goal
Audit the existing StudyOS app and repair confirmed functional defects without rebuilding it or changing its established design and data model unnecessarily.

## Work
1. Inspect existing source, route inventory, diagnostics, migrations, and available security-scan results; gather evidence for broken flows instead of assuming defects.
2. Review student/admin routes and controls, shared data hooks, server functions, and the core study workflows. Prioritize confirmed failures and the known unfinished publishing revision/course-request items.
3. Make focused fixes only for verified problems, preserving authentication, RLS, existing records, and the established UI. Add a targeted test for any changed business rule.
4. Verify affected flows in the live preview and check the current build output. Report which requested areas were directly verified and which remain unverified due to account/data or time constraints.

## Technical details
- Keep the current TanStack Start, React Query, Lovable Cloud, and existing route/data architecture.
- Do not run schema changes unless a confirmed defect requires one; never weaken RLS to make a screen work.
- For security posture, report scanner results only; do not conduct an independent security review.
