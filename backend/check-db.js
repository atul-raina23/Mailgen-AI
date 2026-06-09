const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('USERS:', users.map(u => ({ id: u.id, email: u.email, name: u.name })));
  
  const accounts = await prisma.connectedAccount.findMany();
  console.log('CONNECTED_ACCOUNTS:', accounts.map(a => ({
    id: a.id,
    userId: a.userId,
    provider: a.provider,
    refreshToken: a.refreshToken
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
