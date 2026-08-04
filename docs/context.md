# AI-Powered Content Creator Platform — Architecture & Context

## System Overview

A full-stack SaaS platform where social media creators sign in, connect social handles, generate AI content, edit it, and post directly to their accounts. The platform is built for speed and investor-readiness on a tight timeline.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Next.js Frontend│────▶│  Fastify Backend  │────▶│  PostgreSQL      │
│  (App Router)    │     │  (DI architecture)│     │  + Redis         │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
         ┌──────────┐    ┌────────────┐    ┌─────────────┐
         │  Clerk   │    │   Inngest   │    │  Zernio API │
         │ (Auth)   │    │ (Jobs/Sched)│    │ (Social)    │
         └──────────┘    └────────────┘    └─────────────┘
              │                  │
              ▼                  ▼
         ┌──────────┐    ┌────────────┐
         │ Groq     │    │ Gemini Pro │
         │ (Text LLM)│    │ (Images)   │
         └──────────┘    └────────────┘
```

## Data Flow

### Authentication Flow
1. User signs in via Google OAuth on Next.js frontend (Clerk Hosted UI)
2. Clerk creates session, sends session token on every API request
3. Fastify backend verifies Clerk token via Clerk SDK middleware
4. Backend looks up/creates user in Postgres, attaches subscription context
5. Subscription tier is fetched from Clerk metadata + custom `subscriptions` table
6. All subsequent requests carry auth context through Fastify request object

### Content Generation Flow
1. User submits prompt + post count (1–5) + image toggle in Next.js
2. Request hits Fastify endpoint (Clerk auth middleware)
3. Backend validates subscription tier + quota (Redis counter first, Postgres source of truth)
4. For text: backend calls Groq API directly (fast, <10s) or queues via Inngest for async
5. For images: backend calls Gemini Pro via Nano Banana
6. Generation result stored in `generations` table in Postgres
7. Frontend polls or uses WebSocket for generation status
8. User reviews/edits in content editor (inline or modal)
9. User clicks "Post Now" or "Schedule" → backend calls Zernio API
10. Post status tracked in `posts` table, analytics stored in `analytics` table

## Technology Choices & Sequencing Trade-offs

### Why Each Choice

| Technology | Why | Speed Trade-off |
|------------|-----|-----------------|
| **Fastify** | Minimal overhead, built-in DI via decorators, fastest Node.js framework | Requires more setup than Express but pays off in maintainability |
| **Next.js App Router** | SSR/SSG for SEO, file-based routing, React Server Components | App Router is still evolving but is the current standard |
| **Clerk** | Google OAuth out of the box, session management, subscription metadata | Vendor lock-in but saves weeks of auth infrastructure |
| **Zernio** | Single API for 15+ social platforms, handles OAuth flows, posting, analytics | Abstraction layer adds slight latency but eliminates multi-integration complexity |
| **Groq** | Fastest LLM inference (up to 800 tokens/sec), cost-effective | Text-only, no image generation — pairs with Gemini for images |
| **Gemini Pro (Nano Banana)** | High-quality image generation, integrated with Google ecosystem | Slower than Groq for text, but image generation is inherently async |
| **Inngest** | Managed background jobs, scheduling, retries, webhook processing | Adds a third-party dependency but eliminates job queue infrastructure work |
| **PostgreSQL + Redis** | Postgres for persistent data, Redis for hot counters and caching | Two databases to manage but clear separation of concerns |
| **Dependency Injection** | Testability, decoupled services, clean architecture | Slightly more boilerplate upfront, pays off in maintainability |

### Sequencing Trade-offs for Speed

1. **Inngest early, everything else depends on it**: Inngest setup is the highest-leverage early investment. It unblocks generation jobs, scheduling, and webhook processing. Start it in Phase 1 even if no jobs are queued yet.

2. **Zernio connection can run parallel to auth**: The Zernio OAuth flow is independent of Clerk auth setup. Both can be built concurrently.

3. **Text generation before image generation**: Text-only posting ships in Phase 4. Image generation (Phase 5) is a separate integration that doesn't block posting logic.

4. **Chatbot is a fast-follow, not MVP**: The research chatbot adds value but is not blocking. It ships in Phase 6 after core posting works.

5. **Polish incrementally, not at the end**: Error handling, logging, and monitoring are added throughout the build, not saved for a final pass. This prevents a big-bang polish phase that delays shipping.

## Subscription Tiers & Feature Matrix

| Feature | Free (Default) | Pro |
|---------|---------------|-----|
| Google OAuth signin | ✅ | ✅ |
| LinkedIn connection | ✅ | ✅ |
| Instagram connection | ✅ | ✅ |
| AI post generation (text) | ✅ | ✅ |
| Post count (1–5 per generation) | ✅ | ✅ |
| Image generation | 2/post | Unlimited |
| Direct posting | ✅ | ✅ |
| Scheduling | ✅ | ✅ |
| Post analytics | Basic | Advanced |
| Generation history | ✅ | ✅ |
| Content editor | ✅ | ✅ |
| Brainstorming chatbot | ❌ | ✅ |
| Priority generation queue | ❌ | ✅ |

## Assumptions & Constraints

- **Greenfield project**: No existing codebase or infrastructure
- **Single developer or small team**: Architecture prioritizes simplicity over scale
- **Tight timeline**: Speed to market is the primary constraint; feature completeness is secondary
- **Clerk handles subscription metadata**: We store tier in both Clerk and our own `subscriptions` table for flexibility
- **Zernio handles all social OAuth**: We don't implement platform-specific OAuth flows ourselves
- **Groq is text-only**: Image generation is handled by Gemini Pro via Nano Banana
- **Redis is for hot state only**: No Redis persistence needed; all critical data lives in Postgres
- **Production deployment**: Docker Compose for local, cloud provider (Vercel + Railway/Render) for production

## Key Architectural Decisions

1. **DI via Fastify decorators**: Services are registered as Fastify decorators (`fastify.db`, `fastify.redis`, `fastify.zernio`). This keeps the codebase testable and decoupled without heavy framework overhead.

2. **Redis for quota counters, not Postgres**: Quota checks happen on every generation request. Using Redis counters avoids a database hit per request. Postgres is the source of truth and is reconciled periodically.

3. **Inngest for all async work**: Even text generation could be async. Using Inngest from the start means we don't need to refactor when scheduling and webhooks are added.

4. **Zernio as the single social API**: Rather than building separate LinkedIn and Instagram integrations, Zernio abstracts all platforms behind a single API. This is a deliberate trade-off — we accept Zernio as a dependency in exchange for not building and maintaining 15+ OAuth integrations.

5. **App Router for Next.js**: The App Router is the current standard and supports React Server Components, which reduce client-side JavaScript. This is the right choice for a new project.