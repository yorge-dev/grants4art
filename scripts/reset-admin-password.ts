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

  console.log('🔧 Resetting admin password...\n');
  console.log('Email:', email);
  console.log('New password:', password);
  console.log('');

  // Check if admin exists
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email }
  });

  if (!existingAdmin) {
    console.log('❌ Admin user not found! Creating new admin user...\n');
    
    const hashedPassword = await hash(password, 10);
    
    const admin = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin',
        role: 'SUPER_ADMIN'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
  } else {
    console.log('✅ Admin user found. Resetting password...\n');
    
    const hashedPassword = await hash(password, 10);
    
    await prisma.adminUser.update({
      where: { email },
      data: { password: hashedPassword }
    });

    console.log('✅ Password reset successfully!');
    console.log('Email:', email);
    console.log('New password:', password);
  }

  console.log('\n⚠️  Please change the password after first login!');
  
  // Show environment check
  console.log('\n📋 Environment check:');
  console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'not set (using default)');
  console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? '***set***' : 'not set (using default)');
  console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ set' : '❌ NOT SET (required!)');
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'not set');
  
  if (!process.env.NEXTAUTH_SECRET) {
    console.log('\n⚠️  WARNING: NEXTAUTH_SECRET is not set! Authentication may not work.');
    console.log('   Generate one with: openssl rand -base64 32');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

