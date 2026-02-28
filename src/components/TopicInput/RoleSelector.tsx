import { PROVIDER_LABELS, PROVIDER_COLORS, ROLE_GROUPS, ROLE_OPTIONS, type AIProvider, type RoleConfig } from '@/types'

interface Props {
  selectedProviders: AIProvider[]
  roles: RoleConfig[]
  onRoleChange: (provider: AIProvider, role: string) => void
  judgeProvider?: AIProvider | null
  mode: 'roleAssignment' | 'battle'
}

export function RoleSelector({ selectedProviders, roles, onRoleChange, judgeProvider, mode }: Props) {
  // Build role label map
  const ROLE_LABEL_MAP = new Map(ROLE_OPTIONS.map((r) => [r.value, r.label]))

  return (
    <div className="space-y-2.5">
      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
        {mode === 'battle' ? '⚔️ 캐릭터 배정 (선택)' : '역할 배정'}
      </label>
      <div className="space-y-2 bg-bg-surface rounded-xl p-3 border border-border">
        {selectedProviders.map((p) => {
          const isJudgeAI = mode === 'battle' && judgeProvider === p
          const role = roles.find((r) => r.provider === p)?.role || '중립'
          return (
            <div key={p} className="flex items-center gap-3">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: PROVIDER_COLORS[p] }}
              />
              <span className="text-xs text-text-secondary w-16 font-medium">{PROVIDER_LABELS[p]}</span>
              {isJudgeAI ? (
                <span className="flex-1 px-2.5 py-1.5 text-xs text-warning font-semibold">
                  ⚖️ 심판
                </span>
              ) : (
                <select
                  value={role}
                  onChange={(e) => onRoleChange(p, e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30"
                >
                  {ROLE_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.roles.map((roleValue) => {
                        const roleLabel = ROLE_LABEL_MAP.get(roleValue)
                        if (!roleLabel) return null
                        return (
                          <option key={roleValue} value={roleLabel}>
                            {roleLabel}
                          </option>
                        )
                      })}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
