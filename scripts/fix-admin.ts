import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

let rl: readline.Interface | null = null;

function initReadline() {
  if (!rl && process.stdin.isTTY) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  return rl;
}

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    const rlInstance = initReadline();
    if (!rlInstance || !process.stdin.isTTY) {
      // Non-interactive mode, return empty string
      resolve('');
      return;
    }
    rlInstance.question(query, resolve);
  });
}

function closeReadline() {
  if (rl) {
    rl.close();
    rl = null;
  }
}

async function main() {
  console.log('🔍 Checking admin users...\n');

  // List all admin users
  const admins = await prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });

  if (admins.length === 0) {
    console.log('❌ No admin users found in database!\n');
    console.log('Creating a new admin user...\n');
    
    const email = process.env.ADMIN_EMAIL || await question('Enter email (or press Enter for admin@txartgrants.com): ') || 'admin@txartgrants.com';
    const password = process.env.ADMIN_PASSWORD || await question('Enter password (or press Enter for changeme123): ') || 'changeme123';
    
    const hashedPassword = await hash(password, 10);
    
    const admin = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin',
        role: 'SUPER_ADMIN'
      }
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('⚠️  Please change the password after first login!\n');
  } else {
    console.log(`Found ${admins.length} admin user(s):\n`);
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Email: ${admin.email}`);
      console.log(`   Name: ${admin.name || 'N/A'}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Created: ${admin.createdAt.toISOString()}\n`);
    });

    // Test password for first admin
    const testEmail = admins[0].email;
    console.log(`\n🧪 Testing password for: ${testEmail}`);
    
    const testPassword = process.env.ADMIN_PASSWORD || await question('Enter password to test (or press Enter to skip): ');
    
    if (testPassword) {
      const user = await prisma.adminUser.findUnique({
        where: { email: testEmail }
      });

      if (user) {
        const isValid = await compare(testPassword, user.password);
        if (isValid) {
          console.log('✅ Password is correct!\n');
        } else {
          console.log('❌ Password is incorrect!\n');
          
          const reset = await question('Would you like to reset the password? (y/n): ');
          if (reset.toLowerCase() === 'y') {
            const newPassword = await question('Enter new password: ');
            const hashedPassword = await hash(newPassword, 10);
            
            await prisma.adminUser.update({
              where: { email: testEmail },
              data: { password: hashedPassword }
            });
            
            console.log('\n✅ Password reset successfully!');
            console.log('New password:', newPassword);
            console.log('⚠️  Please change the password after first login!\n');
          }
        }
      }
    }

    // Option to reset password for any admin
    const resetAny = await question('\nWould you like to reset password for any admin? (y/n): ');
    if (resetAny.toLowerCase() === 'y') {
      const emailToReset = await question('Enter email to reset: ');
      const adminToReset = await prisma.adminUser.findUnique({
        where: { email: emailToReset }
      });

      if (!adminToReset) {
        console.log('❌ Admin user not found!\n');
      } else {
        const newPassword = await question('Enter new password: ');
        const hashedPassword = await hash(newPassword, 10);
        
        await prisma.adminUser.update({
          where: { email: emailToReset },
          data: { password: hashedPassword }
        });
        
        console.log('\n✅ Password reset successfully!');
        console.log('Email:', emailToReset);
        console.log('New password:', newPassword);
        console.log('⚠️  Please change the password after first login!\n');
      }
    }
  }

  // Show environment variables
  console.log('\n📋 Current environment variables:');
  console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'not set (default: admin@txartgrants.com)');
  console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? '***set***' : 'not set (default: changeme123)');
  console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '***set***' : '❌ NOT SET (required!)');
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'not set');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    closeReadline();
  });

