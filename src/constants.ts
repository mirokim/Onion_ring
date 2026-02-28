/**
 * Centralized constants file
 * Consolidates all application-wide constants for easier maintenance and consistency
 */

// ── File Handling ──

export const FILE_HANDLING = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5,
  ACCEPTED_TYPES: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'] as const,
  ACCEPTED_EXTENSIONS: '.png,.jpg,.jpeg,.gif,.webp,.pdf',
} as const

// ── Topic Input Limits ──

export const TOPIC_INPUT = {
  REFERENCE_MAX_LENGTH: 10_000,
  MIN_PARTICIPANTS: 2,
  MAX_PARTICIPANTS: 4,
  DEFAULT_MAX_ROUNDS: 3,
  DELAY_OPTIONS: [5, 10, 15, 30] as const,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5,
  ACCEPTED_TYPES: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'] as const,
  ACCEPTED_EXTENSIONS: '.png,.jpg,.jpeg,.gif,.webp,.pdf',
} as const

// ── API and Network ──

export const API_CONFIG = {
  TIMEOUT_MS: 30_000,
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 1000,
} as const

// ── Message Threading ──

export const MESSAGE_CONFIG = {
  MAX_RECENT_MESSAGES: 15, // For context window in API calls
  PAGE_SIZE: 50, // For history pagination
} as const

// ── UI Timing ──

export const UI_TIMING = {
  SHARE_SUCCESS_DURATION: 2500,
  TYPING_ANIMATION_DELAY: 200,
  SMOOTH_SCROLL_DURATION: 300,
} as const

// ── System Prompts Constants ──

export const SYSTEM_PROMPT_CONFIG = {
  ACCURACY_RULES: `정확성 및 신뢰성 원칙 (반드시 준수):
- 사실 관계를 언급할 때는 반드시 출처를 밝히거나 링크를 제공하세요.
- 사실, 이름, 도구, 기능, 날짜, 통계, 인용구, 출처 또는 예시를 절대 지어내지 마세요.
- 모르는 정보에 대해서는 말을 지어내지 말고 반드시 "모릅니다" 또는 "확인이 필요합니다"라고 답하세요. 모른다고 말하는 것이 틀린 답보다 낫습니다.
- 항상 현재 기준 최신 정보를 기반으로 답변하세요. 오래된 정보는 그 시점을 명시하세요.
- 명시적으로 요청받지 않는 한 과장, 설득, 추측 또는 스토리텔링을 피하세요.
- 사용자의 의도, 제약 조건, 선호도 또는 목표를 추론하지 마세요. 불확실하면 추측 대신 질문하세요.
- 확신도가 95% 미만인 정보는 불확실성을 명확히 밝히세요. 예: "확인이 필요합니다", "정보가 부족합니다", "~로 알고 있으나 검증이 필요합니다".`,

  BASE_RULES: `규칙:
- 한국어로 답변하세요.
- 간결하고 핵심적으로 답변하세요 (200~400자).
- 다른 참여자의 의견을 구체적으로 언급하며 발전시키세요.
- "[GPT]:", "[Claude]:", "[Gemini]:" 형식의 라벨은 다른 참여자의 발언입니다.
- "[User]:" 라벨은 토론을 지켜보는 사용자의 개입입니다. 사용자의 질문이나 요청에 우선적으로 응답하세요.`,
} as const

// ── Score Ranges ──

export const SCORE_RANGES = {
  MIN: 1,
  MAX: 10,
  BATTLE_MAX: 60,
} as const

// ── Database ──

export const DATABASE_CONFIG = {
  IDB_NAME: 'OnionRingDebateStore',
  IDB_STORE: 'databases',
  IDB_KEY: 'debate-main-db',
  WASM_PATH_DEV: '/sql-wasm.wasm',
} as const
