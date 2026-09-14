# EngUvers — Page / Route Map (Phase 0-3 scope)

All routes are locale-prefixed (`next-intl`, `localePrefix: 'always'`):
`/[locale]/...` with `ar` as the default and RTL, `en` as secondary and
LTR. Later phases (EB/EA/EE/EAI/EP/EC/ISE, admin/content management) add
their own routes when their phase starts — not designed here.

| Route | Page | Status | Notes |
|---|---|---|---|
| `/[locale]/` | Landing | ✅ Phase 1 | Journey overview, discipline list, CTAs into onboarding/auth |
| `/[locale]/onboarding/language` | Language picker | ✅ Phase 1 | First screen; writes nothing yet, just sets the route locale |
| `/[locale]/onboarding/country` | Country picker | ✅ Phase 1 | Fetches `GET /academic/countries`; "browse generally" skips straight to register |
| `/[locale]/onboarding/academic` | University / major / study year, or skip | ✅ Phase 1 | Fetches `GET /academic/universities`, `GET /academic/majors`; selections held in a client-side draft (see `lib/onboarding-draft.ts`) until account creation |
| `/[locale]/auth/login` | Login | ✅ Phase 1 | Email+password and phone OTP tabs; Google button present but disabled (no OAuth credentials yet) |
| `/[locale]/auth/register` | Register | ✅ Phase 1 | Email+password; flushes the onboarding draft to `POST /me/onboarding` right after account creation |
| `/[locale]/auth/verify-otp` | OTP verification | ✅ Phase 1 | Reads `?phone=`, dev-mode code echoed by the API response (no real SMS gateway configured) |
| `/[locale]/dashboard` | User dashboard | ✅ Phase 1 | `GET /me/dashboard`: profile, plan badge, skills (empty until Phase 2+), journey checklist. Protected by `middleware.ts` (cookie presence) + the API's `JwtAuthGuard` |
| `/[locale]/settings/billing` | Billing | Phase 6 | Plan, voucher redemption, payment history — moved out of Phase 1; no functional payment system exists yet to back a shell |
| `/[locale]/lab` | Project Lab shell | ✅ Phase 2 | Lists the user's circuit projects (`GET /circuit-projects`), "New project" CTA |
| `/[locale]/lab/circuits/new` | Create + redirect | ✅ Phase 2 | `POST /circuit-projects` (seeded with a Blink-on-Uno starter), redirects into the editor |
| `/[locale]/lab/circuits/[projectId]` | Circuit Lab | ✅ Phase 2 | Velxio iframe (LTR, its own UI has no Arabic locale) + Arabic side panel (save status, run status, serial monitor, AGPL source link). "Explain my project" calls a real, entitlement-gated endpoint that currently 503s honestly (Phase 4 needs `services/ai` + an Anthropic API key — see CLAUDE.md); "publish to portfolio" is still disabled — Phase 5 |
| `/[locale]/academy` | Course catalog | ✅ Phase 3 | Public: `GET /academy/courses` (published only) |
| `/[locale]/academy/[courseId]` | Course detail | ✅ Phase 3 | Public course/lesson browsing; enroll and mark-lesson-complete require login + the `academy.courses` entitlement (granted to `free` on signup) |
| `/[locale]/admin/academy` | Content-admin: course list + create | ✅ Phase 3 | Role-gated (`admin`/`instructor`) via `RolesGuard`; client-side role check is UX only, same as the auth-cookie pattern in `middleware.ts` — the API's `RolesGuard` is the real boundary |
| `/[locale]/admin/academy/[courseId]` | Content-admin: edit course + manage lessons | ✅ Phase 3 | Publish/unpublish toggle, add/delete lessons (video or article) |
| `/[locale]/library` | Book catalog | ✅ Phase 3 | Public: `GET /library/books` (published only); catalog/detail never expose `fileUrl` |
| `/[locale]/library/[bookId]` | Book detail | ✅ Phase 3 | Public metadata; "Open book" requires login + the `library.books` entitlement (granted to `free`) — fetches the actual link from `GET /library/books/:id/access` and opens it in a new tab |
| `/[locale]/admin/library` | Content-admin: book list + create | ✅ Phase 3 | Role-gated (`admin`/`instructor`), same shape as `/admin/academy` |
| `/[locale]/admin/library/[bookId]` | Content-admin: edit book | ✅ Phase 3 | Publish/unpublish toggle, delete |
| `/[locale]/exams` | Exam catalog | ✅ Phase 3 | Public: `GET /exams` (published only); "your attempts" list below for signed-in users |
| `/[locale]/exams/[examId]` | Exam detail + take exam | ✅ Phase 3 | Public metadata; "Start exam" requires login + the `exams.full_bank` entitlement (granted to `free`) — the whole start → answer → submit flow happens on this one page, no separate route, since there's no "resume an in-progress attempt" endpoint yet |
| `/[locale]/exams/attempts/[attemptId]` | Attempt review | ✅ Phase 3 | Owner-only; shows each question, the selected option, and whether it was correct |
| `/[locale]/admin/exams` | Content-admin: exam list + create | ✅ Phase 3 | Role-gated (`admin`/`instructor`), same shape as `/admin/academy` and `/admin/library` |
| `/[locale]/admin/exams/[examId]` | Content-admin: edit exam + manage questions | ✅ Phase 3 | Publish/unpublish toggle; add a multiple-choice question (fixed 4 option slots, mark one correct) or delete one — no per-option editing endpoint, delete-and-recreate the question instead |

Not yet mapped (designed at the start of their phase): Engineering AI
(EAI) chat surface, Student Notebook, Engineering Portfolio (EP),
Engineering Career (EC) + AI interview, project marketplace, ISE
dashboards, university/enterprise admin consoles.
