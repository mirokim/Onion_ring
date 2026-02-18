import { useState, useEffect } from 'react'
import { Eye, EyeOff, ChevronDown, ChevronRight, Trash2, MessageSquare, History, Sun, Moon, Settings } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useHistoryStore } from '@/stores/historyStore'
import { cn, formatTimestampUTC } from '@/lib/utils'
import {
  PROVIDERS,
  PROVIDER_LABELS,
  PROVIDER_COLORS,
  MODEL_OPTIONS,
  type AIProvider,
} from '@/types'

function ProviderSection({ provider }: { provider: AIProvider }) {
  const { configs, updateConfig } = useSettingsStore()
  const config = configs[provider]
  const [showKey, setShowKey] = useState(false)
  const [expanded, setExpanded] = useState(config.enabled)

  const color = PROVIDER_COLORS[provider]
  const label = PROVIDER_LABELS[provider]

  return (
    <div className="mx-3 mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition text-left',
          expanded ? 'bg-bg-surface' : 'hover:bg-bg-hover',
        )}
      >
        <div
          className={cn('w-2 h-2 rounded-full shrink-0 transition-all', config.enabled && 'ring-2 ring-offset-1 ring-offset-bg-secondary')}
          style={{ backgroundColor: config.enabled ? color : 'var(--color-text-muted)' }}
        />
        <span className="flex-1 text-sm font-medium text-text-primary">{label}</span>
        {config.enabled && config.apiKey.trim() && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-success/15 text-success font-medium">ON</span>
        )}
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="px-3 py-2.5 space-y-2.5">
          {/* Enable toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className={cn(
              'relative w-8 h-[18px] rounded-full transition-colors cursor-pointer',
              config.enabled ? 'bg-accent' : 'bg-bg-hover',
            )}
              onClick={() => updateConfig(provider, { enabled: !config.enabled })}
            >
              <div className={cn(
                'absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform',
                config.enabled ? 'translate-x-[16px]' : 'translate-x-[2px]',
              )} />
            </div>
            <span className="text-xs text-text-secondary">활성화</span>
          </label>

          {/* API Key */}
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="API Key"
              value={config.apiKey}
              onChange={(e) => updateConfig(provider, { apiKey: e.target.value })}
              className={cn(
                'w-full px-3 py-2 pr-9 text-xs bg-bg-primary border rounded-lg transition focus:outline-none focus:ring-1',
                config.enabled && !config.apiKey.trim()
                  ? 'border-error/40 focus:ring-error/40'
                  : 'border-border focus:ring-accent/40 focus:border-accent/40',
              )}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Model select */}
          <select
            value={config.model}
            onChange={(e) => updateConfig(provider, { model: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/40"
          >
            {MODEL_OPTIONS[provider].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

function HistorySection() {
  const debates = useHistoryStore((s) => s.debates)
  const selectDebate = useHistoryStore((s) => s.selectDebate)
  const deleteDebate = useHistoryStore((s) => s.deleteDebate)
  const loadDebates = useHistoryStore((s) => s.loadDebates)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    void loadDebates()
  }, [loadDebates])

  if (debates.length === 0) {
    return (
      <div className="px-5 py-6 text-center">
        <p className="text-xs text-text-muted">아직 저장된 토론이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-1">
      {debates.map((d) => {
        const dateStr = formatTimestampUTC(d.createdAt, 'short')
        return (
          <div
            key={d.id}
            className="px-3 py-2.5 hover:bg-bg-hover cursor-pointer rounded-lg relative group mb-0.5 transition"
            onClick={() => selectDebate(d.id)}
            onMouseEnter={() => setHoveredId(d.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="text-xs text-text-primary truncate pr-6 font-medium leading-relaxed">
              {d.topic}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-text-muted">{dateStr}</span>
              <div className="flex items-center gap-0.5">
                {d.participants.map((p) => (
                  <div
                    key={p}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: PROVIDER_COLORS[p as AIProvider] }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                <MessageSquare className="w-2.5 h-2.5" />
                {d.messageCount}
              </span>
              {d.status === 'stopped' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-warning/15 text-warning font-medium">중단</span>
              )}
            </div>

            {/* Delete button on hover */}
            {hoveredId === d.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  void deleteDebate(d.id)
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-error/15 rounded-lg transition text-text-muted hover:text-error"
                title="삭제"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useSettingsStore()
  const isDark = theme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-bg-hover transition text-text-secondary text-xs"
    >
      {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      <span>{isDark ? '라이트 모드' : '다크 모드'}</span>
    </button>
  )
}

export function Sidebar() {
  return (
    <div className="flex flex-col h-full">
      {/* AI Providers Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
        <Settings className="w-3.5 h-3.5 text-text-muted" />
        <h2 className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">AI Providers</h2>
      </div>

      <div className="overflow-y-auto py-2">
        {PROVIDERS.map((p) => (
          <ProviderSection key={p} provider={p} />
        ))}
      </div>

      {/* History Section */}
      <div className="border-t border-border flex flex-col min-h-0 flex-1">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-text-muted" />
          <h2 className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">History</h2>
        </div>
        <HistorySection />
      </div>

      <div className="px-4 py-3 border-t border-border shrink-0 space-y-1.5">
        <ThemeToggle />
        <p className="text-[10px] text-text-muted leading-relaxed px-3">
          API 키는 브라우저에 난독화되어 저장됩니다.
        </p>
      </div>
    </div>
  )
}
