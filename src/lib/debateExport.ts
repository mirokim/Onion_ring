/**
 * Exports a completed/stopped debate as a .md file.
 * Native (Capacitor) → writes to Documents/OnionRing/
 * Web → silently skips (SQLite works fine on web)
 */
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { PROVIDER_LABELS, type AIProvider, type DiscussionMode, type DiscussionMessage } from '@/types'

const MODE_LABELS: Record<string, string> = {
  roundRobin: '라운드 로빈',
  freeDiscussion: '자유 토론',
  roleAssignment: '역할 배정',
  battle: '결전모드',
  artworkEval: '아트워크 평가',
}

interface DebateExportInfo {
  topic: string
  mode: DiscussionMode
  status: 'completed' | 'stopped'
  participants: AIProvider[]
  maxRounds: number
  actualRounds: number
  createdAt: number
}

function formatDate(ms: number): string {
  const d = new Date(ms)
  const Y = d.getFullYear()
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${Y}-${M}-${D}_${h}${m}`
}

function formatDateReadable(ms: number): string {
  const d = new Date(ms)
  const Y = d.getFullYear()
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${Y}.${M}.${D} ${h}:${m}`
}

function buildMarkdown(info: DebateExportInfo, messages: DiscussionMessage[]): string {
  const lines: string[] = []
  const isArtwork = info.mode === 'artworkEval'

  // Header
  lines.push(isArtwork ? `# 🎨 아트워크 평가 기록` : `# 📋 AI 토론 기록`)
  lines.push('')
  lines.push(`| 항목 | 내용 |`)
  lines.push(`|------|------|`)
  lines.push(`| **주제** | ${info.topic} |`)
  lines.push(`| **모드** | ${MODE_LABELS[info.mode] || info.mode} |`)
  lines.push(`| **상태** | ${info.status === 'completed' ? '✅ 완료' : '⏹ 중단'} |`)
  lines.push(`| **참여자** | ${info.participants.map((p) => PROVIDER_LABELS[p] || p).join(', ')} |`)
  lines.push(`| **라운드** | ${info.actualRounds}/${info.maxRounds} |`)
  lines.push(`| **일시** | ${formatDateReadable(info.createdAt)} |`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // Messages grouped by round
  let lastRound = 0
  for (const msg of messages) {
    if (msg.error) continue

    if (msg.round !== lastRound) {
      if (lastRound > 0) lines.push('')
      lines.push(`## 라운드 ${msg.round}`)
      lines.push('')
      lastRound = msg.round
    }

    const label = msg.provider === 'user'
      ? '👤 사용자'
      : `🤖 ${PROVIDER_LABELS[msg.provider as AIProvider] || msg.provider}`

    const roleTag = msg.roleName ? ` (${msg.roleName})` : ''
    lines.push(`### ${label}${roleTag}`)
    lines.push('')
    lines.push(msg.content)
    lines.push('')
  }

  lines.push('---')
  lines.push('*Onion Ring - AI 토론 앱으로 생성됨*')

  return lines.join('\n')
}

function sanitizeFilename(s: string): string {
  return s
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 40)
}

export async function exportDebateAsMarkdown(
  info: DebateExportInfo,
  messages: DiscussionMessage[],
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  const md = buildMarkdown(info, messages)
  const dateStr = formatDate(info.createdAt)
  const topicSlug = sanitizeFilename(info.topic)
  const filename = `${dateStr}_${topicSlug}.md`

  try {
    // Ensure directory exists
    try {
      await Filesystem.mkdir({
        path: 'OnionRing',
        directory: Directory.Documents,
        recursive: true,
      })
    } catch {
      // Directory already exists
    }

    await Filesystem.writeFile({
      path: `OnionRing/${filename}`,
      data: md,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    })

    console.log('[Export] Saved debate markdown:', filename)
  } catch (err) {
    console.error('[Export] Failed to save markdown:', err)
  }
}
