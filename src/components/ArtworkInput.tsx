import { useState, useMemo, useRef } from 'react'
import { Play, AlertCircle, Upload, X, Camera as CameraIcon, ImagePlus, Palette } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useDebateStore } from '@/stores/debateStore'
import { cn } from '@/lib/utils'
import { generateId } from '@/lib/utils'
import { isCameraAvailable, capturePhoto, pickFromGallery } from '@/lib/camera'
import {
  PROVIDERS,
  PROVIDER_LABELS,
  PROVIDER_COLORS,
  ARTWORK_ROLE_OPTIONS,
  ARTWORK_ROLE_GROUPS,
  type AIProvider,
  type ArtworkEvalSubMode,
  type PacingMode,
  type RoleConfig,
  type ReferenceFile,
} from '@/types'

const SUB_MODE_LABELS: Record<ArtworkEvalSubMode, string> = {
  multiAiDiscussion: '🗣️ 다중 AI 토론',
  roleBasedIndividual: '🎭 역할별 평가',
  scoreFeedback: '📊 점수 + 피드백',
}

const SUB_MODE_DESCRIPTIONS: Record<ArtworkEvalSubMode, string> = {
  multiAiDiscussion: 'AI들이 서로 토론하며 작품을 비평합니다',
  roleBasedIndividual: '각 AI가 전문 역할로 독립 평가합니다',
  scoreFeedback: '구조화된 채점표와 서술형 피드백을 제공합니다',
}

const DELAY_OPTIONS = [5, 10, 15, 30] as const
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const IMAGE_EXTENSIONS = '.png,.jpg,.jpeg,.gif,.webp'

const ARTWORK_ROLE_LABEL_MAP = new Map(ARTWORK_ROLE_OPTIONS.map((r) => [r.value, r.label]))

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ArtworkInput() {
  const [artworkFile, setArtworkFile] = useState<ReferenceFile | null>(null)
  const [subMode, setSubMode] = useState<ArtworkEvalSubMode>('multiAiDiscussion')
  const [artworkContext, setArtworkContext] = useState('')
  const [maxRounds, setMaxRounds] = useState(2)
  const [selectedProviders, setSelectedProviders] = useState<AIProvider[]>([])
  const [roles, setRoles] = useState<RoleConfig[]>([])
  const [pacingMode, setPacingMode] = useState<PacingMode>('auto')
  const [autoDelay, setAutoDelay] = useState(5)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const configs = useSettingsStore((s) => s.configs)
  const startDebate = useDebateStore((s) => s.startDebate)

  const enabledProviders = useMemo(
    () => PROVIDERS.filter((p) => configs[p].enabled && configs[p].apiKey.trim().length > 0),
    [configs],
  )

  const canStart = !!artworkFile && selectedProviders.length >= 2

  const toggleProvider = (provider: AIProvider) => {
    setSelectedProviders((prev) => {
      const next = prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider]
      setRoles((prevRoles) => {
        const existing = new Map(prevRoles.map((r) => [r.provider, r]))
        return next.map((p) => existing.get(p) || { provider: p, role: '미술 비평가' })
      })
      return next
    })
  }

  const updateRole = (provider: AIProvider, role: string) => {
    setRoles((prev) =>
      prev.map((r) => (r.provider === provider ? { ...r, role } : r)),
    )
  }

  const handleImageUpload = async (file: File) => {
    if (!IMAGE_TYPES.includes(file.type)) return
    if (file.size > MAX_FILE_SIZE) return

    const dataUrl = await readFileAsDataUrl(file)
    setArtworkFile({
      id: generateId(),
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      dataUrl,
    })
  }

  const handleFileInputChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file) await handleImageUpload(file)
  }

  const handleCamera = async () => {
    const file = await capturePhoto()
    if (file) setArtworkFile(file)
  }

  const handleGallery = async () => {
    const file = await pickFromGallery()
    if (file) setArtworkFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file) void handleImageUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleStart = () => {
    if (!canStart || !artworkFile) return
    const topicLabel = artworkContext.trim()
      ? `아트워크 평가: ${artworkContext.trim().slice(0, 50)}`
      : '아트워크 평가'

    startDebate({
      mode: 'artworkEval',
      topic: topicLabel,
      maxRounds: subMode === 'multiAiDiscussion' ? maxRounds : 1,
      participants: selectedProviders,
      roles: subMode === 'roleBasedIndividual' ? roles : [],
      referenceText: '',
      useReference: false,
      referenceFiles: [],
      pacing: {
        mode: pacingMode,
        autoDelaySeconds: autoDelay,
      },
      artworkSubMode: subMode,
      artworkFile,
      artworkContext: artworkContext.trim() || undefined,
    })
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10 space-y-8">
      {/* Hero Title */}
      <div className="flex items-center gap-2 justify-center">
        <Palette className="w-4 h-4 text-accent" />
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">아트워크 평가</span>
      </div>

      {/* Image Upload Area */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">작품 이미지</label>

        {artworkFile ? (
          <div className="relative">
            <img
              src={artworkFile.dataUrl}
              alt="작품 미리보기"
              className="w-full max-h-[300px] object-contain rounded-xl border border-border bg-bg-surface"
            />
            <button
              onClick={() => setArtworkFile(null)}
              className="absolute top-2 right-2 p-1.5 bg-error text-white rounded-full shadow-lg hover:bg-error/80 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mt-1.5 flex justify-between items-center px-1">
              <span className="text-[10px] text-text-muted truncate max-w-[200px]">{artworkFile.filename}</span>
              <span className="text-[10px] text-text-muted">
                {artworkFile.size < 1024 * 1024
                  ? `${(artworkFile.size / 1024).toFixed(1)} KB`
                  : `${(artworkFile.size / 1024 / 1024).toFixed(1)} MB`}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label
              className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all
                border-accent/30 hover:border-accent/60 text-text-secondary hover:text-accent hover:bg-accent/5"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 text-accent/60" />
              <span className="text-sm font-medium">
                평가할 작품 이미지를 업로드하세요
              </span>
              <span className="text-[10px] text-text-muted">
                PNG, JPG, GIF, WebP | 최대 10MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept={IMAGE_EXTENSIONS}
                className="hidden"
                onChange={(e) => void handleFileInputChange(e.target.files)}
              />
            </label>

            {/* Camera / Gallery buttons (native only) */}
            {isCameraAvailable() && (
              <div className="flex gap-2">
                <button
                  onClick={() => void handleCamera()}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-bg-surface border border-border rounded-xl text-text-secondary hover:bg-bg-hover transition"
                >
                  <CameraIcon className="w-4 h-4" />
                  <span className="text-xs">카메라</span>
                </button>
                <button
                  onClick={() => void handleGallery()}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-bg-surface border border-border rounded-xl text-text-secondary hover:bg-bg-hover transition"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span className="text-xs">갤러리</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sub-mode Selection */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">평가 모드</label>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(SUB_MODE_LABELS) as ArtworkEvalSubMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setSubMode(m)}
              className={cn(
                'px-3 py-2.5 text-xs rounded-xl border transition-all text-left',
                subMode === m
                  ? 'bg-accent/10 border-accent/40 text-accent font-semibold shadow-sm'
                  : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover hover:border-border',
              )}
            >
              <div>{SUB_MODE_LABELS[m]}</div>
              <div className={cn(
                'text-[10px] mt-0.5',
                subMode === m ? 'text-accent/70' : 'text-text-muted',
              )}>{SUB_MODE_DESCRIPTIONS[m]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">참여 AI 선택</label>
        {enabledProviders.length < 2 && (
          <div className="flex items-center gap-2 text-warning text-xs bg-warning/10 px-3 py-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>사이드바에서 2개 이상의 AI를 활성화하고 API 키를 입력하세요</span>
          </div>
        )}
        <div className="flex gap-2">
          {enabledProviders.map((p) => {
            const selected = selectedProviders.includes(p)
            return (
              <button
                key={p}
                onClick={() => toggleProvider(p)}
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

      {/* Role Assignment (역할별 평가 모드) */}
      {subMode === 'roleBasedIndividual' && selectedProviders.length > 0 && (
        <div className="space-y-2.5">
          <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            🎭 평가 역할 배정
          </label>
          <div className="space-y-2 bg-bg-surface rounded-xl p-3 border border-border">
            {selectedProviders.map((p) => {
              const role = roles.find((r) => r.provider === p)?.role || '미술 비평가'
              return (
                <div key={p} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PROVIDER_COLORS[p] }}
                  />
                  <span className="text-xs text-text-secondary w-16 font-medium">{PROVIDER_LABELS[p]}</span>
                  <select
                    value={role}
                    onChange={(e) => updateRole(p, e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30"
                  >
                    {ARTWORK_ROLE_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.roles.map((roleValue) => {
                          const roleLabel = ARTWORK_ROLE_LABEL_MAP.get(roleValue)
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
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Rounds (only for multiAiDiscussion) */}
      {subMode === 'multiAiDiscussion' && (
        <div className="space-y-2.5">
          <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            라운드 수: <span className="text-accent font-bold text-xs">{maxRounds}</span>
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={maxRounds}
            onChange={(e) => setMaxRounds(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-[10px] text-text-muted px-0.5">
            <span>1</span>
            <span>5</span>
          </div>
        </div>
      )}

      {/* Context Input */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">피드백 방향 (선택)</label>
        <textarea
          value={artworkContext}
          onChange={(e) => setArtworkContext(e.target.value)}
          placeholder="예: 색감 위주로 평가해주세요, 캐릭터 디자인에 집중해서..."
          className="w-full px-4 py-3 text-sm bg-bg-surface border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition placeholder:text-text-muted/60"
          rows={2}
        />
      </div>

      {/* Turn Pacing */}
      <div className="space-y-3">
        <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">턴 속도 제어</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPacingMode('auto')}
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
            onClick={() => setPacingMode('manual')}
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
            {DELAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setAutoDelay(d)}
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

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!canStart}
        className={cn(
          'w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all',
          canStart
            ? 'bg-accent text-white hover:bg-accent-dim shadow-lg shadow-accent/20 active:scale-[0.98]'
            : 'bg-bg-surface text-text-muted cursor-not-allowed',
        )}
      >
        <Play className="w-4 h-4" />
        평가 시작
      </button>

      {/* Safe area spacer for home bar */}
      <div className="safe-area-bottom" />
    </div>
  )
}
