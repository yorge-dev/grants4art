import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hash } from 'bcryptjs';

// This script creates/resets the admin user in production
// Usage: DATABASE_URL="your-production-url" ADMIN_EMAIL="admin@yorge.net" ADMIN_PASSWORD="Sacirema@-97" npx tsx scripts/create-prod-admin.ts

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('Usage: DATABASE_URL="your-url" ADMIN_EMAIL="email" ADMIN_PASSWORD="password" npx tsx scripts/create-prod-admin.ts');
  process.exit(1);
}

if (!process.env.ADMIN_EMAIL) {
  console.error('❌ ADMIN_EMAIL environment variable is required');
  process.exit(1);
}

if (!process.env.ADMIN_PASSWORD) {
  console.error('❌ ADMIN_PASSWORD environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;
  const databaseUrl = process.env.DATABASE_URL!;

  console.log('🔧 Creating/updating admin user in production...\n');
  console.log('Email:', email);
  console.log('DATABASE_URL:', databaseUrl.substring(0, 30) + '...');
  console.log('');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check if admin exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email }
    });

    const hashedPassword = await hash(password, 10);

    if (existingAdmin) {
      // Update existing admin
      await prisma.adminUser.update({
        where: { email },
        data: { 
          password: hashedPassword,
          role: 'SUPER_ADMIN'
        }
      });
      console.log('✅ Admin user password updated successfully!');
    } else {
      // Create new admin
      await prisma.adminUser.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Admin',
          role: 'SUPER_ADMIN'
        }
      });
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n📋 Admin user details:');
    console.log('  Email:', email);
    console.log('  Role: SUPER_ADMIN');
    console.log('\n✅ You can now login with these credentials!');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createAdmin();


