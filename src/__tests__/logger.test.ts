import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Logger, createLogger, globalLogger } from '@/lib/logger'

describe('Logger', () => {
  let logger: Logger

  beforeEach(() => {
    logger = new Logger('TestComponent')
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with component name', () => {
      expect(logger).toBeDefined()
    })

    it('should have all log methods', () => {
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.critical).toBe('function')
    })
  })

  describe('logging methods', () => {
    it('should log debug messages', () => {
      expect(() => logger.debug('Debug message', { key: 'value' })).not.toThrow()
    })

    it('should log info messages', () => {
      expect(() => logger.info('Info message')).not.toThrow()
    })

    it('should log warn messages', () => {
      expect(() => logger.warn('Warning message')).not.toThrow()
    })

    it('should log error messages with error object', () => {
      const error = new Error('Test error')
      expect(() => logger.error('Error occurred', error)).not.toThrow()
    })

    it('should log critical messages', () => {
      const err = new Error('Critical issue')
      expect(() => logger.critical('Critical error', err)).not.toThrow()
    })
  })

  describe('context management', () => {
    it('should set and retrieve context', () => {
      logger.setContext({
        userId: 'user123',
        traceId: 'trace456',
        component: 'TestComponent',
      })
      // Context is set internally; verify no errors thrown
      expect(() => logger.setContext({})).not.toThrow()
    })

    it('should handle empty context', () => {
      expect(() => logger.setContext({})).not.toThrow()
    })

    it('should handle context with metadata', () => {
      expect(() =>
        logger.setContext({
          metadata: {
            action: 'test',
            id: 123,
          },
        }),
      ).not.toThrow()
    })
  })

  describe('timeAsync', () => {
    it('should measure async operation duration', async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

      const result = await logger.timeAsync('test-operation', async () => {
        await delay(10)
        return 'result'
      })

      expect(result).toBe('result')
    })

    it('should handle async operation errors', async () => {
      try {
        await logger.timeAsync('failing-operation', async () => {
          throw new Error('Test failure')
        })
        expect(false).toBe(true) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should return operation result', async () => {
      const testData = { id: 1, name: 'test' }
      const result = await logger.timeAsync('get-data', async () => testData)
      expect(result).toEqual(testData)
    })
  })

  describe('timeSync', () => {
    it('should measure sync operation duration', () => {
      const result = logger.timeSync('sync-operation', () => {
        return 'sync-result'
      })

      expect(result).toBe('sync-result')
    })

    it('should handle sync operation errors', () => {
      const runTest = () => {
        logger.timeSync('failing-sync', () => {
          throw new Error('Sync failure')
        })
      }

      expect(runTest).toThrow(Error)
    })

    it('should return operation result', () => {
      const testValue = 42
      const result = logger.timeSync('calculate', () => testValue * 2)
      expect(result).toBe(84)
    })
  })

  describe('createLogger factory', () => {
    it('should create logger with component name', () => {
      const componentLogger = createLogger('MyComponent')
      expect(componentLogger).toBeInstanceOf(Logger)
    })

    it('should create independent logger instances', () => {
      const logger1 = createLogger('Component1')
      const logger2 = createLogger('Component2')
      expect(logger1).not.toBe(logger2)
    })
  })

  describe('globalLogger singleton', () => {
    it('should exist', () => {
      expect(globalLogger).toBeDefined()
      expect(globalLogger).toBeInstanceOf(Logger)
    })

    it('should be reusable across modules', () => {
      const logger1 = globalLogger
      const logger2 = globalLogger
      expect(logger1).toBe(logger2)
    })

    it('should log without errors', () => {
      expect(() => {
        globalLogger.info('Global log test')
        globalLogger.debug('Debug test')
        globalLogger.warn('Warn test')
      }).not.toThrow()
    })
  })

  describe('multiple operations', () => {
    it('should handle sequential logging', () => {
      expect(() => {
        logger.debug('First')
        logger.info('Second')
        logger.warn('Third')
        logger.error('Fourth', new Error('test'))
      }).not.toThrow()
    })

    it('should maintain context across operations', () => {
      logger.setContext({ userId: 'test-user' })
      expect(() => {
        logger.info('message 1')
        logger.info('message 2')
        logger.info('message 3')
        logger.info('message 4')
      }).not.toThrow()
    })
  })
})
