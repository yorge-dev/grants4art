# Texas Art Grants

A full-stack grants aggregation website for designers and artists in Texas, featuring AI-powered automated grant discovery, admin review workflow, and a clean public interface.

## 🚀 Quick Start

**New to the project? Start here:** [**QUICKSTART.md**](QUICKSTART.md)

Get up and running in 5 minutes with our step-by-step guide.

## ✨ Features

- **Public Grant Directory**: Searchable and filterable database of grant opportunities
- **AI-Powered Discovery**: Automated grant extraction using Google Gemini AI  
- **Admin Dashboard**: Review and approve grants before publication
- **Manual Entry**: Add grants manually through the admin interface
- **Scraping Tools**: Python scraper for scheduled automation
- **Responsive Design**: Mobile-friendly interface inspired by layoffs.fyi

## 🛠 Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with bcrypt
- **AI**: Google Gemini API for grant extraction
- **Deployment**: Vercel + Railway/Supabase

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[GITHUB_SETUP.md](GITHUB_SETUP.md)** - GitHub repository setup guide
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Architecture and technical details
- **[ENV_TEMPLATE.md](ENV_TEMPLATE.md)** - Environment variable reference
- **[scraper/README.md](scraper/README.md)** - Python scraper documentation

## 📦 GitHub Setup

**First time setting up Git and GitHub?** See [**GITHUB_SETUP.md**](GITHUB_SETUP.md) for detailed instructions.

### Quick Setup (if Git is already installed)

1. Initialize Git repository:
```bash
git init
```

2. Add all files:
```bash
git add .
```

3. Create initial commit:
```bash
git commit -m "Initial commit"
```

4. Create a new repository on GitHub (don't initialize with README)

5. Add remote and push:
```bash
git remote add origin https://github.com/yourusername/txartgrants.git
git branch -M main
git push -u origin main
```

For detailed instructions including Git installation, see [GITHUB_SETUP.md](GITHUB_SETUP.md).

## Getting Started (Detailed)

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Gemini API key

### Installation

1. Clone the repository:

```bash
cd txartgrants
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create `.env.local` and `.env` files based on `ENV_TEMPLATE.md`:

```bash
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/txartgrants?schema=public"
GEMINI_API_KEY="your-gemini-api-key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
ADMIN_EMAIL="admin@txartgrants.com"
ADMIN_PASSWORD="changeme123"

# .env
DATABASE_URL="postgresql://user:password@localhost:5432/txartgrants?schema=public"
```

4. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. Seed the admin user:

```bash
npx tsx scripts/seed-admin.ts
```

6. Start the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Public Site

- Visit the homepage to browse available grants
- Use filters to search by location, amount, category, and keywords
- Click on a grant to view full details

### Admin Panel

1. Navigate to `/admin/login`
2. Sign in with the admin credentials from `.env.local`
3. Use the dashboard to:
   - Review pending grants discovered by the scraper
   - Manually add new grants
   - Edit or delete existing grants
   - Manage scrape jobs

### Grant Scraping

1. Go to Admin > Scrape Jobs
2. Enter a URL to a grant opportunity page
3. The AI will extract and validate grant information
4. Review and approve the discovered grant in the dashboard

## Database Schema

### Grant
- Core grant information (title, organization, amount, deadline, etc.)
- Status workflow (PENDING → APPROVED/REJECTED)
- Tags for categorization

### AdminUser
- Admin authentication and authorization

### ScrapeJob
- Track automated scraping attempts
- Link discovered grants to their source

## API Routes

- `GET /api/grants` - List grants (with filters)
- `POST /api/grants` - Create grant
- `GET /api/grants/[id]` - Get grant details
- `PATCH /api/grants/[id]` - Update grant
- `DELETE /api/grants/[id]` - Delete grant
- `POST /api/scrape` - Trigger grant scraping
- `GET /api/scrape` - List scrape jobs

## Deployment

### Vercel + Supabase/Railway

1. Create a PostgreSQL database on Supabase or Railway
2. Deploy to Vercel:
   - Connect your GitHub repository
   - Add environment variables
   - Deploy

3. Run migrations on production database:

```bash
npx prisma migrate deploy
```

4. Seed admin user on production:

```bash
npx tsx scripts/seed-admin.ts
```

## Development

### Project Structure

```
txartgrants/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage
│   ├── grants/[id]/       # Grant detail pages
│   ├── admin/             # Admin panel
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities and helpers
├── prisma/                # Database schema
└── scripts/               # Database seed scripts
```

### Key Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npx prisma studio    # Open Prisma Studio (DB GUI)
npx prisma migrate   # Create/run migrations
```

## Contributing

This project is designed to be maintainable and extensible. Key areas for contribution:

- Additional scraping sources
- Enhanced AI extraction prompts
- More filter options
- Email notifications
- Grant calendar view

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
