import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PROVIDER_COLORS, PROVIDER_LABELS, type AIProvider, type DiscussionMode } from '@/types'

interface Props {
  selectedProviders: AIProvider[]
  enabledProviders: AIProvider[]
  mode: DiscussionMode
  onToggleProvider: (provider: AIProvider) => void
}

export function ParticipantSelector({
  selectedProviders,
  enabledProviders,
  mode,
  onToggleProvider,
}: Props) {
  return (
    <div className="space-y-2.5">
      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">참여 AI 선택</label>

      {enabledProviders.length < 2 && (
        <div className="flex items-center gap-2 text-warning text-xs bg-warning/10 px-3 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>사이드바에서 2개 이상의 AI를 활성화하고 API 키를 입력하세요</span>
        </div>
      )}

      {mode === 'battle' && selectedProviders.length < 3 && selectedProviders.length >= 2 && (
        <div className="flex items-center gap-2 text-warning text-xs bg-warning/10 px-3 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>결전모드는 3개의 AI가 필요합니다 (토론자 2 + 심판 1)</span>
        </div>
      )}

      <div className="flex gap-2">
        {enabledProviders.map((p) => {
          const selected = selectedProviders.includes(p)
          return (
            <button
              key={p}
              onClick={() => onToggleProvider(p)}
              className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm transition-all',
                selected
                  ? 'border-transparent font-semibold shadow-sm'
                  : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover',
              )}
              style={
                selected
                  ? {
                      backgroundColor: `${PROVIDER_COLORS[p]}12`,
                      borderColor: `${PROVIDER_COLORS[p]}60`,
                      color: PROVIDER_COLORS[p],
                    }
                  : undefined
              }
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: PROVIDER_COLORS[p] }}
              />
              {PROVIDER_LABELS[p]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
