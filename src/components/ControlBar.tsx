import { useState } from 'react'
import { Pause, Play, Square, SkipForward, Plus, Share2, Check } from 'lucide-react'
import { useDebateStore } from '@/stores/debateStore'
import { PROVIDER_LABELS, PROVIDER_COLORS, type AIProvider } from '@/types'
import { cn, formatDebateForShare, formatTimestampUTC, shareText } from '@/lib/utils'

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
  // Optimized: Group related selectors to reduce re-renders
  const { status, config, messages, currentRound, loadingProvider, countdown, waitingForNext } = useDebateStore(
    (s) => ({
      status: s.status,
      config: s.config,
      messages: s.messages,
      currentRound: s.currentRound,
      loadingProvider: s.loadingProvider,
      countdown: s.countdown,
      waitingForNext: s.waitingForNext,
    }),
  )
  const { pauseDebate, resumeDebate, stopDebate, nextTurn, reset } = useDebateStore(
    (s) => ({
      pauseDebate: s.pauseDebate,
      resumeDebate: s.resumeDebate,
      stopDebate: s.stopDebate,
      nextTurn: s.nextTurn,
      reset: s.reset,
    }),
  )
  const [shareOk, setShareOk] = useState(false)

  const maxRounds = config?.maxRounds || 3
  const isFinished = status === 'completed' || status === 'error'

  const handleShare = async () => {
    if (!config || messages.length === 0) return

    const dateStr = formatTimestampUTC(messages[0]!.timestamp, 'full')
    const text = formatDebateForShare(
      config.topic,
      config.mode,
      config.participants,
      messages.map((m) => ({
        provider: m.provider,
        content: m.content,
        round: m.round,
        error: m.error,
      })),
      dateStr,
    )

    const result = await shareText(`AI 토론: ${config.topic}`, text)
    if (result !== 'failed') {
      setShareOk(true)
      setTimeout(() => setShareOk(false), 2500)
    }
  }

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
            {config.participants.map((p: AIProvider) => {
              const isJudge = config.mode === 'battle' && config.judgeProvider === p
              return (
                <div
                  key={p}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    loadingProvider === p && 'ring-2 ring-offset-1 ring-offset-bg-secondary animate-subtle-pulse',
                    isJudge && 'ring-1 ring-warning',
                  )}
                  style={{
                    backgroundColor: PROVIDER_COLORS[p],
                  }}
                  title={`${PROVIDER_LABELS[p]}${isJudge ? ' (심판)' : ''}`}
                />
              )
            })}
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
        {/* Share button (when there are messages) */}
        {messages.length > 0 && (
          <button
            onClick={() => void handleShare()}
            className="p-2 hover:bg-bg-hover rounded-lg transition text-text-muted hover:text-accent"
            title="토론 내용 공유"
          >
            {shareOk ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        )}

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
            {config?.mode === 'artworkEval' ? '새 평가' : '새 토론'}
          </button>
        )}
      </div>
    </div>
  )
}
