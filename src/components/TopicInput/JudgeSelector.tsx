import { cn } from '@/lib/utils'
import { PROVIDER_COLORS, PROVIDER_LABELS, type AIProvider } from '@/types'

interface Props {
  selectedProviders: AIProvider[]
  judgeProvider: AIProvider | null
  onSelectJudge: (provider: AIProvider | null) => void
}

export function JudgeSelector({ selectedProviders, judgeProvider, onSelectJudge }: Props) {
  return (
    <div className="space-y-2.5">
      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
        ⚖️ 심판 AI 선택
      </label>
      <div className="flex flex-wrap gap-2">
        {selectedProviders.map((p) => {
          const isJudge = judgeProvider === p
          return (
            <button
              key={p}
              onClick={() => onSelectJudge(p)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all',
                isJudge
                  ? 'bg-warning/10 border-warning/40 text-warning font-semibold shadow-sm'
                  : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover',
              )}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: PROVIDER_COLORS[p] }}
              />
              {PROVIDER_LABELS[p]}
              {isJudge && <span className="text-[10px]">⚖️</span>}
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-text-muted pl-1">
        심판 AI는 토론에 참여하지 않고 각 라운드를 채점합니다
      </p>
    </div>
  )
}
