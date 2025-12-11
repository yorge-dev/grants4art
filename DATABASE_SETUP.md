# Database Setup Guide

This guide will help you set up your PostgreSQL database for the Texas Art Grants project.

## Option 1: Supabase (Recommended - Free & Easy)

### Step 1: Create a Supabase Account
1. Go to https://supabase.com
2. Sign up for a free account
3. Click "New Project"
4. Fill in:
   - Project Name: `txartgrants` (or any name)
   - Database Password: Create a strong password (save this!)
   - Region: Choose closest to you
5. Click "Create new project" (takes 1-2 minutes)

### Step 2: Get Your Database URL
1. Once your project is ready, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. Copy the **URI** connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
4. Replace `[YOUR-PASSWORD]` with the password you created

### Step 3: Update Your .env Files
Update both `.env.local` and `.env` with your Supabase connection string:

```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?schema=public"
```

## Option 2: Railway (Alternative Cloud Option)

1. Go to https://railway.app
2. Sign up/login
3. Click "New Project" → "Provision PostgreSQL"
4. Click on the PostgreSQL service → "Connect" tab
5. Copy the **Postgres Connection URL**
6. Update your `.env` files with this URL

## Option 3: Local PostgreSQL

### Install PostgreSQL
1. Download from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the `postgres` user

### Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE txartgrants;

# Exit
\q
```

### Update .env Files
```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/txartgrants?schema=public"
```

## Next Steps

After setting up your database URL:

1. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

2. **Run Migrations (creates tables):**
   ```bash
   npm run db:migrate
   ```

3. **Seed Admin User:**
   ```bash
   npm run db:seed
   ```

4. **Verify Setup:**
   ```bash
   npx prisma studio
   ```
   This opens a visual database browser at http://localhost:5555

## Troubleshooting

### Connection Errors
- Make sure your DATABASE_URL is correct
- Check that your database is running (for local)
- Verify firewall/network settings (for cloud)

### Migration Errors
- Ensure the database exists
- Check that DATABASE_URL has correct permissions
- Try: `npx prisma migrate reset` (⚠️ deletes all data)

### Prisma Client Errors
- Run `npm run db:generate` after schema changes
- Delete `node_modules/.prisma` and regenerate if needed

## Quick Test

After setup, test your connection:
```bash
npx prisma db pull
```

This should connect successfully without errors.

