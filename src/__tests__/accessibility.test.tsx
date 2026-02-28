import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import axe from 'axe-core'

// --- stub out stores to prevent database access, state loops, and other side effects ---
vi.mock('@/stores/historyStore', () => {
  return {
    useHistoryStore: (selector?: any) => {
      const state = {
        selectedDebateId: null,
        debates: [],
        loadDebates: vi.fn(() => Promise.resolve()),
        clearError: vi.fn(),
        saveDebate: vi.fn(),
      }
      return selector ? selector(state) : state
    },
  }
})

vi.mock('@/stores/settingsStore', () => {
  // create a safe empty config object for all providers
  const PROVIDERS = ['openai', 'anthropic', 'gemini', 'xai'] as const
  const MODEL_OPTIONS: Record<string, string[]> = {
    openai: ['gpt-4.1'],
    anthropic: ['claude-sonnet-4-5-20250929'],
    gemini: ['gemini-2.5-flash'],
    xai: ['grok-3-fast'],
  }
  const defaultConfigs: Record<string, any> = {}
  PROVIDERS.forEach((p: string) => {
    defaultConfigs[p] = { enabled: false, apiKey: '', model: MODEL_OPTIONS[p][0] }
  })
  return {
    useSettingsStore: (selector?: any) => {
      const state = {
        configs: defaultConfigs,
        theme: 'dark',
        updateConfig: vi.fn(),
        setTheme: vi.fn(),
        getEnabledProviders: () => [],
      }
      return selector ? selector(state) : state
    },
  }
})

vi.mock('@/stores/debateStore', () => {
  return {
    useDebateStore: (selector?: any) => {
      const state = {
        status: 'idle',
        config: null,
        messages: [],
        loadingProvider: null,
        startDebate: vi.fn(),
        pauseDebate: vi.fn(),
        resumeDebate: vi.fn(),
        stopDebate: vi.fn(),
        userIntervene: vi.fn(),
        nextTurn: vi.fn(),
        reset: vi.fn(),
      }
      return selector ? selector(state) : state
    },
  }
})

import App from '@/App'

// run axe-core on a rendered component
async function runAxe(container: HTMLElement) {
  return new Promise<axe.AxeResults>((resolve, reject) => {
    axe.run(container, (err, results) => {
      if (err) reject(err)
      else resolve(results)
    })
  })
}

describe('Accessibility checks (WCAG 2.1 AA)', () => {
  it('App should have no violations', async () => {
    const { container } = render(<App />)
    const results = await runAxe(container)
    if (results.violations.length > 0) {
      console.dir(results.violations, { depth: null })
    }
    expect(results.violations.length).toBe(0, JSON.stringify(results.violations, null, 2))
  })
})