# Content Pipeline

AI-powered content creation platform for social media creators.

## Tech Stack

- **Frontend**: Next.js (App Router)
- **Backend**: Fastify with dependency injection
- **Database**: PostgreSQL + Redis
- **Auth**: Clerk (Google OAuth)
- **LLM**: Groq for text generation
- **Images**: Gemini Pro via Nano Banana
- **Background Jobs**: Inngest
- **Social API**: Zernio

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose

### Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

2. Start databases:
   ```bash
   npm run docker:up
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

5. Start development:
   ```bash
   npm run dev
   ```

### Environment Variables

See `.env.example` for all required variables.

## Project Structure

```
apps/
  web/          Next.js frontend
  api/          Fastify backend
packages/
  db/           Database models & migrations (Drizzle)
  shared/       Shared types & validation (Zod)
  infra/        Infrastructure (Inngest, Redis client)
docs/
  context.md    Architecture decisions & scope
  spec.md       Technical specifications
  prog.md       Live progress tracker
```

## Development

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- Inngest Dashboard: `http://localhost:8288`

## Deployment

See `docs/deployment.md` for production deployment instructions.