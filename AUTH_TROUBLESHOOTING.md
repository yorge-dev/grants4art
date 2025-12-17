# Admin Login Troubleshooting Guide

If admin login is not working, follow these steps:

## 1. Verify Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Ensure these are set:
- `DATABASE_URL` - Your Supabase connection string
- `NEXTAUTH_SECRET` - A random secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your production URL (e.g., `https://your-domain.vercel.app`)
- `ADMIN_EMAIL` - Admin email (e.g., `admin@yorge.net`)
- `ADMIN_PASSWORD` - Admin password

**Important**: After adding/changing environment variables, you MUST redeploy!

## 2. Verify Admin User Exists in Database

The admin user must exist in your production database. To create/reset it:

```bash
# Set environment variables for production
export DATABASE_URL="your-production-database-url"
export ADMIN_EMAIL="admin@yorge.net"
export ADMIN_PASSWORD="Sacirema@-97"

# Run the reset script
npm run db:reset-admin
```

Or use Vercel CLI:
```bash
vercel env pull .env.local
npm run db:reset-admin
```

## 3. Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Go to "Functions" tab
4. Click on `/api/auth/[...nextauth]`
5. Check the logs for errors

Look for:
- `[Auth] Missing credentials` - Form not submitting correctly
- `[Auth] DATABASE_URL is not set` - Environment variable missing
- `[Auth] User not found` - Admin user doesn't exist
- `[Auth] Invalid password` - Password mismatch
- Database connection errors

## 4. Test Database Connection

Create a test script to verify database connection:

```typescript
// scripts/test-prod-db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    const users = await prisma.adminUser.findMany();
    console.log('Admin users:', users);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
```

Run with production DATABASE_URL:
```bash
DATABASE_URL="your-prod-url" npx tsx scripts/test-prod-db.ts
```

## 5. Common Issues

### Issue: "Invalid email or password" but credentials are correct
**Solution**: 
- Check that admin user exists in production database
- Verify password hash matches (run `npm run db:reset-admin` with production DATABASE_URL)
- Check NEXTAUTH_SECRET is set correctly

### Issue: Database connection timeout
**Solution**:
- Verify DATABASE_URL is correct
- Check Supabase connection settings
- Ensure database is not paused (Supabase free tier pauses after inactivity)

### Issue: Session not persisting
**Solution**:
- Verify NEXTAUTH_URL matches your production domain exactly
- Check NEXTAUTH_SECRET is set
- Clear browser cookies and try again

## 6. Quick Fix: Reset Admin Password

If you need to reset the admin password in production:

```bash
# Pull production environment variables
vercel env pull .env.local

# Reset admin password
npm run db:reset-admin

# Or manually set and run
export DATABASE_URL="your-production-database-url"
export ADMIN_EMAIL="admin@yorge.net"
export ADMIN_PASSWORD="Sacirema@-97"
npm run db:reset-admin
```

## 7. Verify NextAuth Configuration

Check that `lib/auth.ts` has:
- Correct provider configuration
- Proper callbacks for JWT and session
- NEXTAUTH_SECRET is being read from environment

## 8. Check Browser Console

Open browser DevTools → Console and look for:
- Network errors when submitting login form
- CORS errors
- JavaScript errors

## 9. Test Login Flow Manually

1. Open browser DevTools → Network tab
2. Try to login
3. Check the request to `/api/auth/callback/credentials`
4. Look at the response - it should return success or error details

## 10. Force Redeploy

After making any changes:
1. Commit and push changes
2. Go to Vercel Dashboard → Deployments
3. Click "Redeploy" on latest deployment
4. Wait for build to complete
5. Test login again

## Still Not Working?

1. Check Vercel function logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure admin user exists in production database
4. Test database connection separately
5. Check Supabase dashboard for connection issues
