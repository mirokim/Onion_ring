import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AIProvider, AIConfig, ThemeId } from '@/types'
import { DEFAULT_MODELS, PROVIDERS } from '@/types'
import { secureStorage } from '@/lib/secureStorage'

interface SettingsState {
  configs: Record<AIProvider, AIConfig>
  theme: ThemeId
  updateConfig: (provider: AIProvider, updates: Partial<AIConfig>) => void
  setTheme: (theme: ThemeId) => void
  getEnabledProviders: () => AIProvider[]
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      configs: Object.fromEntries(
        PROVIDERS.map((p) => [
          p,
          {
            provider: p,
            apiKey: '',
            model: DEFAULT_MODELS[p],
            enabled: false,
          } satisfies AIConfig,
        ]),
      ) as Record<AIProvider, AIConfig>,

      theme: 'dark' as ThemeId,

      updateConfig: (provider, updates) =>
        set((state) => ({
          configs: {
            ...state.configs,
            [provider]: { ...state.configs[provider], ...updates },
          },
        })),

      setTheme: (theme) => set({ theme }),

      getEnabledProviders: () =>
        PROVIDERS.filter((p) => {
          const c = get().configs[p]
          return c.enabled && c.apiKey.trim().length > 0
        }),
    }),
    {
      name: 'debate-settings',
      storage: createJSONStorage(() => secureStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<SettingsState>
        const merged = { ...current, ...p }
        // Ensure newly added providers get default configs
        const configs = { ...current.configs, ...p.configs }
        for (const provider of PROVIDERS) {
          if (!configs[provider]) {
            configs[provider] = {
              provider,
              apiKey: '',
              model: DEFAULT_MODELS[provider],
              enabled: false,
            }
          }
        }
        merged.configs = configs
        return merged
      },
    },
  ),
)
