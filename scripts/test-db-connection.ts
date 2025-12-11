import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Try to connect
    await prisma.$connect();
    console.log('✅ Successfully connected to database!');
    
    // Try a simple query to check if tables exist
    try {
      const count = await prisma.grant.count();
      console.log(`✅ Database tables exist. Found ${count} grants.`);
    } catch (error: any) {
      if (error.message.includes('does not exist') || error.message.includes('relation')) {
        console.log('⚠️  Database connected but tables do not exist yet.');
        console.log('   Please run: npm run db:migrate');
      } else {
        throw error;
      }
    }
    
    await prisma.$disconnect();
    console.log('✅ Connection test completed successfully!');
  } catch (error: any) {
    console.error('❌ Database connection failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.error('\n   Possible issues:');
      console.error('   - Database server is not running');
      console.error('   - DATABASE_URL is incorrect');
      console.error('   - Network/firewall blocking connection');
    } else if (error.message.includes('authentication') || error.message.includes('password')) {
      console.error('\n   Possible issues:');
      console.error('   - Database credentials are incorrect');
      console.error('   - Check your DATABASE_URL in .env.local');
    }
    
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

testConnection();








