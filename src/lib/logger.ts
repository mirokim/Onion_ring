import pino from 'pino'
import { Capacitor } from '@capacitor/core'

// Determine log level based on environment
const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'
const logLevel = isDev ? 'debug' : 'info'

// Browser transport for pino (skip in test environment)
let transport: any = undefined
if (isDev && !isTest) {
  try {
    transport = pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: false,
        messageFormat: '{levelLabel} - {msg}',
      },
    })
  } catch (error) {
    // Fallback if pino-pretty is not available
    console.warn('pino-pretty not available, using default transport')
  }
}

// Create logger instance
const pinoLogger = pino(
  {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport || pino.destination(),
)

// ── Structured Logger ──
export interface LogContext {
  component?: string
  userId?: string
  traceId?: string
  metadata?: Record<string, unknown>
}

export class Logger {
  private context: LogContext = {}

  constructor(componentName?: string) {
    if (componentName) {
      this.context.component = componentName
    }
  }

  /**
   * Set context for all logs from this logger instance
   */
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context }
  }

  /**
   * Log debug level message
   */
  debug(message: string, data?: unknown): void {
    pinoLogger.debug({ ...this.context, data }, message)
  }

  /**
   * Log info level message
   */
  info(message: string, data?: unknown): void {
    pinoLogger.info({ ...this.context, data }, message)
  }

  /**
   * Log warning level message
   */
  warn(message: string, data?: unknown): void {
    pinoLogger.warn({ ...this.context, data }, message)
  }

  /**
   * Log error level message with stack trace
   */
  error(message: string, error?: Error | unknown, data?: unknown): void {
    if (error instanceof Error) {
      pinoLogger.error(
        {
          ...this.context,
          error: {
            message: error.message,
            stack: error.stack,
          },
          data,
        },
        message,
      )
    } else {
      pinoLogger.error({ ...this.context, data }, message, error)
    }
  }

  /**
   * Log critical error that should alert monitoring
   */
  critical(message: string, error?: Error, data?: unknown): void {
    // Build error context only if provided
    const errorContext = error
      ? {
          error: {
            message: error.message,
            stack: error.stack,
          },
        }
      : {}

    pinoLogger.fatal(
      {
        ...this.context,
        ...errorContext,
        data,
      },
      message,
    )

    // Native alert on critical errors in production
    if (!isDev && Capacitor.isNativePlatform() && error) {
      console.error(`[CRITICAL] ${message}:`, error)
    }
  }

  /**
   * Time an operation and log duration
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.debug(`${label} completed`, { durationMs: duration })
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.error(`${label} failed`, error as Error, { durationMs: duration })
      throw error
    }
  }

  /**
   * Sync operation timing
   */
  timeSync<T>(label: string, fn: () => T): T {
    const start = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - start
      this.debug(`${label} completed`, { durationMs: duration })
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.error(`${label} failed`, error as Error, { durationMs: duration })
      throw error
    }
  }
}

// Export singleton logger for global use
export const globalLogger = new Logger('App')

// Export factory for component-specific loggers
export function createLogger(componentName: string): Logger {
  return new Logger(componentName)
}
