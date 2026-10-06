import { serializable } from '../src/database/transaction';
import '../src/config/env';
import { z } from 'zod';
import prisma from '../src/repositories/prisma';
import { PasswordUtil } from '../src/utils/password';

async function bootstrap() {
  const input = z.object({ email: z.string().email(), password: z.string().min(12).max(72), name: z.string().min(1) }).parse({
    email: process.env.BOOTSTRAP_ADMIN_EMAIL, password: process.env.BOOTSTRAP_ADMIN_PASSWORD, name: process.env.BOOTSTRAP_ADMIN_NAME,
  });
  const passwordHash = await PasswordUtil.hash(input.password);
  await serializable(async tx => {
  if (await tx.admin.count()) throw new Error('Bootstrap is only permitted for an empty admin table');
  await tx.admin.create({ data: { email: input.email.toLowerCase(), name: input.name,
    passwordHash, role: 'SUPER_ADMIN' } });
  });
  console.log('Administrator created. Remove bootstrap variables from the environment.');
}
bootstrap().catch(() => { console.error('Admin bootstrap failed. Check required variables and database.'); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
