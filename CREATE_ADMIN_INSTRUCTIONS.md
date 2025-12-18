# How to Create Admin User in Production

Follow these steps to create the admin user in your production database.

## Step 1: Get Your Production DATABASE_URL

You have two options:

### Option A: From Vercel Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Select your project (`grants4art`)
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL` in the list
5. Click the **eye icon** to reveal the value
6. Copy the entire connection string

### Option B: From Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **Connection string** section
5. Copy the **URI** connection string
6. It should look like: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

## Step 2: Run the Script

Open your terminal/command prompt in the project directory and run:

### On Windows (PowerShell):

```powershell
$env:DATABASE_URL="your-production-database-url-here"
$env:ADMIN_EMAIL="admin@yorge.net"
$env:ADMIN_PASSWORD="Sacirema@-97"
npx tsx scripts/create-prod-admin.ts
```

### On Windows (Command Prompt):

```cmd
set DATABASE_URL=your-production-database-url-here
set ADMIN_EMAIL=admin@yorge.net
set ADMIN_PASSWORD=Sacirema@-97
npx tsx scripts/create-prod-admin.ts
```

### On Mac/Linux:

```bash
DATABASE_URL="your-production-database-url-here" \
ADMIN_EMAIL="admin@yorge.net" \
ADMIN_PASSWORD="Sacirema@-97" \
npx tsx scripts/create-prod-admin.ts
```

## Step 3: Replace the Placeholder

**Important**: Replace `your-production-database-url-here` with the actual DATABASE_URL you copied in Step 1.

**Example** (your actual URL will be different):
```powershell
$env:DATABASE_URL="postgresql://postgres:9lsuSgCi0x8ggCS8@db.wpnmmpvjfnhkkijbfgkm.supabase.co:5432/postgres?schema=public"
$env:ADMIN_EMAIL="admin@yorge.net"
$env:ADMIN_PASSWORD="Sacirema@-97"
npx tsx scripts/create-prod-admin.ts
```

## Step 4: Verify Success

You should see output like:

```
🔧 Creating/updating admin user in production...

Email: admin@yorge.net
DATABASE_URL: postgresql://postgres:9lsuSgCi0x8gg...

✅ Database connection successful

✅ Admin user created successfully!

📋 Admin user details:
  Email: admin@yorge.net
  Role: SUPER_ADMIN

✅ You can now login with these credentials!
```

## Step 5: Test Login

1. Go to your production site: `https://your-domain.vercel.app/admin/login`
2. Login with:
   - **Email**: `admin@yorge.net`
   - **Password**: `Sacirema@-97`

## Troubleshooting

### Error: "DATABASE_URL environment variable is required"
- Make sure you set the environment variable correctly
- On Windows PowerShell, use `$env:VARIABLE_NAME="value"`
- On Windows CMD, use `set VARIABLE_NAME=value`
- On Mac/Linux, use `VARIABLE_NAME="value"`

### Error: "Connection refused" or "Connection timeout"
- Check that your DATABASE_URL is correct
- Verify your Supabase database is not paused (free tier pauses after inactivity)
- Make sure your IP is allowed (Supabase should allow all by default)

### Error: "User already exists"
- The script will update the password if the user exists
- This is normal and means the user was created successfully

### Script runs but login still doesn't work
- Check Vercel environment variables are set correctly
- Verify `NEXTAUTH_SECRET` is set in Vercel
- Check Vercel function logs for authentication errors
- Make sure you're using the production URL, not localhost

## Alternative: Using Vercel CLI

If you have Vercel CLI installed:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Pull production environment variables
vercel env pull .env.local

# The script will automatically use DATABASE_URL from .env.local
ADMIN_EMAIL="admin@yorge.net" \
ADMIN_PASSWORD="Sacirema@-97" \
npx tsx scripts/create-prod-admin.ts
```

This method is easier because it automatically gets the DATABASE_URL from Vercel!


