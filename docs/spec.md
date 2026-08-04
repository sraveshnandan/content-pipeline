# AI-Powered Content Creator Platform — Technical Specifications

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/auth/login` | None | Redirect to Clerk Google OAuth |
| GET | `/api/auth/callback` | None | Clerk callback, creates session |
| GET | `/api/auth/logout` | Session | Clears session, redirects to home |
| GET | `/api/auth/me` | Session | Returns current user + subscription tier |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me` | Session | Returns user profile |
| PUT | `/api/users/me` | Session | Updates user profile |

### Social Connections

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/social/connections` | Session | List all connected social accounts |
| POST | `/api/social/connect/:platform` | Session | Initiate Zernio OAuth flow for platform |
| GET | `/api/social/connect/:platform/callback` | None | Zernio OAuth callback, stores tokens |
| DELETE | `/api/social/connections/:id` | Session | Disconnect social account |
| GET | `/api/social/connections/:id/status` | Session | Check connection health |

### Generations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/generations` | Session | Create a new generation (text or image) |
| GET | `/api/generations` | Session | List user's generations (paginated) |
| GET | `/api/generations/:id` | Session | Get generation result |
| GET | `/api/generations/:id/status` | Session | Poll generation status |

### Posts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/posts` | Session | Create a post (draft, scheduled, or immediate) |
| GET | `/api/posts` | Session | List user's posts (filterable by status/platform) |
| GET | `/api/posts/:id` | Session | Get post details |
| PUT | `/api/posts/:id` | Session | Update post (edit content, reschedule) |
| DELETE | `/api/posts/:id` | Session | Delete a draft post |
| POST | `/api/posts/:id/publish` | Session | Publish a scheduled post immediately |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/posts` | Session | Get analytics for user's posts (date range) |
| GET | `/api/analytics/summary` | Session | Get aggregated analytics summary |

### Quota

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/quota` | Session | Get current quota usage for user |

## Auth Middleware

All authenticated endpoints use Clerk session verification:

```typescript
// Fastify decorator
fastify.decorate('auth', async (request) => {
  const session = await request.clerk.getSession()
  if (!session) {
    throw new UnauthorizedError('No active session')
  }
  const user = await fastify.db.getUserByClerkId(session.userId)
  if (!user) {
    throw new NotFoundError('User not found')
  }
  request.user = user
  request.subscription = await fastify.db.getSubscription(user.id)
})
```

## Error Response Format

```json
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Image generation limit reached for your tier",
    "details": {
      "limit": 2,
      "used": 2,
      "resetAt": "2026-09-01T00:00:00Z"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | No valid Clerk session |
| `FORBIDDEN` | 403 | User lacks permission for this action |
| `NOT_FOUND` | 404 | Resource not found |
| `QUOTA_EXCEEDED` | 429 | User has exceeded their tier limit |
| `VALIDATION_ERROR` | 422 | Request body validation failed |
| `GENERATION_FAILED` | 502 | LLM or image API returned an error |
| `POSTING_FAILED` | 502 | Zernio API returned an error |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Database Schema

### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
```

### social_connections

```sql
CREATE TABLE social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  zernio_account_id TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX idx_social_connections_platform ON social_connections(platform);
CREATE UNIQUE INDEX idx_social_connections_user_platform ON social_connections(user_id, platform);
```

### posts

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]',
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram')),
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  generation_id UUID REFERENCES generations(id),
  zernio_post_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
```

### generations

```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  output TEXT,
  type TEXT NOT NULL CHECK (type IN ('text', 'image')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  model_used TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_status ON generations(status);
```

### subscriptions

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro')),
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
```

### analytics

```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram')),
  impressions INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_post_id ON analytics(post_id);
```

### quotas

```sql
CREATE TABLE quotas (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro')),
  text_generations_used INTEGER NOT NULL DEFAULT 0,
  image_generations_used INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Subscription Enforcement Rules

### Quota Limits

| Tier | Text Generations | Image Generations/Post | Scheduling | Analytics |
|------|-----------------|----------------------|------------|-----------|
| Free | Unlimited | 2/post | ✅ | Basic |
| Pro | Unlimited | Unlimited | ✅ | Advanced |

### Enforcement Logic

1. **On generation request**: Check `quotas` table for current period usage
2. **For image generation on free tier**: If `image_generations_used >= 2` per post, reject with `QUOTA_EXCEEDED`
3. **For text generation**: No quota limit on any tier
4. **Quota reset**: At the start of each billing period (monthly), reset counters to 0
5. **Redis hot path**: Before hitting Postgres, check Redis counter. If Redis counter >= limit, reject immediately without DB query
6. **Redis → Postgres sync**: Every 5 minutes, flush Redis counters to Postgres as the source of truth

### Tier Gating

```typescript
async function checkQuota(userId: string, type: 'text' | 'image', count: number = 1) {
  // 1. Check Redis hot counter
  const redisKey = `quota:${userId}:${type === 'image' ? 'images' : 'text'}`
  const current = await fastify.redis.incrby(redisKey, count)

  // 2. Get user tier
  const user = await fastify.db.getUser(userId)
  if (user.subscription_tier === 'pro') return true // Pro has no limits

  // 3. Check against free tier limits
  if (type === 'image' && current > 2) {
    await fastify.redis.decrby(redisKey, count) // Rollback
    throw new QuotaExceededError('Image generation limit: 2/post on free tier')
  }

  return true
}
```

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/generations` | 10/minute | Sliding window |
| `/api/posts` | 30/minute | Sliding window |
| `/api/auth/*` | 5/minute | Sliding window |
| `/api/social/connect/*` | 3/minute | Sliding window |

Rate limiting is implemented via Redis sliding window counters, keyed by `user_id` (authenticated) or `ip` (unauthenticated).

## Zernio Integration

### Connection Flow
1. User clicks "Connect LinkedIn" or "Connect Instagram" in dashboard
2. Backend calls `GET /v1/connect/{platform}` via Zernio SDK with profile ID
3. Zernio returns `authUrl` — frontend redirects user to this URL
4. User authorizes on Zernio's hosted UI
5. Zernio redirects back to `/api/social/connect/:platform/callback` with auth code
6. Backend exchanges code for tokens via Zernio SDK
7. Tokens stored in `social_connections` table
8. Connection status updated in dashboard

### Posting Flow
1. User clicks "Post Now" or "Schedule" on a generation result
2. Backend validates user has an active social connection for the target platform
3. Backend calls Zernio `POST /v1/post` with content, platform, and scheduling params
4. Zernio returns post ID and status
5. Backend stores `zernio_post_id` and status in `posts` table
6. For scheduled posts, Inngest creates a timed trigger to fire at `scheduled_at`
7. On publish, Zernio webhook (or polling fallback) updates post status to `posted`

### Zernio SDK Usage
```typescript
import { Zernio } from '@zernio/node'

const zernio = new Zernio({
  apiKey: process.env.ZERNIO_API_KEY,
})

// Connect account
const { authUrl } = await zernio.connect.getConnectUrl({
  path: { platform: 'linkedin' },
  query: { profileId: profileId },
})

// Create post
const post = await zernio.posts.create({
  body: {
    content: generatedContent,
    platforms: [{ platform: 'linkedin', accountId: accountId }],
    publishNow: true,
  },
})
```