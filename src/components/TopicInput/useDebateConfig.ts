import { useState, useMemo } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import type { AIProvider, DiscussionMode, PacingMode, RoleConfig, ReferenceFile } from '@/types'

export interface DebateConfigState {
  // Topic
  topic: string
  setTopic: (topic: string) => void

  // Mode and participants
  mode: DiscussionMode
  setMode: (mode: DiscussionMode) => void
  selectedProviders: AIProvider[]
  toggleProvider: (provider: AIProvider) => void
  judgeProvider: AIProvider | null
  setJudgeProvider: (provider: AIProvider | null) => void

  // Roles
  roles: RoleConfig[]
  updateRole: (provider: AIProvider, role: string) => void

  // Rounds
  maxRounds: number
  setMaxRounds: (rounds: number) => void

  // Reference
  useReference: boolean
  setUseReference: (use: boolean) => void
  referenceText: string
  setReferenceText: (text: string) => void
  referenceFiles: ReferenceFile[]
  setReferenceFiles: (files: ReferenceFile[]) => void
  removeReferenceFile: (id: string) => void

  // Pacing
  pacingMode: PacingMode
  setPacingMode: (mode: PacingMode) => void
  autoDelay: number
  setAutoDelay: (delay: number) => void

  // Derived
  enabledProviders: AIProvider[]
  canStart: boolean
}

export function useDebateConfig(): DebateConfigState {
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState<DiscussionMode>('roundRobin')
  const [selectedProviders, setSelectedProviders] = useState<AIProvider[]>([])
  const [judgeProvider, setJudgeProvider] = useState<AIProvider | null>(null)
  const [roles, setRoles] = useState<RoleConfig[]>([])
  const [maxRounds, setMaxRounds] = useState(3)

  // Reference
  const [useReference, setUseReference] = useState(false)
  const [referenceText, setReferenceText] = useState('')
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([])

  // Pacing
  const [pacingMode, setPacingMode] = useState<PacingMode>('manual')
  const [autoDelay, setAutoDelay] = useState(5)

  const configs = useSettingsStore((s) => s.configs)

  // Get enabled providers based on settings
  const enabledProviders = useMemo(
    () => {
      const PROVIDERS: AIProvider[] = ['openai', 'anthropic', 'gemini', 'xai']
      return PROVIDERS.filter((p) => configs[p].enabled && configs[p].apiKey.trim().length > 0)
    },
    [configs],
  )

  // Validation
  const canStart: boolean = useMemo(
    () => {
      const hasValidTopic = topic.trim().length > 0
      const hasMinParticipants = selectedProviders.length >= 2
      const battleModeValid = mode !== 'battle' || (selectedProviders.length >= 3 && judgeProvider !== null)
      return hasValidTopic && hasMinParticipants && battleModeValid
    },
    [topic, selectedProviders, mode, judgeProvider],
  )

  const toggleProvider = (provider: AIProvider) => {
    setSelectedProviders((prev) => {
      const next = prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider]

      // Sync role configs
      setRoles((prevRoles) => {
        const existing = new Map(prevRoles.map((r) => [r.provider, r]))
        return next.map((p) => existing.get(p) || { provider: p, role: '중립' })
      })

      // Clear judge if no longer in selected
      if (judgeProvider && !next.includes(judgeProvider)) {
        setJudgeProvider(null)
      }

      return next
    })
  }

  const updateRole = (provider: AIProvider, role: string) => {
    setRoles((prev) =>
      prev.map((r) => (r.provider === provider ? { ...r, role } : r)),
    )
  }

  const removeReferenceFile = (id: string) => {
    setReferenceFiles((prev) => prev.filter((f) => f.id !== id))
  }

  return {
    topic,
    setTopic,
    mode,
    setMode,
    selectedProviders,
    toggleProvider,
    judgeProvider,
    setJudgeProvider,
    roles,
    updateRole,
    maxRounds,
    setMaxRounds,
    useReference,
    setUseReference,
    referenceText,
    setReferenceText,
    referenceFiles,
    setReferenceFiles,
    removeReferenceFile,
    pacingMode,
    setPacingMode,
    autoDelay,
    setAutoDelay,
    enabledProviders,
    canStart,
  }
}
