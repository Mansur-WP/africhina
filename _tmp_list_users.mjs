import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const roles = await prisma.role.findMany({ orderBy: { code: 'asc' } });
console.log('Roles present:', roles.map((r) => r.code).join(', ') || '(none)');

const users = await prisma.user.findMany({
  include: { role: true },
  orderBy: { createdAt: 'asc' },
});
console.log('Total users:', users.length);
for (const u of users) {
  console.log(
    `- ${u.email} | role=${u.role?.code} | status=${u.status} | verified=${u.emailVerified}`,
  );
}

const admins = users.filter((u) => u.role?.code === 'admin');
console.log('Admin users:', admins.length);

await prisma.$disconnect();
