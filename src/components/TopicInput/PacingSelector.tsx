import { TOPIC_INPUT } from '@/constants'
import { cn } from '@/lib/utils'
import type { PacingMode } from '@/types'

interface Props {
  pacingMode: PacingMode
  autoDelay: number
  onModeChange: (mode: PacingMode) => void
  onDelayChange: (delay: number) => void
}

export function PacingSelector({ pacingMode, autoDelay, onModeChange, onDelayChange }: Props) {
  return (
    <div className="space-y-3">
      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">턴 속도 제어</label>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onModeChange('auto')}
          className={cn(
            'px-3 py-2.5 text-xs rounded-xl border transition-all',
            pacingMode === 'auto'
              ? 'bg-accent/10 border-accent/40 text-accent font-semibold'
              : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover',
          )}
        >
          자동
        </button>
        <button
          onClick={() => onModeChange('manual')}
          className={cn(
            'px-3 py-2.5 text-xs rounded-xl border transition-all',
            pacingMode === 'manual'
              ? 'bg-accent/10 border-accent/40 text-accent font-semibold'
              : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover',
          )}
        >
          수동
        </button>
      </div>

      {pacingMode === 'auto' ? (
        <div className="grid grid-cols-4 gap-1.5">
          {TOPIC_INPUT.DELAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => onDelayChange(d)}
              className={cn(
                'px-2 py-2 text-xs rounded-xl border transition-all',
                autoDelay === d
                  ? 'bg-accent/10 border-accent/30 text-accent font-medium'
                  : 'bg-bg-surface border-border text-text-muted hover:bg-bg-hover',
              )}
            >
              {d}초
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-text-muted pl-1">
          각 AI 응답 후 &apos;다음 턴&apos; 버튼을 눌러야 진행됩니다
        </p>
      )}
    </div>
  )
}
