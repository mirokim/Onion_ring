import type {
  AIProvider,
  AIConfig,
  ApiMessage,
  DiscussionConfig,
  DiscussionMessage,
  DebateCallbacks,
  ReferenceFile,
  ContentBlock,
} from '@/types'
import { PROVIDER_LABELS } from '@/types'
import { MESSAGE_CONFIG } from '@/constants'
import { extractBase64FromDataUrl } from '@/lib/fileHandling'
import { createLogger } from '@/lib/logger'
import { promptBuilder } from './prompts/builder'
import { callProvider } from './providers'
import { generateId } from '@/lib/utils'

const logger = createLogger('DebateEngine')

// ── Build file content blocks ──

function buildFileBlocks(files: ReferenceFile[]): ContentBlock[] {
  const blocks: ContentBlock[] = []
  for (const file of files) {
    const base64Data = extractBase64FromDataUrl(file.dataUrl)
    if (file.mimeType.startsWith('image/')) {
      blocks.push({ type: 'image', mimeType: file.mimeType, data: base64Data })
    } else if (file.mimeType === 'application/pdf') {
      blocks.push({ type: 'document', mimeType: file.mimeType, data: base64Data })
    }
  }
  return blocks
}

// ── Message Formatting ──

function buildApiMessages(
  allMessages: DiscussionMessage[],
  currentProvider: AIProvider,
  referenceFiles: ReferenceFile[],
  isFirstCall: boolean,
  isArtworkMode?: boolean,
): ApiMessage[] {
  const recent = allMessages.slice(-MESSAGE_CONFIG.MAX_RECENT_MESSAGES)
  const fileBlocks = isFirstCall && referenceFiles.length > 0
    ? buildFileBlocks(referenceFiles)
    : []

  // If this is the first message (no history), add the topic as initial prompt
  if (recent.length === 0) {
    const text = isArtworkMode
      ? '이 작품을 평가해주세요. 첨부된 이미지를 분석하고 피드백을 제공하세요.'
      : '토론을 시작해주세요. 주제에 대한 당신의 의견을 먼저 제시하세요.'
    if (fileBlocks.length > 0) {
      return [{ role: 'user', content: [{ type: 'text', text }, ...fileBlocks] }]
    }
    return [{ role: 'user', content: text }]
  }

  return recent.map((msg, index) => {
    if (msg.provider === currentProvider) {
      return { role: 'assistant', content: msg.content }
    }

    const label = msg.provider === 'user'
      ? 'User'
      : PROVIDER_LABELS[msg.provider as AIProvider]
    const prefix = msg.provider === 'user' ? '[User]' : `[${label}]`
    const judgeTag = msg.messageType === 'judge-evaluation' ? ' (심판 평가)' : ''
    const text = `${prefix}${judgeTag}: ${msg.content}`

    // Build content blocks for this message
    const msgFileBlocks = msg.files && msg.files.length > 0
      ? buildFileBlocks(msg.files)
      : []

    // Inject reference files into the first user-role message of the first call
    const extraBlocks = index === 0 ? [...fileBlocks, ...msgFileBlocks] : msgFileBlocks

    if (extraBlocks.length > 0) {
      return { role: 'user', content: [{ type: 'text' as const, text }, ...extraBlocks] }
    }

    return { role: 'user', content: text }
  })
}

// ── Judge-specific message builder ──

function buildJudgeApiMessages(
  allMessages: DiscussionMessage[],
  currentRound: number,
  judgeProvider: AIProvider,
): ApiMessage[] {
  // Include all non-judge messages for context (use a larger window for judges)
  const relevantMessages = allMessages.filter((msg) => msg.provider !== judgeProvider || msg.messageType === 'judge-evaluation')
  const recent = relevantMessages.slice(-MESSAGE_CONFIG.MAX_RECENT_MESSAGES * 2) // Judges need more context

  if (recent.length === 0) {
    return [{ role: 'user', content: `라운드 ${currentRound}의 토론을 평가해주세요.` }]
  }

  const messages: ApiMessage[] = recent.map((msg) => {
    // Judge's own previous evaluations → assistant role
    if (msg.provider === judgeProvider) {
      return { role: 'assistant', content: msg.content }
    }

    const label = msg.provider === 'user'
      ? 'User'
      : PROVIDER_LABELS[msg.provider as AIProvider]
    return {
      role: 'user',
      content: `[${label}] (라운드 ${msg.round}): ${msg.content}`,
    }
  })

  messages.push({
    role: 'user',
    content: `위 토론 내용을 바탕으로 라운드 ${currentRound}을 평가해주세요.${currentRound === allMessages[0]?.round ? '' : ` (총 ${allMessages.filter((m) => m.round === currentRound && m.provider !== judgeProvider && m.provider !== 'user').length}명의 토론자 발언 완료)`}`,
  })

  return messages
}

// ── Sleep utility ──

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Pacing helper ──

async function doPacing(
  config: DiscussionConfig,
  callbacks: DebateCallbacks,
  signal: AbortSignal,
): Promise<boolean> {
  if (signal.aborted) return false

  if (config.pacing.mode === 'manual') {
    callbacks.onCountdownTick(-1)
    await callbacks.waitForNextTurn()
    if (signal.aborted) return false
    if (callbacks.getStatus() !== 'running') return false
    callbacks.onCountdownTick(0)
  } else {
    const totalSeconds = config.pacing.autoDelaySeconds
    for (let s = totalSeconds; s > 0; s--) {
      if (signal.aborted) return false
      while (callbacks.getStatus() === 'paused') {
        await sleep(500)
        if (signal.aborted) return false
      }
      if (callbacks.getStatus() !== 'running') return false
      callbacks.onCountdownTick(s)
      await sleep(1000)
    }
    callbacks.onCountdownTick(0)
  }

  return true
}

// ── Wait while paused helper ──

async function waitWhilePaused(
  callbacks: DebateCallbacks,
  signal: AbortSignal,
): Promise<boolean> {
  while (callbacks.getStatus() === 'paused') {
    await sleep(500)
    if (signal.aborted) return false
  }
  return callbacks.getStatus() === 'running'
}

// ── Main Debate Engine ──

export async function runDebate(
  config: DiscussionConfig,
  providerConfigs: Record<AIProvider, AIConfig>,
  callbacks: DebateCallbacks,
  signal: AbortSignal,
): Promise<void> {
  logger.info('Starting debate', {
    topic: config.topic,
    mode: config.mode,
    participants: config.participants,
    maxRounds: config.maxRounds,
  })

  let consecutiveErrors = 0
  const providersFirstCallDone = new Set<AIProvider>()

  // Battle mode: separate debaters from judge
  const isBattleMode = config.mode === 'battle' && !!config.judgeProvider
  const isArtworkMode = config.mode === 'artworkEval'
  const turnParticipants = isBattleMode
    ? config.participants.filter((p) => p !== config.judgeProvider)
    : config.participants

  // For artwork individual/score sub-modes, force 1 round
  const effectiveMaxRounds = isArtworkMode
    && (config.artworkSubMode === 'roleBasedIndividual' || config.artworkSubMode === 'scoreFeedback')
    ? 1
    : config.maxRounds

  // Helper: get role name for a provider
  const getRoleName = (provider: AIProvider): string | undefined => {
    if (config.mode === 'battle' && config.judgeProvider === provider) {
      return '심판'
    }
    if (config.mode === 'roleAssignment' || config.mode === 'battle') {
      const rc = config.roles.find((r) => r.provider === provider)
      if (rc?.role && rc.role !== '중립') return rc.role
    }
    if (isArtworkMode && config.artworkSubMode === 'roleBasedIndividual') {
      const rc = config.roles.find((r) => r.provider === provider)
      if (rc?.role) return rc.role
    }
    return undefined
  }

  // Helper: get message type for artwork mode
  const getArtworkMessageType = (): 'artwork-critique' | 'artwork-score' | undefined => {
    if (!isArtworkMode) return undefined
    if (config.artworkSubMode === 'scoreFeedback') return 'artwork-score'
    return 'artwork-critique'
  }

  callbacks.onStatusChange('running')

  // Merge artworkFile into referenceFiles for image sending
  const effectiveRefFiles = isArtworkMode && config.artworkFile
    ? [config.artworkFile, ...config.referenceFiles]
    : config.referenceFiles

  for (let round = 1; round <= effectiveMaxRounds; round++) {
    // ── Debater turns ──
    for (let turnIndex = 0; turnIndex < turnParticipants.length; turnIndex++) {
      // Check abort
      if (signal.aborted) return

      // Wait while paused
      if (!await waitWhilePaused(callbacks, signal)) return

      const provider = turnParticipants[turnIndex]!
      const providerConfig = providerConfigs[provider]

      // Skip if provider not configured
      if (!providerConfig || !providerConfig.apiKey.trim()) {
        continue
      }

      callbacks.onRoundChange(round, turnIndex)
      callbacks.onLoadingChange(provider)

      // Build prompt and messages
      const isFirstCall = !providersFirstCallDone.has(provider)
      const systemPrompt = promptBuilder.buildSystemPrompt(config, provider)
      const apiMessages = buildApiMessages(
        callbacks.getMessages(),
        provider,
        effectiveRefFiles,
        isFirstCall,
        isArtworkMode,
      )

      // Call the AI
      logger.debug(`Calling ${PROVIDER_LABELS[provider]} for round ${round}`, {
        model: providerConfig.model,
        messageCount: apiMessages.length,
      })

      try {
        const response = await callProvider(
          provider,
          providerConfig.apiKey,
          providerConfig.model,
          systemPrompt,
          apiMessages,
          signal,
        )

        // If aborted during the call, exit gracefully
        if (signal.aborted) return

        callbacks.onLoadingChange(null)

        // Create message
        const isError = response.stopReason === 'error'
        const message: DiscussionMessage = {
          id: generateId(),
          provider,
          content: response.content,
          round,
          timestamp: Date.now(),
          error: isError ? response.content : undefined,
          messageType: getArtworkMessageType(),
          roleName: getRoleName(provider),
        }

        callbacks.onMessage(message)

        if (!isError) {
          logger.debug(`${PROVIDER_LABELS[provider]} responded successfully`, {
            contentLength: response.content.length,
            stopReason: response.stopReason,
          })
        } else {
          logger.warn(`${PROVIDER_LABELS[provider]} returned error`, {
            error: response.content,
          })
        }

        // Mark first call done (only on success)
        if (!isError) {
          providersFirstCallDone.add(provider)
        }

        // Track consecutive errors
        if (isError) {
          consecutiveErrors++
          if (consecutiveErrors >= 2) {
            logger.warn('Multiple consecutive errors, pausing debate')
            callbacks.onStatusChange('paused')
            if (!await waitWhilePaused(callbacks, signal)) return
            consecutiveErrors = 0
          }
        } else {
          consecutiveErrors = 0
        }
      } catch (error) {
        logger.error(`API call failed for ${PROVIDER_LABELS[provider]}`, error as Error, {
          round,
          provider,
        })
        callbacks.onLoadingChange(null)
        callbacks.onStatusChange('error')
        return
      }

      // ── Pacing between turns ──
      if (!await doPacing(config, callbacks, signal)) return
    }

    // ── Judge turn (battle mode only) ──
    if (isBattleMode && config.judgeProvider) {
      if (signal.aborted) return
      if (!await waitWhilePaused(callbacks, signal)) return

      const judgeProvider = config.judgeProvider
      const judgeConfig = providerConfigs[judgeProvider]

      if (judgeConfig && judgeConfig.apiKey.trim()) {
        callbacks.onLoadingChange(judgeProvider)

        const judgeSystemPrompt = promptBuilder.buildSystemPrompt(config, judgeProvider)
        const judgeMessages = buildJudgeApiMessages(
          callbacks.getMessages(),
          round,
          judgeProvider,
        )

        const judgeResponse = await callProvider(
          judgeProvider,
          judgeConfig.apiKey,
          judgeConfig.model,
          judgeSystemPrompt,
          judgeMessages,
          signal,
        )

        if (signal.aborted) return
        callbacks.onLoadingChange(null)

        const isError = judgeResponse.stopReason === 'error'
        const judgeMessage: DiscussionMessage = {
          id: generateId(),
          provider: judgeProvider,
          content: judgeResponse.content,
          round,
          timestamp: Date.now(),
          error: isError ? judgeResponse.content : undefined,
          messageType: 'judge-evaluation',
          roleName: '심판',
        }

        callbacks.onMessage(judgeMessage)

        if (!isError) {
          providersFirstCallDone.add(judgeProvider)
        }

        if (isError) {
          consecutiveErrors++
          if (consecutiveErrors >= 2) {
            callbacks.onStatusChange('paused')
            if (!await waitWhilePaused(callbacks, signal)) return
            consecutiveErrors = 0
          }
        } else {
          consecutiveErrors = 0
        }

        // Pacing after judge turn
        if (!await doPacing(config, callbacks, signal)) return
      }
    }
  }

  callbacks.onLoadingChange(null)
  callbacks.onStatusChange('completed')
}
