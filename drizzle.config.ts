import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load .env.local first (what `vercel env pull` and Next.js write), then .env.
config({ path: ['.env.local', '.env'] });

export default defineConfig({
  schema: './app/_lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
});
