import { useState, useMemo, useEffect } from 'react'
import { Play, Sparkles, MessageSquare, Palette } from 'lucide-react'
import { useHistoryStore } from '@/stores/historyStore'
import { cn } from '@/lib/utils'
import { ArtworkInput } from './ArtworkInput'
import { DebateConfig } from './TopicInput/DebateConfig'
import { RoleSelector } from './TopicInput/RoleSelector'
import { ParticipantSelector } from './TopicInput/ParticipantSelector'
import { JudgeSelector } from './TopicInput/JudgeSelector'
import { ReferenceTracker } from './TopicInput/ReferenceTracker'
import { FileUploader } from './TopicInput/FileUploader'
import { PacingSelector } from './TopicInput/PacingSelector'
import { useDebateConfig } from './TopicInput/useDebateConfig'
import { useDebateStore } from '@/stores/debateStore'
import type { DiscussionMode } from '@/types'

type FeatureType = 'debate' | 'artworkEval'

const MODE_LABELS: Record<DiscussionMode, string> = {
  roundRobin: '라운드 로빈',
  freeDiscussion: '자유 토론',
  roleAssignment: '역할 배정',
  battle: '⚔️ 결전모드',
  artworkEval: '🎨 아트워크 평가',
}

const MODE_DESCRIPTIONS: Record<DiscussionMode, string> = {
  roundRobin: 'AI들이 순서대로 돌아가며 발언합니다',
  freeDiscussion: 'AI들이 자유롭게 서로의 의견에 반박/동의합니다',
  roleAssignment: '각 AI에 캐릭터/역할을 부여하여 토론합니다',
  battle: 'AI 2명이 대결하고 1명이 심판으로 채점합니다',
  artworkEval: 'AI들이 아트워크를 평가하고 피드백합니다',
}

const DEFAULT_SUGGESTIONS = [
  'AI가 인간의 창의성을 대체할 수 있는가?',
  '원격 근무가 사무실 근무보다 생산적인가?',
  '소셜 미디어는 민주주의에 도움이 되는가?',
  '우주 개발에 국가 예산을 투자해야 하는가?',
]

function buildSuggestions(recentTopics: string[]): string[] {
  if (recentTopics.length === 0) return DEFAULT_SUGGESTIONS

  const spinOffs: Record<string, string[]> = {
    AI: [
      'AI 규제는 혁신을 방해하는가?',
      'AI 창작물에 저작권을 부여해야 하는가?',
      'AI 면접관이 인간보다 공정할 수 있는가?',
      'AI가 교사를 대체할 수 있는가?',
    ],
    교육: [
      '대학 교육은 여전히 필수인가?',
      '코딩 교육을 초등학교부터 의무화해야 하는가?',
      '시험 없는 교육이 가능한가?',
      '온라인 학위가 오프라인 학위와 동등한 가치를 갖는가?',
    ],
    경제: [
      '기본 소득제가 경제에 긍정적인가?',
      '암호화폐가 법정화폐를 대체할 수 있는가?',
      '부유세 도입은 정당한가?',
      '4일 근무제는 경제적으로 실현 가능한가?',
    ],
    환경: [
      '원자력 에너지는 친환경적인가?',
      '탄소세가 기후변화 해결에 효과적인가?',
      '전기차 보조금 정책은 지속되어야 하는가?',
      '선진국이 개발도상국의 환경 비용을 부담해야 하는가?',
    ],
    사회: [
      '익명 인터넷은 허용되어야 하는가?',
      '동물 실험은 윤리적으로 정당화될 수 있는가?',
      '사형 제도는 폐지되어야 하는가?',
      '의무 투표제가 민주주의에 도움이 되는가?',
    ],
    기술: [
      '자율주행차 사고의 법적 책임은 누구에게 있는가?',
      '메타버스가 현실 사회를 대체할 수 있는가?',
      '양자 컴퓨터가 현재 암호 체계를 무력화할 것인가?',
      '뇌-컴퓨터 인터페이스의 상용화는 윤리적인가?',
    ],
  }

  const matchedCategories = new Set<string>()
  for (const topic of recentTopics) {
    for (const [keyword] of Object.entries(spinOffs)) {
      if (topic.includes(keyword)) {
        matchedCategories.add(keyword)
      }
    }
  }

  const candidates: string[] = []
  for (const cat of matchedCategories) {
    const items = spinOffs[cat]
    if (items) candidates.push(...items)
  }

  for (const [cat, topics] of Object.entries(spinOffs)) {
    if (!matchedCategories.has(cat)) {
      candidates.push(...topics)
    }
  }

  const filtered = candidates.filter(
    (s) => !recentTopics.some((t) => t === s),
  )

  const shuffled = filtered.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 4)
}

export function TopicInput() {
  const [featureType, setFeatureType] = useState<FeatureType>('debate')
  const debateConfig = useDebateConfig()
  const startDebate = useDebateStore((s) => s.startDebate)
  const debates = useHistoryStore((s) => s.debates)
  const loadDebates = useHistoryStore((s) => s.loadDebates)

  useEffect(() => {
    void loadDebates()
  }, [loadDebates])

  const suggestions = useMemo(() => {
    const recentTopics = debates.slice(0, 10).map((d) => d.topic)
    return buildSuggestions(recentTopics)
  }, [debates])

  const handleStart = () => {
    if (!debateConfig.canStart) return
    startDebate({
      mode: debateConfig.mode,
      topic: debateConfig.topic.trim(),
      maxRounds: debateConfig.maxRounds,
      participants: debateConfig.selectedProviders,
      roles: (debateConfig.mode === 'roleAssignment' || debateConfig.mode === 'battle')
        ? debateConfig.roles
        : [],
      judgeProvider: debateConfig.mode === 'battle' ? debateConfig.judgeProvider ?? undefined : undefined,
      referenceText: debateConfig.useReference ? debateConfig.referenceText : '',
      useReference: debateConfig.useReference || debateConfig.referenceFiles.length > 0,
      referenceFiles: debateConfig.referenceFiles,
      pacing: {
        mode: debateConfig.pacingMode,
        autoDelaySeconds: debateConfig.autoDelay,
      },
    })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Feature Type Toggle */}
      <div className="max-w-xl mx-auto px-6 pt-8 pb-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setFeatureType('debate')}
            className={cn(
              'flex items-center justify-center gap-2 px-3 py-2.5 text-xs rounded-xl border transition-all',
              featureType === 'debate'
                ? 'bg-accent/10 border-accent/40 text-accent font-semibold shadow-sm'
                : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover',
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            AI 토론
          </button>
          <button
            onClick={() => setFeatureType('artworkEval')}
            className={cn(
              'flex items-center justify-center gap-2 px-3 py-2.5 text-xs rounded-xl border transition-all',
              featureType === 'artworkEval'
                ? 'bg-accent/10 border-accent/40 text-accent font-semibold shadow-sm'
                : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover',
            )}
          >
            <Palette className="w-3.5 h-3.5" />
            아트워크 평가
          </button>
        </div>
      </div>

      {/* Artwork Evaluation Mode */}
      {featureType === 'artworkEval' && <ArtworkInput />}

      {/* Debate Mode */}
      {featureType === 'debate' && (
        <div className="max-w-xl mx-auto px-6 py-10 space-y-8">
          {/* Topic Suggestions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">추천 주제</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => debateConfig.setTopic(s)}
                  className={cn(
                    'text-left px-4 py-2.5 text-xs rounded-xl border transition-all leading-relaxed',
                    debateConfig.topic === s
                      ? 'bg-accent/10 border-accent/40 text-accent font-medium'
                      : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover hover:border-border',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">토론 주제</label>
            <textarea
              value={debateConfig.topic}
              onChange={(e) => debateConfig.setTopic(e.target.value)}
              placeholder="예: 소설에서 주인공의 성장 과정을 1인칭으로 서술하는 것이 3인칭보다 효과적인가?"
              className="w-full px-4 py-3 text-sm bg-bg-surface border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition placeholder:text-text-muted/60"
              rows={3}
            />
            <FileUploader
              referenceFiles={debateConfig.referenceFiles}
              onFilesChange={debateConfig.setReferenceFiles}
              onRemoveFile={debateConfig.removeReferenceFile}
            />
          </div>

          {/* Debate Mode and Rounds */}
          <DebateConfig
            mode={debateConfig.mode}
            maxRounds={debateConfig.maxRounds}
            modeDescriptions={MODE_DESCRIPTIONS}
            modeLabels={MODE_LABELS}
            onModeChange={debateConfig.setMode}
            onRoundsChange={debateConfig.setMaxRounds}
          />

          {/* Participants */}
          <ParticipantSelector
            selectedProviders={debateConfig.selectedProviders}
            enabledProviders={debateConfig.enabledProviders}
            mode={debateConfig.mode}
            onToggleProvider={debateConfig.toggleProvider}
          />

          {/* Judge Selection (Battle Mode) */}
          {debateConfig.mode === 'battle' && debateConfig.selectedProviders.length >= 3 && (
            <JudgeSelector
              selectedProviders={debateConfig.selectedProviders}
              judgeProvider={debateConfig.judgeProvider}
              onSelectJudge={debateConfig.setJudgeProvider}
            />
          )}

          {/* Role Assignment */}
          {(debateConfig.mode === 'roleAssignment' || debateConfig.mode === 'battle')
            && debateConfig.selectedProviders.length > 0 && (
            <RoleSelector
              selectedProviders={debateConfig.selectedProviders}
              roles={debateConfig.roles}
              onRoleChange={debateConfig.updateRole}
              judgeProvider={debateConfig.judgeProvider}
              mode={debateConfig.mode}
            />
          )}

          {/* Reference Data */}
          <ReferenceTracker
            useReference={debateConfig.useReference}
            onUseReferenceChange={debateConfig.setUseReference}
            referenceText={debateConfig.referenceText}
            onReferenceTextChange={debateConfig.setReferenceText}
          />

          {/* Pacing */}
          <PacingSelector
            pacingMode={debateConfig.pacingMode}
            autoDelay={debateConfig.autoDelay}
            onModeChange={debateConfig.setPacingMode}
            onDelayChange={debateConfig.setAutoDelay}
          />

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={!debateConfig.canStart}
            className={cn(
              'w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all',
              debateConfig.canStart
                ? 'bg-accent text-white hover:bg-accent-dim shadow-lg shadow-accent/20 active:scale-[0.98]'
                : 'bg-bg-surface text-text-muted cursor-not-allowed',
            )}
          >
            <Play className="w-4 h-4" />
            {debateConfig.mode === 'battle' ? '결전 시작' : '토론 시작'}
          </button>

          {/* Safe area spacer for home bar */}
          <div className="safe-area-bottom" />
        </div>
      )}
    </div>
  )
}
