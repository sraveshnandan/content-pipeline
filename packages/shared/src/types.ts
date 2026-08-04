export type SubscriptionTier = "free" | "pro"

export type PostStatus = "draft" | "scheduled" | "posted" | "failed"

export type GenerationType = "text" | "image"

export type GenerationStatus = "pending" | "completed" | "failed"

export type Platform = "linkedin" | "instagram"

export interface User {
  id: string
  clerkUserId: string
  email: string
  name: string | null
  avatarUrl: string | null
  subscriptionTier: SubscriptionTier
  createdAt: Date
  updatedAt: Date
}

export interface SocialConnection {
  id: string
  userId: string
  platform: Platform
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
  zernioAccountId: string | null
  connectedAt: Date
  updatedAt: Date
}

export interface Post {
  id: string
  userId: string
  status: PostStatus
  content: string
  mediaUrls: string[]
  platform: Platform
  scheduledAt: Date | null
  postedAt: Date | null
  generationId: string | null
  zernioPostId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Generation {
  id: string
  userId: string
  prompt: string
  output: string | null
  type: GenerationType
  status: GenerationStatus
  modelUsed: string | null
  metadata: Record<string, unknown>
  createdAt: Date
}

export interface Subscription {
  id: string
  userId: string
  tier: SubscriptionTier
  stripeSubscriptionId: string | null
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Analytics {
  id: string
  userId: string
  postId: string | null
  platform: Platform
  impressions: number
  engagement: number
  reach: number
  clicks: number
  createdAt: Date
}

export interface Quota {
  userId: string
  tier: SubscriptionTier
  textGenerationsUsed: number
  imageGenerationsUsed: number
  periodStart: Date
  periodEnd: Date
  updatedAt: Date
}

export interface CreateGenerationInput {
  prompt: string
  type: GenerationType
  model?: string
}

export interface CreatePostInput {
  content: string
  platform: Platform
  mediaUrls?: string[]
  scheduledAt?: Date
  generationId?: string
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}