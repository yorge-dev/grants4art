# Deployment Guide

This guide covers deploying the Texas Art Grants website to production.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- PostgreSQL database (Supabase, Railway, or Neon)
- Google Gemini API key

## Option 1: Vercel + Supabase (Recommended)

### Step 1: Set up Supabase Database

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Go to Settings > Database and copy the connection string
4. The connection string format is:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true
   ```

### Step 2: Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Configure environment variables in the Vercel dashboard:
   
   ```
   DATABASE_URL=your_supabase_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
   ADMIN_EMAIL=your_admin_email
   ADMIN_PASSWORD=your_secure_password
   ```

4. Deploy the project

### Step 3: Run Database Migrations

After deployment, run migrations using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Run migration script
vercel env pull .env.local
npx prisma migrate deploy
```

Or connect to your database directly and run:

```bash
DATABASE_URL="your_connection_string" npx prisma migrate deploy
```

### Step 4: Seed Admin User

Run the seed script with your production database:

```bash
DATABASE_URL="your_connection_string" \
ADMIN_EMAIL="your_email" \
ADMIN_PASSWORD="your_password" \
npx tsx scripts/seed-admin.ts
```

## Option 2: Vercel + Railway

### Step 1: Set up Railway Database

1. Go to [Railway](https://railway.app) and create a new project
2. Add a PostgreSQL database
3. Copy the connection string from the Variables tab
4. The format is:
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
   ```

### Step 2-4: Follow the same steps as Supabase above

Replace the DATABASE_URL with your Railway connection string.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `GEMINI_API_KEY` | Google Gemini API key | Get from [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `NEXTAUTH_URL` | Your production URL | `https://txartgrants.vercel.app` |
| `NEXTAUTH_SECRET` | Random secret for sessions | Generate: `openssl rand -base64 32` |
| `ADMIN_EMAIL` | Admin login email | `admin@yourdomain.com` |
| `ADMIN_PASSWORD` | Admin login password | Use a strong password |

## Post-Deployment

### 1. Verify Deployment

- Visit your site: `https://your-domain.vercel.app`
- Test the homepage loads
- Try filtering grants

### 2. Login to Admin

- Go to `/admin/login`
- Sign in with your admin credentials
- Verify the dashboard loads

### 3. Add Sample Grants

Option A: Manually add grants through the admin panel
- Navigate to Admin > Add New Grant
- Fill in the form
- Click "Create Grant"

Option B: Use the scraper
- Navigate to Admin > Scrape Jobs
- Enter a URL to a Texas grant page
- Review and approve the discovered grant

### 4. Set Up Cron Jobs (Optional)

For automated scraping, use Vercel Cron Jobs:

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Then create the cron endpoint at `app/api/cron/scrape/route.ts`.

## Troubleshooting

### Build Fails

1. Check that all environment variables are set
2. Verify Prisma generates successfully: `npm run db:generate`
3. Check TypeScript errors: `npm run build` locally

### Database Connection Issues

1. Verify connection string format
2. Check if your database accepts connections from all IPs (0.0.0.0/0)
3. For Supabase, use the connection pooling URL (with `?pgbouncer=true`)

### Admin Login Not Working

1. Verify admin user was seeded: check database directly
2. Check NEXTAUTH_SECRET is set
3. Verify NEXTAUTH_URL matches your domain
4. Check browser console for errors

### Scraping Not Working

1. Verify GEMINI_API_KEY is set and valid
2. Check API quota in Google Cloud Console
3. Test with a known grant page URL
4. Check application logs for errors

## Monitoring

### Vercel Analytics

Enable Vercel Analytics in your dashboard for:
- Page views
- Performance metrics
- User geography

### Database Monitoring

Check your database provider's dashboard for:
- Connection count
- Query performance
- Storage usage

### Error Tracking

Consider adding Sentry or similar:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

## Scaling

### Database

- Enable connection pooling (Supabase Pgbouncer or Railway Proxy)
- Add database indexes (already configured in schema)
- Consider read replicas for high traffic

### Caching

Add Redis caching for grant listings:

```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN
})
```

### CDN

Vercel automatically provides CDN for static assets.

## Backup

### Database Backups

- Supabase: Daily automatic backups (7 days retention on free tier)
- Railway: Configure automatic backups in settings

### Manual Backup

```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

## Custom Domain

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update NEXTAUTH_URL environment variable

## Security Checklist

- [ ] Changed default admin password
- [ ] NEXTAUTH_SECRET is a strong random string
- [ ] Database connection uses SSL
- [ ] Environment variables are not exposed in client code
- [ ] Rate limiting enabled on API routes
- [ ] CORS configured properly

## Support

For issues:
1. Check application logs in Vercel dashboard
2. Review database logs
3. Check GitHub issues
4. Contact support@yourdomain.com







