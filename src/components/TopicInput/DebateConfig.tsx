import type { DiscussionMode } from '@/types'

interface Props {
  mode: DiscussionMode
  maxRounds: number
  modeDescriptions: Record<DiscussionMode, string>
  modeLabels: Record<DiscussionMode, string>
  onModeChange: (mode: DiscussionMode) => void
  onRoundsChange: (rounds: number) => void
}

const DEBATE_MODES: DiscussionMode[] = ['roundRobin', 'freeDiscussion', 'roleAssignment', 'battle']

export function DebateConfig({
  mode,
  maxRounds,
  modeDescriptions,
  modeLabels,
  onModeChange,
  onRoundsChange,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">토론 모드</label>
        <div className="space-y-2">
          {DEBATE_MODES.map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                mode === m
                  ? 'bg-accent/10 border-accent/40 ring-1 ring-accent/30'
                  : 'bg-bg-surface border-border hover:border-accent/20 hover:bg-bg-hover'
              }`}
            >
              <p className="font-medium text-xs">{modeLabels[m]}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{modeDescriptions[m]}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Rounds */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
          라운드 수: <span className="text-accent font-bold text-xs">{maxRounds}</span>
        </label>
        <input
          aria-label="라운드 수"
          type="range"
          min={1}
          max={10}
          value={maxRounds}
          onChange={(e) => onRoundsChange(Number(e.target.value))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-[10px] text-text-muted px-0.5">
          <span>1</span>
          <span>10</span>
        </div>
      </div>
    </div>
  )
}
