import axios, { AxiosInstance, AxiosError } from 'axios'
import axiosRetry from 'axios-retry'
import { createLogger } from './logger'

const logger = createLogger('APIClient')

// ── Retry Configuration ──

export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableStatusCodes: number[]
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
}

// ── API Client ──

export class APIClient {
  private client: AxiosInstance
  private retryConfig: RetryConfig

  constructor(
    baseURL?: string,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
  ) {
    this.retryConfig = retryConfig
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupRetry()
    this.setupInterceptors()
  }

  /**
   * Setup exponential backoff retry logic
   */
  private setupRetry(): void {
    axiosRetry(this.client, {
      retries: this.retryConfig.maxRetries,
      retryDelay: (retryCount) => {
        const delay = Math.min(
          this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, retryCount - 1),
          this.retryConfig.maxDelayMs,
        )
        // Add jitter (random variation) to prevent thundering herd
        const jitter = delay * 0.1 * Math.random()
        return delay + jitter
      },
      retryCondition: (error) => {
        // Only retry on specific status codes or network errors
        return (
          !error.response ||
          this.retryConfig.retryableStatusCodes.includes(error.response.status)
        )
      },
      onRetry: (retryCount, error) => {
        logger.warn(`Retrying request (attempt ${retryCount})`, {
          status: error.response?.status,
          url: error.config?.url,
        })
      },
    })
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        logger.error('Request setup failed', error as Error)
        return Promise.reject(error)
      },
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`API Response: ${response.status} ${response.config.url}`, {
          dataSize: JSON.stringify(response.data).length,
        })
        return response
      },
      (error: AxiosError) => {
        logger.error(
          `API Error: ${error.response?.status || 'Network'} ${error.config?.url}`,
          error,
          {
            statusCode: error.response?.status,
            retryCount: (error.config as any)?.__retryCount || 0,
          },
        )
        return Promise.reject(error)
      },
    )
  }

  /**
   * GET request with automatic retry
   */
  async get<T = unknown>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * POST request with automatic retry
   */
  async post<T = unknown>(url: string, data?: unknown, config?: any): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * PUT request with automatic retry
   */
  async put<T = unknown>(url: string, data?: unknown, config?: any): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * PATCH request with automatic retry
   */
  async patch<T = unknown>(url: string, data?: unknown, config?: any): Promise<T> {
    try {
      const response = await this.client.patch<T>(url, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * DELETE request with automatic retry
   */
  async delete<T = unknown>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Handle API errors with structured logging
   */
  private handleError(error: unknown): Error {
    if (error instanceof AxiosError) {
      const statusCode = error.response?.status || 0
      const message = error.response?.data?.message || error.message

      // Network error
      if (!error.response) {
        return new Error(`Network error: ${error.message}`)
      }

      // API error response
      const apiError = new Error(`API Error ${statusCode}: ${message}`)
      Object.assign(apiError, {
        statusCode,
        response: error.response?.data,
      })
      return apiError
    }

    return error instanceof Error ? error : new Error(String(error))
  }

  /**
   * Update retry configuration
   */
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config }
    this.setupRetry()
  }

  /**
   * Get the underlying axios instance for advanced use
   */
  getAxios(): AxiosInstance {
    return this.client
  }
}

/**
 * Create a specialized API client for AI provider calls
 */
export function createAIProviderClient(
  providerName: string,
  apiKey: string,
  baseURL: string,
): APIClient {
  const client = new APIClient(baseURL)
  client.getAxios().defaults.headers.common['Authorization'] = `Bearer ${apiKey}`
  
  logger.info(`Created API client for ${providerName}`)
  return client
}
