import { Pause, Play, Square, SkipForward, Plus } from 'lucide-react'
import { useDebateStore } from '@/stores/debateStore'
import { PROVIDER_LABELS, PROVIDER_COLORS, type AIProvider } from '@/types'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  running: '진행 중',
  paused: '일시 정지',
  completed: '완료',
  error: '오류',
}

const STATUS_COLORS: Record<string, string> = {
  running: 'bg-success/15 text-success',
  paused: 'bg-warning/15 text-warning',
  completed: 'bg-accent/15 text-accent',
  error: 'bg-error/15 text-error',
}

export function ControlBar() {
  const status = useDebateStore((s) => s.status)
  const config = useDebateStore((s) => s.config)
  const currentRound = useDebateStore((s) => s.currentRound)
  const loadingProvider = useDebateStore((s) => s.loadingProvider)
  const countdown = useDebateStore((s) => s.countdown)
  const waitingForNext = useDebateStore((s) => s.waitingForNext)
  const pauseDebate = useDebateStore((s) => s.pauseDebate)
  const resumeDebate = useDebateStore((s) => s.resumeDebate)
  const stopDebate = useDebateStore((s) => s.stopDebate)
  const nextTurn = useDebateStore((s) => s.nextTurn)
  const reset = useDebateStore((s) => s.reset)

  const maxRounds = config?.maxRounds || 3
  const isFinished = status === 'completed' || status === 'error'

  return (
    <div className="border-b border-border flex items-center justify-between px-4 py-2.5 shrink-0 bg-bg-secondary/60 backdrop-blur-sm">
      {/* Left: status info */}
      <div className="flex items-center gap-2.5 text-xs">
        {/* Status badge */}
        <span className={cn(
          'px-2 py-0.5 rounded-md text-[10px] font-semibold',
          STATUS_COLORS[status] || 'bg-bg-surface text-text-muted',
        )}>
          {STATUS_LABELS[status] || status}
        </span>

        {/* Round counter */}
        <span className="text-text-muted font-medium">
          R<span className="text-text-secondary">{currentRound}</span>/{maxRounds}
        </span>

        {/* Participant badges */}
        {config && (
          <div className="flex items-center gap-1">
            {config.participants.map((p: AIProvider) => (
              <div
                key={p}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  loadingProvider === p && 'ring-2 ring-offset-1 ring-offset-bg-secondary animate-subtle-pulse',
                )}
                style={{
                  backgroundColor: PROVIDER_COLORS[p],
                }}
                title={PROVIDER_LABELS[p]}
              />
            ))}
          </div>
        )}

        {/* Currently speaking indicator */}
        {loadingProvider && (
          <span className="flex items-center gap-1.5 text-[11px]">
            <span style={{ color: PROVIDER_COLORS[loadingProvider] }} className="font-medium">
              {PROVIDER_LABELS[loadingProvider]}
            </span>
            <span className="text-text-muted">응답 중</span>
          </span>
        )}

        {/* Countdown timer */}
        {countdown > 0 && (
          <span className="text-[11px] text-warning font-mono tabular-nums bg-warning/10 px-1.5 py-0.5 rounded">
            {countdown}s
          </span>
        )}

        {/* Manual "Next Turn" button */}
        {waitingForNext && (
          <button
            onClick={nextTurn}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition animate-subtle-pulse"
          >
            <SkipForward className="w-3.5 h-3.5" />
            다음 턴
          </button>
        )}
      </div>

      {/* Right: control buttons */}
      <div className="flex items-center gap-1">
        {status === 'running' && (
          <button
            onClick={pauseDebate}
            className="p-2 hover:bg-bg-hover rounded-lg transition text-text-secondary hover:text-warning"
            title="일시 정지"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}
        {status === 'paused' && (
          <button
            onClick={resumeDebate}
            className="p-2 hover:bg-bg-hover rounded-lg transition text-text-secondary hover:text-success"
            title="계속하기"
          >
            <Play className="w-4 h-4" />
          </button>
        )}
        {(status === 'running' || status === 'paused') && (
          <button
            onClick={stopDebate}
            className="p-2 hover:bg-bg-hover rounded-lg transition text-text-secondary hover:text-error"
            title="종료"
          >
            <Square className="w-4 h-4" />
          </button>
        )}
        {isFinished && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            새 토론
          </button>
        )}
      </div>
    </div>
  )
}
