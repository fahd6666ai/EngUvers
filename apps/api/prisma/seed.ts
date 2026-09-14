// Phase 0/1 seed — reference/configuration data only (countries, plans,
// a real starter set of universities/faculties, and the generic
// engineering majors from the brief's discipline list). No fake users,
// content, or made-up institutions: rule #7 forbids presenting
// placeholder data as if it were real. A full university/faculty/major/
// curriculum catalog is a content task for whichever phase populates it —
// this is a small, real, honestly-incomplete starting point.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COUNTRIES = [
  { code: 'SA', nameAr: 'السعودية', nameEn: 'Saudi Arabia' },
  { code: 'EG', nameAr: 'مصر', nameEn: 'Egypt' },
  { code: 'AE', nameAr: 'الإمارات', nameEn: 'United Arab Emirates' },
  { code: 'JO', nameAr: 'الأردن', nameEn: 'Jordan' },
  { code: 'MA', nameAr: 'المغرب', nameEn: 'Morocco' },
] as const;

const PLANS = [
  {
    code: 'free' as const,
    nameAr: 'مجاني',
    nameEn: 'Free',
    priceModel: { amount: 0, currency: 'USD', interval: null },
  },
  {
    code: 'student_pro' as const,
    nameAr: 'طالب برو',
    nameEn: 'Student Pro',
    priceModel: { amount: null, currency: 'USD', interval: 'month' },
  },
  {
    code: 'engineer_pro' as const,
    nameAr: 'مهندس برو',
    nameEn: 'Engineer Pro',
    priceModel: { amount: null, currency: 'USD', interval: 'month' },
  },
  {
    code: 'university' as const,
    nameAr: 'الجامعات',
    nameEn: 'University',
    priceModel: { amount: null, currency: 'USD', interval: 'year', contact: true },
  },
  {
    code: 'enterprise' as const,
    nameAr: 'الشركات',
    nameEn: 'Enterprise',
    priceModel: { amount: null, currency: 'USD', interval: 'year', contact: true },
  },
];

// A couple of real, well-known public universities per seeded country —
// not an attempt at a complete catalog. Each gets one "Faculty/College of
// Engineering" so the onboarding academic step has real choices; specific
// per-university major catalogs are future content work (majors below are
// generic, discipline-level, not tied to any faculty).
const UNIVERSITIES: Record<(typeof COUNTRIES)[number]['code'], { nameAr: string; nameEn: string }[]> = {
  SA: [
    { nameAr: 'جامعة الملك سعود', nameEn: 'King Saud University' },
    { nameAr: 'جامعة الملك فهد للبترول والمعادن', nameEn: 'King Fahd University of Petroleum & Minerals' },
  ],
  EG: [
    { nameAr: 'جامعة القاهرة', nameEn: 'Cairo University' },
    { nameAr: 'جامعة عين شمس', nameEn: 'Ain Shams University' },
  ],
  AE: [
    { nameAr: 'جامعة الإمارات العربية المتحدة', nameEn: 'United Arab Emirates University' },
    { nameAr: 'جامعة خليفة', nameEn: 'Khalifa University' },
  ],
  JO: [
    { nameAr: 'الجامعة الأردنية', nameEn: 'University of Jordan' },
    { nameAr: 'جامعة العلوم والتكنولوجيا الأردنية', nameEn: 'Jordan University of Science and Technology' },
  ],
  MA: [
    { nameAr: 'جامعة محمد الخامس', nameEn: 'Mohammed V University' },
    { nameAr: 'جامعة الحسن الثاني', nameEn: 'Hassan II University of Casablanca' },
  ],
};

const ENGINEERING_FACULTY = { nameAr: 'كلية الهندسة', nameEn: 'College of Engineering' };

// Which plan gets which feature — the same reference-data role PLANS/
// COUNTRIES play, not app content. `academy.courses` (Phase 3) has no
// missing external dependency the way `ise.analysis` does, so unlike that
// one it's granted here rather than left ungated for everyone: every
// signed-up user gets `free`, so this is what actually turns the feature
// on. Add a row here, not a hardcoded check, when a future phase's
// feature needs the same treatment.
const PLAN_LIMITS: { planCode: (typeof PLANS)[number]['code']; feature: string; dailyQuota: number | null }[] = [
  { planCode: 'free', feature: 'academy.courses', dailyQuota: null },
  { planCode: 'free', feature: 'library.books', dailyQuota: null },
  { planCode: 'free', feature: 'exams.full_bank', dailyQuota: null },
];

// The disciplines from the brief's product definition (§1) — generic,
// not tied to any university, usable from both the "browse generally"
// onboarding path and the university-linked path alike.
const GENERIC_MAJORS = [
  { nameAr: 'هندسة كهربائية', nameEn: 'Electrical Engineering', disciplineTag: 'electrical' },
  { nameAr: 'هندسة ميكانيكية', nameEn: 'Mechanical Engineering', disciplineTag: 'mechanical' },
  { nameAr: 'هندسة ميكاترونكس', nameEn: 'Mechatronics Engineering', disciplineTag: 'mechatronics' },
  { nameAr: 'هندسة اتصالات', nameEn: 'Communications Engineering', disciplineTag: 'communications' },
  { nameAr: 'هندسة برمجيات', nameEn: 'Software Engineering', disciplineTag: 'software' },
  { nameAr: 'تقنية المعلومات', nameEn: 'Information Technology', disciplineTag: 'it' },
  { nameAr: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', disciplineTag: 'ai' },
  { nameAr: 'هندسة الروبوتات', nameEn: 'Robotics Engineering', disciplineTag: 'robotics' },
];

async function main() {
  for (const country of COUNTRIES) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: country,
      create: country,
    });
  }

  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }

  let universityCount = 0;
  for (const country of COUNTRIES) {
    const countryRow = await prisma.country.findUniqueOrThrow({ where: { code: country.code } });
    for (const uni of UNIVERSITIES[country.code]) {
      const university = await prisma.university.upsert({
        where: { countryId_nameEn: { countryId: countryRow.id, nameEn: uni.nameEn } },
        update: uni,
        create: { ...uni, countryId: countryRow.id },
      });
      await prisma.faculty.upsert({
        where: { universityId_nameEn: { universityId: university.id, nameEn: ENGINEERING_FACULTY.nameEn } },
        update: ENGINEERING_FACULTY,
        create: { ...ENGINEERING_FACULTY, universityId: university.id },
      });
      universityCount++;
    }
  }

  for (const major of GENERIC_MAJORS) {
    await prisma.major.upsert({
      where: { nameEn: major.nameEn },
      update: major,
      create: major,
    });
  }

  for (const limit of PLAN_LIMITS) {
    const plan = await prisma.plan.findUniqueOrThrow({ where: { code: limit.planCode } });
    await prisma.planLimit.upsert({
      where: { planId_feature: { planId: plan.id, feature: limit.feature } },
      update: { dailyQuota: limit.dailyQuota },
      create: { planId: plan.id, feature: limit.feature, dailyQuota: limit.dailyQuota },
    });
  }

  console.log(
    `Seeded ${COUNTRIES.length} countries, ${PLANS.length} plans, ${universityCount} universities (with an engineering faculty each), ${GENERIC_MAJORS.length} generic majors, and ${PLAN_LIMITS.length} plan limits.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
