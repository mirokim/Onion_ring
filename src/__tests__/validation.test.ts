import { describe, it, expect, beforeEach } from 'vitest'
import {
  ProviderConfigSchema,
  SettingsConfigSchema,
  DiscussionConfigSchema,
  DiscussionMessageSchema,
  validateConfig,
  assertDiscussionConfig,
  assertDiscussionMessage,
  assertSettingsConfig,
} from '@/lib/validation'
import type {
  ProviderConfig,
  SettingsConfig,
  DiscussionConfig,
  DiscussionMessage,
} from '@/types'

describe('Validation Schemas', () => {
  describe('ProviderConfigSchema', () => {
    it('should validate valid provider config', () => {
      const validConfig: ProviderConfig = {
        enabled: true,
        apiKey: 'test-key-123',
        model: 'gpt-4',
      }

      const result = validateConfig(ProviderConfigSchema, validConfig)
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data).toEqual(validConfig)
      }
    })

    it('should reject missing apiKey', () => {
      const invalidConfig = {
        enabled: true,
        model: 'gpt-4',
      }

      const result = validateConfig(ProviderConfigSchema, invalidConfig)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })

    it('should reject invalid enabled type', () => {
      const invalidConfig = {
        enabled: 'yes',
        apiKey: 'test-key',
        model: 'gpt-4',
      }

      const result = validateConfig(ProviderConfigSchema, invalidConfig)
      expect(result.valid).toBe(false)
    })

    it('should require all three fields', () => {
      const partialConfig = {
        enabled: true,
      }

      const result = validateConfig(ProviderConfigSchema, partialConfig)
      expect(result.valid).toBe(false)
    })
  })

  describe('SettingsConfigSchema', () => {
    it('should validate complete settings config', () => {
      const validSettings: SettingsConfig = {
        openai: {
          enabled: true,
          apiKey: 'sk-test',
          model: 'gpt-4',
        },
        anthropic: {
          enabled: false,
          apiKey: '',
          model: 'claude-3',
        },
        gemini: {
          enabled: false,
          apiKey: '',
          model: 'gemini-pro',
        },
        xai: {
          enabled: false,
          apiKey: '',
          model: 'grok-1',
        },
        theme: 'light',
      }

      const result = validateConfig(SettingsConfigSchema, validSettings)
      expect(result.valid).toBe(true)
    })

    it('should accept both theme values', () => {
      const configLight = {
        openai: { enabled: true, apiKey: 'key', model: 'gpt-4' },
        anthropic: { enabled: false, apiKey: '', model: '' },
        gemini: { enabled: false, apiKey: '', model: '' },
        xai: { enabled: false, apiKey: '', model: '' },
        theme: 'light',
      }

      const configDark = {
        ...configLight,
        theme: 'dark',
      }

      const lightResult = validateConfig(SettingsConfigSchema, configLight)
      const darkResult = validateConfig(SettingsConfigSchema, configDark)

      expect(lightResult.valid).toBe(true)
      expect(darkResult.valid).toBe(true)
    })

    it('should reject invalid theme', () => {
      const invalidSettings = {
        openai: { enabled: true, apiKey: 'key', model: 'gpt-4' },
        anthropic: { enabled: false, apiKey: '', model: '' },
        gemini: { enabled: false, apiKey: '', model: '' },
        xai: { enabled: false, apiKey: '', model: '' },
        theme: 'neon-blue',
      }

      const result = validateConfig(SettingsConfigSchema, invalidSettings)
      expect(result.valid).toBe(false)
    })
  })

  describe('DiscussionMessageSchema', () => {
    it('should validate complete discussion message', () => {
      const validMessage: DiscussionMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        provider: 'openai',
        content: 'This is a test message',
        timestamp: Date.now(),
        round: 1,
        turnIndex: 0,
        metadata: {
          tokens: 50,
          responseTime: 1000,
        },
      }

      const result = validateConfig(DiscussionMessageSchema, validMessage)
      expect(result.valid).toBe(true)
    })

    it('should reject empty content', () => {
      const invalidMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        provider: 'openai',
        content: '',
        timestamp: Date.now(),
        round: 1,
        turnIndex: 0,
      }

      const result = validateConfig(DiscussionMessageSchema, invalidMessage)
      expect(result.valid).toBe(false)
    })

    it('should reject invalid provider', () => {
      const invalidMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        provider: 'invalid-provider',
        content: 'Message',
        timestamp: Date.now(),
        round: 1,
        turnIndex: 0,
      }

      const result = validateConfig(DiscussionMessageSchema, invalidMessage)
      expect(result.valid).toBe(false)
    })

    it('should make metadata optional', () => {
      const messageWithoutMetadata = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        provider: 'openai',
        content: 'Simple message',
        timestamp: Date.now(),
        round: 1,
        turnIndex: 0,
      }

      const result = validateConfig(DiscussionMessageSchema, messageWithoutMetadata)
      expect(result.valid).toBe(true)
    })
  })

  describe('DiscussionConfigSchema', () => {
    const createValidConfig = (): Partial<DiscussionConfig> => ({
      topic: 'Should AI replace human teachers?',
      mode: 'roundRobin',
      maxRounds: 3,
      participants: ['openai', 'anthropic'],
      roles: [
        { provider: 'openai', role: 'Advocate' },
        { provider: 'anthropic', role: 'Critic' },
      ],
      pacing: {
        mode: 'auto',
        autoDelaySeconds: 5,
      },
      referenceText: '',
      useReference: false,
      referenceFiles: [],
    })

    it('should validate complete discussion config', () => {
      const validConfig = createValidConfig()
      const result = validateConfig(DiscussionConfigSchema, validConfig)
      if (!result.valid) {
        process.stderr.write(`Complete config errors: ${JSON.stringify(result.errors)}\n`)
      }
      expect(result.valid).toBe(true)
    })

    it('should reject short topic', () => {
      const config = {
        ...createValidConfig(),
        topic: 'AI',
      }

      const result = validateConfig(DiscussionConfigSchema, config)
      expect(result.valid).toBe(false)
    })

    it('should reject empty topic', () => {
      const config = {
        ...createValidConfig(),
        topic: '',
      }

      const result = validateConfig(DiscussionConfigSchema, config)
      expect(result.valid).toBe(false)
    })

    it('should accept valid modes', () => {
      const modes = ['roundRobin', 'freeDiscussion', 'roleAssignment', 'battle', 'artworkEval']

      for (const mode of modes) {
        const config = {
          ...createValidConfig(),
          mode,
        }
        const result = validateConfig(DiscussionConfigSchema, config)
        if (!result.valid) {
          process.stderr.write(`Mode ${mode} errors: ${JSON.stringify(result.errors)}\n`)
        }
        expect(result.valid).toBe(true)
      }
    })

    it('should validate maxRounds range', () => {
      const validConfig = { ...createValidConfig(), maxRounds: 5 }
      let result = validateConfig(DiscussionConfigSchema, validConfig)
      if (!result.valid) {
        process.stderr.write(`MaxRounds valid config errors: ${JSON.stringify(result.errors)}\n`)
      }
      expect(result.valid).toBe(true)

      const tooLow = { ...createValidConfig(), maxRounds: 0 }
      const resultLow = validateConfig(DiscussionConfigSchema, tooLow)
      expect(resultLow.valid).toBe(false)

      const tooHigh = { ...createValidConfig(), maxRounds: 11 }
      const resultHigh = validateConfig(DiscussionConfigSchema, tooHigh)
      expect(resultHigh.valid).toBe(false)
    })

    it('should require minimum participants', () => {
      const config = {
        ...createValidConfig(),
        participants: ['openai'],
      }

      const result = validateConfig(DiscussionConfigSchema, config)
      expect(result.valid).toBe(false)
    })

    it('should accept optional judgeProvider', () => {
      const configWithJudge = {
        ...createValidConfig(),
        judgeProvider: 'gemini',
      }

      const result = validateConfig(DiscussionConfigSchema, configWithJudge)
      if (!result.valid) {
        process.stderr.write(`JudgeProvider config errors: ${JSON.stringify(result.errors)}\n`)
      }
      expect(result.valid).toBe(true)
    })

    it('should allow empty referenceFiles array', () => {
      const config = {
        ...createValidConfig(),
        referenceFiles: [],
      }

      const result = validateConfig(DiscussionConfigSchema, config)
      if (!result.valid) {
        process.stderr.write(`ReferenceFiles validation errors: ${JSON.stringify(result.errors)}\n`)
      }
      expect(result.valid).toBe(true)
    })
  })

  describe('validateConfig helper function', () => {
    it('should return valid structure on success', () => {
      const data = {
        enabled: true,
        apiKey: 'test-key',
        model: 'test-model',
      }

      const result = validateConfig(ProviderConfigSchema, data)
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('data')
    })

    it('should return errors array on failure', () => {
      const invalidData = {
        enabled: true,
        // missing apiKey and model
      }

      const result = validateConfig(ProviderConfigSchema, invalidData)
      expect(result).toHaveProperty('valid', false)
      expect(result).toHaveProperty('errors')
      if (!result.valid) {
        expect(Array.isArray(result.errors)).toBe(true)
      }
    })

    it('should provide meaningful error messages', () => {
      const invalidData = {
        enabled: 'not-a-boolean',
        apiKey: '',
      }

      const result = validateConfig(ProviderConfigSchema, invalidData)
      if (!result.valid) {
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors[0]).toMatch(/(Invalid input|Expected)/)
      }
    })
  })

  describe('Type assertion helpers', () => {
    it('assertDiscussionMessage should throw on invalid data', () => {
      const invalidMessage = {
        id: 'not-a-uuid',
        provider: 'invalid',
        content: '',
      }

      expect(() => assertDiscussionMessage(invalidMessage)).toThrow()
    })

    it('assertDiscussionMessage should not throw on valid data', () => {
      const validMessage: DiscussionMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        provider: 'openai',
        content: 'Valid message',
        timestamp: Date.now(),
        round: 1,
        turnIndex: 0,
      }

      expect(() => assertDiscussionMessage(validMessage)).not.toThrow()
    })

    it('assertSettingsConfig should validate all providers', () => {
      const validSettings: SettingsConfig = {
        openai: { enabled: true, apiKey: 'key', model: 'gpt-4' },
        anthropic: { enabled: false, apiKey: '', model: 'claude-2' },
        gemini: { enabled: false, apiKey: '', model: 'gemini-1' },
        xai: { enabled: false, apiKey: '', model: 'grok-1' },
        theme: 'light',
      }

      expect(() => assertSettingsConfig(validSettings)).not.toThrow()
    })

    it('assertSettingsConfig should throw on invalid settings', () => {
      const invalidSettings = {
        openai: { enabled: 'yes' },
        theme: 'invalid',
      }

      expect(() => assertSettingsConfig(invalidSettings)).toThrow()
    })
  })

  describe('Edge cases', () => {
    it('should handle null input', () => {
      const result = validateConfig(ProviderConfigSchema, null)
      expect(result.valid).toBe(false)
    })

    it('should handle undefined input', () => {
      const result = validateConfig(ProviderConfigSchema, undefined)
      expect(result.valid).toBe(false)
    })

    it('should handle array input when object expected', () => {
      const result = validateConfig(ProviderConfigSchema, [])
      expect(result.valid).toBe(false)
    })

    it('should validate extra fields gracefully', () => {
      const configWithExtra = {
        enabled: true,
        apiKey: 'test-key',
        model: 'gpt-4',
        extraField: 'should-be-ignored',
      }

      const result = validateConfig(ProviderConfigSchema, configWithExtra)
      expect(result.valid).toBe(true)
    })
  })
})
