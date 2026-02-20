import { useState } from 'react'
import { FileText } from 'lucide-react'
import type { AIProvider, DiscussionMessage } from '@/types'
import { PROVIDER_LABELS, PROVIDER_COLORS } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  message: DiscussionMessage
}

export function MessageBubble({ message }: Props) {
  const isUser = message.provider === 'user'
  const isError = !!message.error
  const isJudgeEval = message.messageType === 'judge-evaluation'
  const isArtworkCritique = message.messageType === 'artwork-critique'
  const isArtworkScore = message.messageType === 'artwork-score'
  const isArtwork = isArtworkCritique || isArtworkScore
  const color = isUser ? '#fbbf24' : PROVIDER_COLORS[message.provider as AIProvider]
  const label = isUser ? 'You' : PROVIDER_LABELS[message.provider as AIProvider]
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  const judgeColor = '#f59e0b' // amber-500
  const artworkCritiqueColor = '#14b8a6' // teal-500
  const artworkScoreColor = '#a855f7' // purple-500

  return (
    <>
      <div className={cn(
        'flex gap-3 group',
        isError && 'opacity-50',
        isJudgeEval && 'bg-warning/5 rounded-xl p-3 border border-warning/20',
        isArtworkCritique && 'bg-[#14b8a6]/5 rounded-xl p-3 border border-[#14b8a6]/20',
        isArtworkScore && 'bg-[#a855f7]/5 rounded-xl p-3 border border-[#a855f7]/20',
      )}>
        {/* Color bar */}
        <div
          className={cn('shrink-0 rounded-full', (isJudgeEval || isArtwork) ? 'w-1' : 'w-0.5')}
          style={{ backgroundColor: isJudgeEval ? judgeColor : isArtworkScore ? artworkScoreColor : isArtworkCritique ? artworkCritiqueColor : color }}
        />

        {/* Content */}
        <div className="min-w-0 flex-1 py-1.5">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[11px] font-semibold tracking-wide"
              style={{ color: isJudgeEval ? judgeColor : isArtworkScore ? artworkScoreColor : isArtworkCritique ? artworkCritiqueColor : color }}
            >
              {label}
            </span>
            {/* 역할 배지 (역할 배정 모드 / 아트워크 역할별 평가) */}
            {message.roleName && !isJudgeEval && !isArtwork && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                {message.roleName}
              </span>
            )}
            {message.roleName && isArtworkCritique && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#14b8a6]/15 text-[#14b8a6]">
                🎨 {message.roleName}
              </span>
            )}
            {isArtworkCritique && !message.roleName && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#14b8a6]/15 text-[#14b8a6]">
                🎨 비평
              </span>
            )}
            {isArtworkScore && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#a855f7]/15 text-[#a855f7]">
                📊 채점
              </span>
            )}
            {isJudgeEval && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-warning/15 text-warning">
                ⚖️ 심판
              </span>
            )}
            <span className="text-[9px] text-text-muted font-medium px-1.5 py-0.5 rounded bg-bg-surface">
              R{message.round}
            </span>
            {isError && (
              <span className="text-[9px] text-error font-semibold px-1.5 py-0.5 rounded bg-error/10">오류</span>
            )}
          </div>

          {/* Attached files */}
          {message.files && message.files.length > 0 && (
            <div className="flex gap-2 mb-2.5 flex-wrap">
              {message.files.map((file) => (
                <div key={file.id} className="shrink-0">
                  {file.mimeType.startsWith('image/') ? (
                    <img
                      src={file.dataUrl}
                      alt={file.filename}
                      className="max-w-[200px] max-h-[150px] object-cover rounded-xl border border-border cursor-pointer hover:opacity-80 transition-all hover:shadow-lg"
                      onClick={() => setExpandedImage(file.dataUrl)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-bg-surface rounded-xl border border-border">
                      <FileText className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-xs text-text-secondary truncate max-w-[150px]">
                        {file.filename}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="text-[13px] text-text-primary whitespace-pre-wrap leading-[1.7]">
            {message.content}
          </div>
        </div>
      </div>

      {/* Image lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 cursor-pointer"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="확대 보기"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </>
  )
}
