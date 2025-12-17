import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hash } from 'bcryptjs';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@txartgrants.com';
  const password = process.env.ADMIN_PASSWORD || 'changeme123';

  // Check if admin already exists
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email }
  });

  if (existingAdmin) {
    console.log('Admin user already exists:', email);
    console.log('To reset the password, run: npm run db:fix-admin');
    return;
  }

  // Create admin user
  const hashedPassword = await hash(password, 10);
  
  const admin = await prisma.adminUser.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Admin',
      role: 'SUPER_ADMIN'
    }
  });

  console.log('Admin user created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('⚠️  Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error('Error seeding admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

