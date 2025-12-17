# Triggering Vercel Rebuild

If your mobile layout fixes are showing locally but not on the live site, follow these steps:

## Option 1: Trigger Rebuild via Vercel Dashboard (Recommended)

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (`grants4art` or similar)
3. Go to the **Deployments** tab
4. Find the latest deployment
5. Click the **"..."** menu (three dots) next to the deployment
6. Select **"Redeploy"**
7. Confirm the redeploy

## Option 2: Push an Empty Commit to Trigger Rebuild

```bash
git commit --allow-empty -m "Trigger Vercel rebuild for mobile layout fixes"
git push origin main
```

## Option 3: Use Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project (if not already linked)
vercel link

# Trigger a new deployment
vercel --prod
```

## Option 4: Clear Browser Cache

After rebuilding, clear your browser cache:
- **Chrome/Edge**: Ctrl+Shift+Delete → Clear cached images and files
- **Firefox**: Ctrl+Shift+Delete → Cached Web Content
- Or use **Incognito/Private mode** to test without cache

## Verify Mobile Layout Changes

The mobile layout fixes include:
- Responsive flex layout: `flexDirection: 'column'` on mobile, `md:flex-row` on desktop
- Full width filters on mobile: `w-full md:w-auto`
- Sticky sidebar on desktop: `md:max-w-[240px]`

These changes are in:
- `app/page.tsx` (main layout)
- `components/GrantFilters.tsx` (filter component)

## Check Build Logs

If rebuild doesn't work:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Check the **Build Logs** for any errors
4. Look for Tailwind CSS compilation errors

## Force Cache Clear on Vercel

If changes still don't appear:
1. Vercel Dashboard → Settings → General
2. Scroll to "Build & Development Settings"
3. Check "Override" settings
4. Add build command: `npm run build`
5. Redeploy
