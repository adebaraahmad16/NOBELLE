import prisma from '../src/repositories/prisma';
import { PasswordUtil } from '../src/utils/password';

async function seedAdmin() {
  const email = 'admin@nobelle.com';
  const password = 'AdminPassword123!';

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} already exists.`);
    return;
  }

  const passwordHash = await PasswordUtil.hash(password);
  const admin = await prisma.admin.create({
    data: {
      email,
      name: 'Super Admin',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('? Initial Admin created successfully:');
  console.log(`Email: ${admin.email}`);
  console.log(`Password: ${password}`);
}

seedAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
