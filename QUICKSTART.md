# Quick Start Guide

Get the grants4.art website running locally in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Google Gemini API key

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

Create `.env` and `.env.local` files:

**`.env`** (for Prisma):
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/txartgrants?schema=public"
```

**`.env.local`** (for Next.js):
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/txartgrants?schema=public"
GEMINI_API_KEY="your-gemini-api-key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
ADMIN_EMAIL="your-admin-email@example.com"
ADMIN_PASSWORD="your-secure-password-here"
```

### Get a Gemini API Key

1. Visit https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key to `.env.local`

### Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET` in `.env.local`

## Step 3: Set Up Database

### Option A: Local PostgreSQL

```bash
# Create database
createdb txartgrants

# Update DATABASE_URL in both .env files with your credentials
```

### Option B: Cloud Database (Supabase - Free)

1. Go to https://supabase.com
2. Create a new project
3. Copy the connection string from Settings > Database
4. Paste into both `.env` files

## Step 4: Run Migrations

```bash
npm run db:migrate
```

Press Enter when prompted to name the migration.

## Step 5: Create Admin User

```bash
npm run db:seed
```

This creates an admin user with credentials from your `.env.local`.

## Step 6: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Step 7: Login to Admin

1. Go to http://localhost:3000/admin/login
2. Login with:
   - Email: Value from `ADMIN_EMAIL` in `.env.local`
   - Password: Value from `ADMIN_PASSWORD` in `.env.local`

## Step 8: Add Your First Grant

### Option A: Manual Entry

1. In admin panel, click "Add New Grant"
2. Fill in the form:
   - Title: "Future Front Texas Micro-Grant"
   - Organization: "Future Front Texas"
   - Amount: "$1,000"
   - Location: "Austin, Texas"
   - Description: "Micro-grants for women and LGBTQ+ creatives"
   - Eligibility: "Must be women or LGBTQ+ creative professionals in Central Texas"
   - Application URL: "https://futurefronttexas.org/grants"
   - Tags: "emerging artists, micro-grant, Austin"
3. Set status to "Approved"
4. Click "Create Grant"

### Option B: Using the Scraper

1. In admin panel, click "Scrape Jobs"
2. Enter a grant URL: `https://futurefronttexas.org/grants`
3. Click "Scrape"
4. Review the extracted grant
5. Approve it in the dashboard

## Step 9: View Public Site

Visit http://localhost:3000 to see your grant(s) publicly displayed!

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Create/run migrations
npm run db:seed         # Seed admin user

# Other
npm run lint            # Run linter
```

## Troubleshooting

### "Module not found" errors

```bash
npm run db:generate
```

### Database connection fails

1. Verify PostgreSQL is running
2. Check DATABASE_URL format
3. Test connection: `psql $DATABASE_URL`

### Admin login doesn't work

1. Verify admin user was created: `npm run db:seed`
2. Check NEXTAUTH_SECRET is set
3. Clear browser cookies and try again

### Scraper returns "No grant found"

1. Verify GEMINI_API_KEY is set and valid
2. Try a different URL
3. Check Gemini API quota: https://console.cloud.google.com

## Next Steps

1. **Add more grants**: Use admin panel or scraper
2. **Customize design**: Edit Tailwind classes in components
3. **Add grant sources**: Update `scraper/scraper.py`
4. **Deploy to production**: See DEPLOYMENT.md

## Getting Help

- 📖 Read the full README.md
- 🚀 Check DEPLOYMENT.md for production setup
- 📝 Review PROJECT_SUMMARY.md for architecture details
- 🐛 Check logs in terminal for errors

## Sample Grant Data

For testing, here are some real Texas grant sources:

- Future Front Texas: https://futurefronttexas.org/grants
- Houston Arts Alliance: https://houstonartsalliance.com/grants/
- Austin ACME: https://www.austintexas.gov/acme/grants-funding
- Nasher Sculpture Center: https://www.nashersculpturecenter.org/programs-events/nasher-artist-grants

Try scraping these URLs to populate your database!

---

**You're all set!** 🎉

Your Texas Art Grants website is now running locally. Start adding grants and exploring the features.







