# EngUvers — Page / Route Map (Phase 0-1 scope)

All routes are locale-prefixed (`next-intl`, `localePrefix: 'always'`):
`/[locale]/...` with `ar` as the default and RTL, `en` as secondary and
LTR. Later phases (EB/EA/EE/EAI/EP/EC/ISE, admin/content management) add
their own routes when their phase starts — not designed here.

| Route | Page | Phase | Notes |
|---|---|---|---|
| `/[locale]/` | Landing | 0 (placeholder) / 1 (real) | Marketing + journey overview |
| `/[locale]/onboarding/language` | Language/country entry | 1 | Sets locale cookie before anything else |
| `/[locale]/onboarding/country` | Country picker | 1 | |
| `/[locale]/onboarding/academic` | University → Faculty → Major → Year, or "browse generally" | 1 | Drives `Profile.universityId/majorId/studyYear` |
| `/[locale]/auth/login` | Login | 1 | Email, Google, phone OTP |
| `/[locale]/auth/register` | Register | 1 | |
| `/[locale]/auth/verify-otp` | OTP verification | 1 | |
| `/[locale]/dashboard` | User dashboard | 1 | Skills profile, entitlements, journey progress |
| `/[locale]/settings/billing` | Billing | 1 (shell) / 6 (functional) | Plan, voucher redemption, payment history |
| `/[locale]/lab/circuits/[projectId]` | Circuit Lab | 2 | Velxio iframe + Arabic side panel (instructions, "explain my error", save, publish to portfolio) |

Not yet mapped (designed at the start of their phase): Engineering Books
(EB), Engineering Academy (EA), Engineering Exams (EE), Engineering AI
(EAI) chat surface, Student Notebook, Engineering Portfolio (EP),
Engineering Career (EC) + AI interview, project marketplace, ISE
dashboards, university/enterprise admin consoles, content-management
admin.
