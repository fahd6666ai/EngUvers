# EngUvers — Page / Route Map (Phase 0-1 scope)

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
| `/[locale]/lab/circuits/[projectId]` | Circuit Lab | Phase 2 | Velxio iframe + Arabic side panel (instructions, "explain my error", save, publish to portfolio) |

Not yet mapped (designed at the start of their phase): Engineering Books
(EB), Engineering Academy (EA), Engineering Exams (EE), Engineering AI
(EAI) chat surface, Student Notebook, Engineering Portfolio (EP),
Engineering Career (EC) + AI interview, project marketplace, ISE
dashboards, university/enterprise admin consoles, content-management
admin.
