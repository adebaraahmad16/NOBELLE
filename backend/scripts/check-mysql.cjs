require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const client = new PrismaClient();
const timer = setTimeout(() => { console.error('MySQL connection check timed out'); process.exit(1); }, 8000);
client.$connect().then(async () => {
  console.log('MySQL connection succeeded');
  clearTimeout(timer);
  await client.$disconnect();
}).catch(async () => {
  console.error('MySQL is unreachable with the current DATABASE_URL');
  clearTimeout(timer);
  await client.$disconnect();
  process.exitCode = 1;
});
