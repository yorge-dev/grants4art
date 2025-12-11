# Deployment Checklist

Use this checklist to ensure a smooth deployment of Texas Art Grants to production.

## Pre-Deployment Checklist

### Code Preparation

- [ ] All code is committed to Git
- [ ] Code is pushed to GitHub repository
- [ ] `.gitignore` is properly configured (no sensitive files committed)
- [ ] No `.env` files are in the repository
- [ ] `README.md` is up to date
- [ ] All dependencies are listed in `package.json`
- [ ] Build passes locally: `npm run build`
- [ ] No TypeScript errors: `npm run lint` (if configured)
- [ ] Prisma client generates successfully: `npx prisma generate`

### Environment Variables

- [ ] `DATABASE_URL` - Production PostgreSQL connection string
- [ ] `GEMINI_API_KEY` - Google Gemini API key (valid and has quota)
- [ ] `NEXTAUTH_URL` - Production URL (e.g., `https://yourdomain.vercel.app`)
- [ ] `NEXTAUTH_SECRET` - Strong random secret (generate with `openssl rand -base64 32`)
- [ ] `ADMIN_EMAIL` - Admin user email address
- [ ] `ADMIN_PASSWORD` - Strong admin password (change from default)

### Database Setup

- [ ] Production database created (Supabase/Railway/Neon)
- [ ] Database connection string copied
- [ ] Database allows connections from Vercel IPs (if firewall enabled)
- [ ] SSL connection enabled (if required)
- [ ] Database migrations ready: `prisma/migrations/` folder exists

### API Keys & Services

- [ ] Google Gemini API key obtained and tested
- [ ] API key has sufficient quota/credits
- [ ] API key is valid (test with `npm run test:gemini`)

### Documentation

- [ ] Deployment guide reviewed: [DEPLOYMENT.md](DEPLOYMENT.md)
- [ ] Environment variables documented: [ENV_TEMPLATE.md](ENV_TEMPLATE.md)
- [ ] Team members have access to documentation

## Deployment Steps

### 1. GitHub Repository

- [ ] Repository is public or team has access
- [ ] Main branch is protected (optional but recommended)
- [ ] Repository is ready for deployment

### 2. Vercel Setup

- [ ] Vercel account created ([vercel.com](https://vercel.com))
- [ ] GitHub account connected to Vercel
- [ ] New project created in Vercel dashboard
- [ ] Repository selected and imported

### 3. Environment Variables in Vercel

Add all required environment variables in Vercel dashboard (Settings → Environment Variables):

- [ ] `DATABASE_URL` added
- [ ] `GEMINI_API_KEY` added
- [ ] `NEXTAUTH_URL` added (use production URL after first deploy)
- [ ] `NEXTAUTH_SECRET` added
- [ ] `ADMIN_EMAIL` added
- [ ] `ADMIN_PASSWORD` added

**Note**: Set environment variables for **Production**, **Preview**, and **Development** environments as needed.

### 4. Deploy to Vercel

- [ ] Click **Deploy** in Vercel dashboard
- [ ] Wait for build to complete
- [ ] Note the deployment URL (e.g., `https://txartgrants.vercel.app`)

### 5. Update Environment Variables

- [ ] Update `NEXTAUTH_URL` with actual deployment URL
- [ ] Redeploy if `NEXTAUTH_URL` was changed

### 6. Database Migrations

Run migrations on production database:

```bash
# Option 1: Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Option 2: Direct connection
DATABASE_URL="your_production_connection_string" npx prisma migrate deploy
```

- [ ] Migrations executed successfully
- [ ] Database schema is up to date
- [ ] Verify tables exist: `Grant`, `AdminUser`, `ScrapeJob`, etc.

### 7. Seed Admin User

Create admin user in production database:

```bash
DATABASE_URL="your_production_connection_string" \
ADMIN_EMAIL="your_admin_email" \
ADMIN_PASSWORD="your_secure_password" \
npx tsx scripts/seed-admin.ts
```

- [ ] Admin user created successfully
- [ ] Can verify admin user exists in database

## Post-Deployment Verification

### Website Functionality

- [ ] Homepage loads correctly
- [ ] No console errors in browser
- [ ] CSS/styles load properly
- [ ] Images and assets load correctly
- [ ] Mobile responsive design works

### Grant Features

- [ ] Grant listing page loads
- [ ] Grant filters work (location, amount, etc.)
- [ ] Grant search functionality works
- [ ] Individual grant detail pages load
- [ ] Grant cards display correctly

### Admin Panel

- [ ] Can navigate to `/admin/login`
- [ ] Admin login works with production credentials
- [ ] Admin dashboard loads after login
- [ ] Can view grants list in admin
- [ ] Can create new grant manually
- [ ] Can edit existing grants
- [ ] Can delete grants
- [ ] Can access scrape jobs page

### API Endpoints

Test API endpoints (use browser dev tools or Postman):

- [ ] `GET /api/grants` - Returns grant list
- [ ] `GET /api/grants/[id]` - Returns specific grant
- [ ] `POST /api/grants` - Creates grant (admin only)
- [ ] `PATCH /api/grants/[id]` - Updates grant (admin only)
- [ ] `DELETE /api/grants/[id]` - Deletes grant (admin only)
- [ ] `POST /api/scrape` - Scrapes grant (admin only)

### Scraping Functionality

- [ ] Can submit URL for scraping
- [ ] Gemini API integration works
- [ ] Grant extraction completes
- [ ] Discovered grants appear in admin dashboard
- [ ] Can approve/reject discovered grants

### Database

- [ ] Database connection works
- [ ] Can read grants from database
- [ ] Can write grants to database
- [ ] Database queries perform well
- [ ] No connection errors in logs

### Authentication

- [ ] NextAuth session management works
- [ ] Admin login persists across page refreshes
- [ ] Logout functionality works
- [ ] Protected routes redirect correctly
- [ ] Unauthorized access is blocked

### Performance

- [ ] Page load times are acceptable (< 3 seconds)
- [ ] No slow database queries
- [ ] Images optimize correctly
- [ ] API responses are fast

### Security

- [ ] Environment variables are not exposed in client code
- [ ] Admin routes are protected
- [ ] API routes have proper authentication
- [ ] Database connection uses SSL
- [ ] Strong admin password is set
- [ ] `NEXTAUTH_SECRET` is a strong random string

## Monitoring Setup

### Vercel Analytics (Optional)

- [ ] Vercel Analytics enabled in dashboard
- [ ] Can view page views and performance metrics

### Error Tracking (Optional)

- [ ] Error tracking service configured (e.g., Sentry)
- [ ] Error notifications set up

### Database Monitoring

- [ ] Database provider dashboard accessible
- [ ] Can monitor connection count
- [ ] Can view query performance
- [ ] Storage usage is reasonable

## Post-Launch Tasks

### Immediate (First 24 Hours)

- [ ] Monitor error logs in Vercel dashboard
- [ ] Check database for any issues
- [ ] Test all critical user flows
- [ ] Verify admin can log in and manage grants
- [ ] Add at least one sample grant manually

### Short-term (First Week)

- [ ] Set up automated backups (if not automatic)
- [ ] Monitor API usage (Gemini API quota)
- [ ] Review and optimize slow queries
- [ ] Set up custom domain (if applicable)
- [ ] Configure DNS records for custom domain
- [ ] Update `NEXTAUTH_URL` if using custom domain

### Long-term (Ongoing)

- [ ] Regular database backups verified
- [ ] Monitor application performance
- [ ] Review and update dependencies
- [ ] Set up cron jobs for automated scraping (if needed)
- [ ] Document any deployment-specific configurations

## Troubleshooting Common Issues

### Build Fails

- Check Vercel build logs for specific errors
- Verify all environment variables are set
- Ensure `package.json` scripts are correct
- Test build locally: `npm run build`

### Database Connection Errors

- Verify `DATABASE_URL` is correct
- Check database firewall settings
- Ensure database allows connections from Vercel
- Test connection locally with production URL

### Admin Login Not Working

- Verify admin user exists in database
- Check `NEXTAUTH_SECRET` is set correctly
- Verify `NEXTAUTH_URL` matches deployment URL
- Check browser console for errors
- Clear browser cookies and try again

### API Errors

- Check Vercel function logs
- Verify API keys are valid
- Check API quotas/limits
- Review error messages in browser console

### Environment Variables Not Working

- Verify variables are set for correct environment (Production)
- Check variable names match exactly (case-sensitive)
- Redeploy after adding/changing variables
- Use Vercel CLI to verify: `vercel env pull .env.local`

## Rollback Plan

If deployment fails:

1. **Revert to previous deployment**:
   - Go to Vercel dashboard → Deployments
   - Find last working deployment
   - Click "..." → Promote to Production

2. **Fix issues locally**:
   - Test fixes in development
   - Commit and push fixes
   - Redeploy

3. **Database rollback** (if needed):
   - Restore from backup
   - Or manually revert migrations

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Project Deployment Guide](DEPLOYMENT.md)
- [GitHub Setup Guide](GITHUB_SETUP.md)

## Notes

- Keep this checklist updated as the project evolves
- Add project-specific items as needed
- Review before each major deployment
- Document any deployment-specific quirks or requirements


