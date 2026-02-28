import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use happy-dom for faster, lighter testing (jsdom alternative)
    environment: 'happy-dom',
    
    // Set NODE_ENV to 'test'
    env: {
      NODE_ENV: 'test',
    },
    
    // Global test setup
    globals: true,
    
    // Test files discovery pattern
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    
    // Exclude files from being treated as test files
    exclude: ['node_modules', 'src/__tests__/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
    
    // Timeout for tests
    testTimeout: 10000,
    
    // Setup files
    setupFiles: ['src/__tests__/setup.ts'],
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
