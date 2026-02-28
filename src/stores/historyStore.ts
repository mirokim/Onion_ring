import { create } from 'zustand'
import { debateDB, type StoredDebate, type StoredMessage, type StoredReferenceFile } from '@/db/debateDB'
import { MESSAGE_CONFIG } from '@/constants'
import type { DiscussionMessage, ReferenceFile } from '@/types'
import { generateId } from '@/lib/utils'

const PAGE_SIZE = MESSAGE_CONFIG.PAGE_SIZE

interface HistoryState {
  debates: StoredDebate[]
  selectedDebateId: string | null
  selectedMessages: StoredMessage[]
  isLoading: boolean
  error: string | null
  hasMore: boolean

  loadDebates: () => Promise<void>
  loadMore: () => Promise<void>
  selectDebate: (id: string) => Promise<void>
  clearSelection: () => void
  deleteDebate: (id: string) => Promise<void>
  clearError: () => void
  saveDebate: (
    debate: Omit<StoredDebate, 'id' | 'completedAt'>,
    messages: DiscussionMessage[],
    referenceFiles?: ReferenceFile[],
  ) => Promise<void>
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  debates: [],
  selectedDebateId: null,
  selectedMessages: [],
  isLoading: false,
  error: null,
  hasMore: false,

  loadDebates: async () => {
    set({ isLoading: true, error: null })
    try {
      await debateDB.init()
      const debates = debateDB.getDebatesPage(PAGE_SIZE, 0)
      const total = debateDB.getDebateCount()
      set({ debates, hasMore: debates.length < total })
    } catch (err) {
      console.error('[History] Failed to load debates:', err)
      set({ error: '토론 기록을 불러오지 못했습니다' })
    } finally {
      set({ isLoading: false })
    }
  },

  loadMore: async () => {
    const { debates, hasMore, isLoading } = get()
    if (!hasMore || isLoading) return
    set({ isLoading: true, error: null })
    try {
      await debateDB.init()
      const next = debateDB.getDebatesPage(PAGE_SIZE, debates.length)
      const total = debateDB.getDebateCount()
      const merged = [...debates, ...next]
      set({ debates: merged, hasMore: merged.length < total })
    } catch (err) {
      console.error('[History] Failed to load more debates:', err)
      set({ error: '추가 기록을 불러오지 못했습니다' })
    } finally {
      set({ isLoading: false })
    }
  },

  selectDebate: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await debateDB.init()
      const messages = debateDB.getMessagesByDebateId(id)
      set({ selectedDebateId: id, selectedMessages: messages })
    } catch (err) {
      console.error('[History] Failed to load debate:', err)
      set({ error: '토론 내용을 불러오지 못했습니다' })
    } finally {
      set({ isLoading: false })
    }
  },

  clearSelection: () => {
    set({ selectedDebateId: null, selectedMessages: [] })
  },

  clearError: () => {
    set({ error: null })
  },

  deleteDebate: async (id) => {
    try {
      await debateDB.init()
      debateDB.deleteDebate(id)
      // If we were viewing this debate, clear selection
      if (get().selectedDebateId === id) {
        set({ selectedDebateId: null, selectedMessages: [] })
      }
      // Reload list
      await get().loadDebates()
    } catch (err) {
      console.error('[History] Failed to delete debate:', err)
      set({ error: '토론 삭제에 실패했습니다' })
    }
  },

  saveDebate: async (debateInfo, messages, referenceFiles) => {
    const debateId = generateId()
    const storedDebate: StoredDebate = {
      ...debateInfo,
      id: debateId,
      completedAt: Date.now(),
    }

    const storedMessages: StoredMessage[] = messages.map((msg) => ({
      id: msg.id,
      debateId,
      provider: msg.provider,
      content: msg.content,
      round: msg.round,
      timestamp: msg.timestamp,
      error: msg.error,
      messageType: msg.messageType,
      roleName: msg.roleName,
    }))

    let storedFiles: StoredReferenceFile[] | undefined
    if (referenceFiles && referenceFiles.length > 0) {
      storedFiles = referenceFiles.map((file) => {
        const base64Data = file.dataUrl.split(',')[1] || ''
        const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
        return {
          id: file.id,
          debateId,
          filename: file.filename,
          mimeType: file.mimeType,
          size: file.size,
          data: binaryData,
          textContent: file.textContent,
          uploadedAt: Date.now(),
        }
      })
    }

    try {
      await debateDB.init()
      debateDB.saveDebateBundle(storedDebate, storedMessages, storedFiles)
      // Reload list
      await get().loadDebates()
    } catch (err) {
      console.error('[History] Failed to save debate:', err)
      set({ error: '토론 저장에 실패했습니다' })
    }
  },
}))
