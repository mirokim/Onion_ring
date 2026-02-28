import { z } from 'zod'

// ── API Provider Configuration ──

export const ProviderConfigSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().or(z.literal('')),
  model: z.string().or(z.literal('')),
})

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>

// ── Settings Configuration ──

export const SettingsConfigSchema = z.object({
  openai: ProviderConfigSchema,
  anthropic: ProviderConfigSchema,
  gemini: ProviderConfigSchema,
  xai: ProviderConfigSchema,
  theme: z.enum(['light', 'dark']).default('dark'),
})

export type SettingsConfig = z.infer<typeof SettingsConfigSchema>

// ── Debate Mode ──

export const DiscussionModeSchema = z.enum([
  'roundRobin',
  'freeDiscussion',
  'roleAssignment',
  'battle',
  'artworkEval',
])

export type DiscussionMode = z.infer<typeof DiscussionModeSchema>

// ── Pacing ──

export const PacingModeSchema = z.enum(['auto', 'manual'])
export const PacingConfigSchema = z.object({
  mode: PacingModeSchema,
  autoDelaySeconds: z.number().min(5).max(60).default(5),
})

export type PacingConfig = z.infer<typeof PacingConfigSchema>

// ── Reference File ──

export const ReferenceFileSchema = z.object({
  id: z.string().uuid(),
  filename: z.string().min(1),
  mimeType: z.string().regex(/^[a-z]+\/[a-z0-9.+\-]+$/),
  size: z.number().positive(),
  dataUrl: z.string().url(),
})

export type ReferenceFile = z.infer<typeof ReferenceFileSchema>

// ── Role Config ──

export const RoleConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'gemini', 'xai']),
  role: z.string().min(1),
})

export type RoleConfig = z.infer<typeof RoleConfigSchema>

// ── Discussion Config ──

export const DiscussionConfigSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  mode: DiscussionModeSchema,
  maxRounds: z.number().min(1).max(10),
  participants: z.array(z.enum(['openai', 'anthropic', 'gemini', 'xai'])).min(2, 'At least 2 participants required'),
  roles: z.array(RoleConfigSchema).default([]),
  judgeProvider: z.enum(['openai', 'anthropic', 'gemini', 'xai']).optional(),
  pacing: PacingConfigSchema,
  referenceText: z.string().default(''),
  useReference: z.boolean().default(false),
  referenceFiles: z.array(ReferenceFileSchema).default([]),
})

export type DiscussionConfig = z.infer<typeof DiscussionConfigSchema>

// ── Discussion Message ──

export const DiscussionMessageSchema = z.object({
  id: z.string().uuid(),
  provider: z.enum(['openai', 'anthropic', 'gemini', 'xai']),
  content: z.string().min(1),
  timestamp: z.number().positive(),
  round: z.number().min(1),
  turnIndex: z.number().min(0),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type DiscussionMessage = z.infer<typeof DiscussionMessageSchema>

// ── API Error Response ──

export const APIErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  statusCode: z.number(),
  details: z.record(z.string(), z.unknown()).optional(),
})

export type APIError = z.infer<typeof APIErrorSchema>

// ── Validation Helper ──

export function validateConfig<T>(schema: z.ZodSchema<T>, data: unknown): { valid: true; data: T } | { valid: false; errors: string[] } {
  try {
    const validated = schema.parse(data)
    return { valid: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
      return { valid: false, errors }
    }
    return { valid: false, errors: ['Unknown validation error'] }
  }
}

// ── Safe Type Assertion ──

export function assertDiscussionConfig(data: unknown): DiscussionConfig {
  return DiscussionConfigSchema.parse(data)
}

export function assertDiscussionMessage(data: unknown): DiscussionMessage {
  return DiscussionMessageSchema.parse(data)
}

export function assertSettingsConfig(data: unknown): SettingsConfig {
  return SettingsConfigSchema.parse(data)
}
