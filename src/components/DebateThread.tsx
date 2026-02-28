import { useEffect, useRef } from 'react'
import { useDebateStore } from '@/stores/debateStore'
import { MessageBubble } from './MessageBubble'
import { PROVIDER_LABELS, PROVIDER_COLORS, type AIProvider } from '@/types'
import { MessageCircle } from 'lucide-react'

function TypingIndicator({ provider }: { provider: AIProvider }) {
  const color = PROVIDER_COLORS[provider]
  const label = PROVIDER_LABELS[provider]

  return (
    <div className="flex gap-3 animate-fade-in-up">
      <div className="w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="py-2">
        <span className="text-xs font-semibold" style={{ color }}>
          {label}
        </span>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-text-muted" />
          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-text-muted" />
          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-text-muted" />
        </div>
      </div>
    </div>
  )
}

export function DebateThread() {
  // Optimized: Group debateStore selectors
  const { messages, loadingProvider } = useDebateStore((s) => ({
    messages: s.messages,
    loadingProvider: s.loadingProvider,
  }))
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [messages.length, loadingProvider])

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.length === 0 && !loadingProvider && (
        <div className="flex flex-col items-center justify-center h-full text-text-muted gap-3">
          <div className="w-12 h-12 rounded-2xl bg-bg-surface flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <p className="text-sm">토론이 시작되면 여기에 대화가 표시됩니다</p>
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className="animate-fade-in-up">
          <MessageBubble message={msg} />
        </div>
      ))}

      {loadingProvider && <TypingIndicator provider={loadingProvider} />}
    </div>
  )
}
