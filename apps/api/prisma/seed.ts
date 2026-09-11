// Phase 0 seed — reference/configuration data only (countries, plans).
// No fake users, universities, or content: rule #7 forbids presenting
// placeholder data as if it were real. University/major/curriculum
// datasets are a Phase 1+ content task, seeded from a real source then.
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

  console.log(`Seeded ${COUNTRIES.length} countries and ${PLANS.length} plans.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
