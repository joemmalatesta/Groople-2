# Groople 2 - Local Development Setup

This project uses SvelteKit 5, Drizzle ORM, and Supabase for local development.

## Prerequisites

- Node.js (v18 or higher)
- pnpm
- Docker Desktop

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with the following content:

```env
# Local Database
DATABASE_URL="postgresql://root:mysecretpassword@localhost:5432/local"

# Supabase (replace with your actual Supabase project values)
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### 2. Start Local Database

```bash
# Start Docker Desktop first, then run:
docker compose up -d

# Verify the database is running:
docker compose ps
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run Database Migrations

```bash
# Generate migration files
pnpm run db:generate

# Push schema to database
pnpm run db:push

# Or run migrations
pnpm run db:migrate
```

### 5. Start Development Server

```bash
pnpm run dev
```

Visit `http://localhost:5173` to see the test page.

## Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run db:start` - Start Docker database
- `pnpm run db:push` - Push schema changes to database
- `pnpm run db:generate` - Generate migration files
- `pnpm run db:migrate` - Run migrations
- `pnpm run db:studio` - Open Drizzle Studio

## Project Structure

```
src/
├── lib/
│   ├── server/
│   │   └── db/
│   │       ├── index.ts      # Database connection
│   │       └── schema.ts     # Drizzle schema
│   └── supabase/
│       ├── client.ts         # Client-side Supabase
│       └── server.ts         # Server-side Supabase
├── routes/
│   └── +page.svelte         # Test page
└── hooks.server.ts          # SvelteKit hooks
```

## Next Steps

1. Set up your Supabase project at https://supabase.com
2. Replace the placeholder environment variables with your actual Supabase credentials
3. Design your database schema in `src/lib/server/db/schema.ts`
4. Generate and run migrations as you develop
5. Use Drizzle Studio (`pnpm run db:studio`) to visualize your database

## Troubleshooting

- If Docker isn't running: Start Docker Desktop
- If database connection fails: Check if PostgreSQL container is running with `docker compose ps`
- If migrations fail: Ensure the database is running and the DATABASE_URL is correct
