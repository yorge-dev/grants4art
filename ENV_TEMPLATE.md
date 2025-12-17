# Environment Variables Template

Copy this to `.env.local` and `.env` files and fill in your values.

## .env.local (for Next.js)

```
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/txartgrants?schema=public"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key-here"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here-change-in-production"

# Admin
ADMIN_EMAIL="your-admin-email@example.com"
ADMIN_PASSWORD="your-secure-password-here"
```

## .env (for Prisma)

```
DATABASE_URL="postgresql://user:password@localhost:5432/txartgrants?schema=public"
```

## How to get API keys

1. **Gemini API Key**: Visit https://makersuite.google.com/app/apikey
2. **NextAuth Secret**: Generate with `openssl rand -base64 32`







