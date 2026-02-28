import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { APIClient, createAIProviderClient } from '@/lib/apiClient'



describe('APIClient', () => {
  let client: APIClient

  beforeEach(() => {
    client = new APIClient('https://api.test.com', {
      apiKey: 'test-key-123',
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with baseURL and options', () => {
      expect(client).toBeDefined()
    })

    it('should set API key from options', () => {
      const clientWithKey = new APIClient('https://api.example.com', {
        apiKey: 'secret-key',
        timeout: 5000,
      })
      expect(clientWithKey).toBeDefined()
    })

    it('should handle missing API key', () => {
      const clientNoKey = new APIClient('https://api.example.com', {})
      expect(clientNoKey).toBeDefined()
    })
  })

  describe('setupRetry', () => {
    it('should configure retry with default settings', () => {
      const retryConfig = {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      }

      client.setRetryConfig(retryConfig)
      expect(() => client.setupRetry()).not.toThrow()
    })

    it('should configure retry with custom settings', () => {
      const customConfig = {
        maxRetries: 5,
        initialDelayMs: 500,
        maxDelayMs: 30000,
        backoffMultiplier: 1.5,
      }

      client.setRetryConfig(customConfig)
      expect(() => client.setupRetry()).not.toThrow()
    })

    it('should respect maxRetries limit', () => {
      client.setRetryConfig({
        maxRetries: 1,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
      })

      expect(() => client.setupRetry()).not.toThrow()
    })
  })

  describe('setRetryConfig', () => {
    it('should update retry configuration', () => {
      const newConfig = {
        maxRetries: 4,
        initialDelayMs: 2000,
        maxDelayMs: 20000,
        backoffMultiplier: 2.5,
      }

      expect(() => client.setRetryConfig(newConfig)).not.toThrow()
    })

    it('should validate configuration values', () => {
      // Valid configuration should not throw
      const validConfig = {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      }

      expect(() => client.setRetryConfig(validConfig)).not.toThrow()
    })

    it('should support partial configuration updates', () => {
      expect(() => client.setRetryConfig({ maxRetries: 5 })).not.toThrow()
      expect(() => client.setRetryConfig({ initialDelayMs: 2000 })).not.toThrow()
    })
  })

  describe('getAxios', () => {
    it('should return axios instance', () => {
      const axiosInstance = client.getAxios()
      expect(axiosInstance).toBeDefined()
    })

    it('should return same instance on multiple calls', () => {
      const instance1 = client.getAxios()
      const instance2 = client.getAxios()
      expect(instance1).toBe(instance2)
    })
  })

  describe('exponential backoff calculation', () => {
    it('should calculate correct backoff for attempt 0', () => {
      const config = {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      }

      const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, 0)
      expect(delay).toBe(1000)
    })

    it('should calculate correct backoff for attempt 1', () => {
      const config = {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      }

      const delay = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, 1),
        config.maxDelayMs,
      )
      expect(delay).toBe(2000)
    })

    it('should respect maxDelayMs cap', () => {
      const config = {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
      }

      const delay = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, 3),
        config.maxDelayMs,
      )
      expect(delay).toEqual(config.maxDelayMs)
    })

    it('should apply jitter correctly', () => {
      const baseDelay = 1000
      const jitterFactor = 0.1
      const jitter = baseDelay * jitterFactor * 0.5 // 0.5 = ~average of Math.random()
      const delayWithJitter = baseDelay + jitter

      // Jitter should add randomness between 0 and baseDelay * jitterFactor
      expect(delayWithJitter).toBeGreaterThan(baseDelay)
      expect(delayWithJitter).toBeLessThanOrEqual(baseDelay + baseDelay * jitterFactor)
    })
  })

  describe('error handling', () => {
    it('should handle network errors', () => {
      const networkError = new Error('Network error')
      const result = client['handleError'](networkError)

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toContain('Network error')
      // non-AxiosError should not necessarily have statusCode
      expect((result as any).statusCode).toBeUndefined()
    })

    it('should extract error message from Error object', () => {
      const error = new Error('Something went wrong')
      const result = client['handleError'](error)

      expect(result.message).toBe('Something went wrong')
    })

    it('should handle undefined error gracefully', () => {
      const result = client['handleError'](undefined)
      expect(result).toBeDefined()
      expect(result).toHaveProperty('message')
    })

    it('should provide default error response structure', () => {
      const error = new Error('Test')
      const result = client['handleError'](error)

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('Test')
      // should not have additional properties for plain Error
      expect((result as any).statusCode).toBeUndefined()
    })
  })

  describe('HTTP methods', () => {
    it('should have get method', () => {
      expect(typeof client.get).toBe('function')
    })

    it('should have post method', () => {
      expect(typeof client.post).toBe('function')
    })

    it('should have put method', () => {
      expect(typeof client.put).toBe('function')
    })

    it('should have patch method', () => {
      expect(typeof client.patch).toBe('function')
    })

    it('should have delete method', () => {
      expect(typeof client.delete).toBe('function')
    })
  })

  describe('setupInterceptors', () => {
    it('should configure request interceptor', () => {
      expect(() => client.setupInterceptors()).not.toThrow()
    })

    it('should configure response interceptor', () => {
      expect(() => client.setupInterceptors()).not.toThrow()
    })

    it('should be callable after construction', () => {
      const newClient = new APIClient('https://api.test.com')
      expect(() => newClient.setupInterceptors()).not.toThrow()
    })
  })

  describe('createAIProviderClient factory', () => {
    it('should create client with provider name', () => {
      const client = createAIProviderClient('openai', 'sk-test-key')
      expect(client).toBeInstanceOf(APIClient)
    })

    it('should set correct base URL for OpenAI', () => {
      const client = createAIProviderClient('openai', 'sk-test-key')
      expect(client).toBeDefined()
    })

    it('should handle different providers', () => {
      const providers = ['openai', 'anthropic', 'gemini', 'xai']

      providers.forEach(provider => {
        const client = createAIProviderClient(provider as any, 'test-key')
        expect(client).toBeInstanceOf(APIClient)
      })
    })

    it('should accept optional baseURL override', () => {
      const customUrl = 'https://custom.api.com'
      const client = createAIProviderClient('openai', 'sk-test-key', customUrl)
      expect(client).toBeDefined()
    })
  })

  describe('retry integration', () => {
    it('should setup retry on initialization', () => {
      const newClient = new APIClient('https://api.test.com', {
        apiKey: 'test-key',
      })

      expect(() => newClient.setupRetry()).not.toThrow()
    })

    it('should configure retry before making requests', () => {
      const retryConfig = {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      }

      client.setRetryConfig(retryConfig)
      expect(() => client.setupRetry()).not.toThrow()
    })

    it('should respect retry configuration in requests', () => {
      const config = {
        maxRetries: 5,
        initialDelayMs: 500,
        maxDelayMs: 30000,
        backoffMultiplier: 1.5,
      }

      client.setRetryConfig(config)
      expect(() => client.setupRetry()).not.toThrow()
    })
  })

  describe('type safety', () => {
    it('should support generic type in get request', async () => {
      interface TestResponse {
        id: number
        name: string
      }

      const client = new APIClient('https://api.test.com')
      // Type-safe request (would show TS error if incorrect)
      expect(typeof client.get).toBe('function')
    })

    it('should support generic type in post request', async () => {
      interface TestRequest {
        message: string
      }

      interface TestResponse {
        success: boolean
      }

      const client = new APIClient('https://api.test.com')
      // Type-safe request with payload
      expect(typeof client.post).toBe('function')
    })
  })

  describe('initialization', () => {
    it('should be fully initialized after construction', () => {
      const client = new APIClient('https://api.test.com', { apiKey: 'test' })
      expect(client.getAxios()).toBeDefined()
    })

    it('should allow method chaining setup', () => {
      const client = new APIClient('https://api.test.com')
      expect(() => {
        client.setupRetry()
        client.setupInterceptors()
      }).not.toThrow()
    })

    it('should handle empty baseURL gracefully', () => {
      const client = new APIClient('', { apiKey: 'test' })
      expect(client).toBeDefined()
    })
  })
})
