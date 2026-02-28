/**
 * PromptStrategy interface for building system prompts
 * Each discussion mode implements this interface for consistent prompt generation
 */

import type { AIProvider, DiscussionConfig } from '@/types'
import { PROVIDER_LABELS } from '@/types'
import { SYSTEM_PROMPT_CONFIG } from '@/constants'
import { getRoleLabel, getRoleDescription, getArtworkRoleDescription, getArtworkRoleValue } from '@/lib/roleHelpers'

export interface PromptStrategy {
  build(config: DiscussionConfig, currentProvider: AIProvider): string
}

/**
 * Base class with common prompt building logic
 */
abstract class BaseStrategy implements PromptStrategy {
  protected buildBase(config: DiscussionConfig, currentProvider: AIProvider): string {
    const label = PROVIDER_LABELS[currentProvider]
    const participantList = config.participants
      .map((p) => PROVIDER_LABELS[p])
      .join(', ')

    return `당신은 "${label}"입니다. 여러 AI가 참여하는 토론에 참가하고 있습니다.
토론 주제: "${config.topic}"
참여자: ${participantList}

${SYSTEM_PROMPT_CONFIG.BASE_RULES}

${SYSTEM_PROMPT_CONFIG.ACCURACY_RULES}`
  }

  protected appendReference(prompt: string, config: DiscussionConfig): string {
    let result = prompt

    if (config.useReference && config.referenceText.trim()) {
      result += `\n\n참고 자료:\n"""\n${config.referenceText.trim()}\n"""\n\n위 참고 자료를 바탕으로 토론하세요. 자료의 내용을 인용하거나 분석하며 논의를 전개하세요.`
    }

    if (config.referenceFiles.length > 0) {
      result += `\n\n첨부된 이미지/문서 파일이 참고 자료로 제공됩니다. 해당 자료를 분석하고 토론에 활용하세요.`
    }

    return result
  }

  abstract build(config: DiscussionConfig, currentProvider: AIProvider): string
}

/**
 * Round Robin Mode: 순서 보장, 이전 발언자의 의견 참고
 */
export class RoundRobinStrategy extends BaseStrategy {
  build(config: DiscussionConfig, currentProvider: AIProvider): string {
    const base = this.buildBase(config, currentProvider)
    const mode = `토론 방식: 라운드 로빈 (순서대로 발언)
이전 발언자의 의견을 참고하여 동의/반박/보완하며 자신의 의견을 제시하세요.`

    return this.appendReference(`${base}\n\n${mode}`, config)
  }
}

/**
 * Free Discussion Mode: 자유로운 상호작용
 */
export class FreeDiscussionStrategy extends BaseStrategy {
  build(config: DiscussionConfig, currentProvider: AIProvider): string {
    const base = this.buildBase(config, currentProvider)
    const mode = `토론 방식: 자유 토론
다른 참여자의 의견에 자유롭게 반박, 동의, 질문, 보완을 하세요.
때로는 완전히 새로운 관점을 제시해도 좋습니다.`

    return this.appendReference(`${base}\n\n${mode}`, config)
  }
}

/**
 * Role Assignment Mode: 특정 역할/성격 부여
 */
export class RoleAssignmentStrategy extends BaseStrategy {
  build(config: DiscussionConfig, currentProvider: AIProvider): string {
    const base = this.buildBase(config, currentProvider)
    const roleConfig = config.roles.find((r) => r.provider === currentProvider)
    const roleValue = roleConfig?.role || 'neutral'
    const roleLabel = getRoleLabel(roleValue)
    const roleDescription = getRoleDescription(roleValue)

    const mode = `토론 방식: 역할 배정
당신에게 배정된 역할: **${roleLabel}**
${roleDescription}
이 역할의 관점과 말투를 일관되게 유지하며 논의하세요.`

    return this.appendReference(`${base}\n\n${mode}`, config)
  }
}

/**
 * Battle Mode: Judge 또는 Debater
 */
export class BattleStrategy extends BaseStrategy {
  private buildJudgePrompt(config: DiscussionConfig, currentProvider: AIProvider): string {
    const base = this.buildBase(config, currentProvider)
    const debaters = config.participants
      .filter((p) => p !== config.judgeProvider)
      .map((p) => PROVIDER_LABELS[p])
      .join(' vs ')

    const mode = `토론 방식: 결전모드 (심판)
당신은 이 토론의 **심판**입니다. 토론에 직접 참여하지 않습니다.
대결 구도: ${debaters}

각 라운드가 끝나면 다음 형식으로 평가하세요:

📊 **라운드 [N] 평가**

| 참여자 | 점수 (10점 만점) | 평가 |
|--------|-----------------|------|
| [AI이름] | X점 | 한줄 평가 |

💬 **심판 코멘트**: 이번 라운드의 핵심 쟁점과 각 참여자의 강점/약점을 분석하세요.
🏆 **라운드 승자**: [AI이름]

채점 기준: 논리성(3점), 근거의 질(3점), 반박력(2점), 설득력(2점)

최종 라운드에서는 추가로:
🏅 **최종 승자**: [AI이름]
📝 **종합 평가**: 전체 토론을 종합적으로 평가하고 각 참여자의 전체 성적을 정리하세요.`

    return this.appendReference(`${base}\n\n${mode}`, config)
  }

  private buildDebaterPrompt(config: DiscussionConfig, currentProvider: AIProvider): string {
    const base = this.buildBase(config, currentProvider)
    const label = PROVIDER_LABELS[currentProvider]
    const debaters = config.participants
      .filter((p) => p !== config.judgeProvider)
      .map((p) => PROVIDER_LABELS[p])
    const opponents = debaters.filter((n) => n !== label).join(', ')
    const judgeLabel = config.judgeProvider
      ? PROVIDER_LABELS[config.judgeProvider]
      : '심판'

    // Check if this debater has a role assigned
    const roleConfig = config.roles.find((r) => r.provider === currentProvider)
    const roleValue = roleConfig?.role
    const roleLabel = roleValue ? getRoleLabel(roleValue) : undefined
    const roleDescription = roleValue ? getRoleDescription(roleValue) : ''
    const roleSection = roleLabel && roleLabel !== '중립'
      ? `\n\n당신의 캐릭터: **${roleLabel}**\n${roleDescription}\n이 캐릭터의 말투와 성격을 유지하면서 토론하세요.`
      : ''

    const mode = `토론 방식: 결전모드 (토론자)
이것은 경쟁 토론입니다. 상대방: ${opponents}
심판: ${judgeLabel} (매 라운드 채점)

목표: 심판에게 높은 점수를 받아 승리하세요.
- 강력한 논거와 구체적 근거를 제시하세요.
- 상대방의 약점을 정확히 지적하고 반박하세요.
- 논리성, 근거의 질, 반박력, 설득력이 채점 기준입니다.
- 심판의 이전 피드백을 반영하여 전략을 조정하세요.${roleSection}`

    return this.appendReference(`${base}\n\n${mode}`, config)
  }

  build(config: DiscussionConfig, currentProvider: AIProvider): string {
    const isJudge = config.judgeProvider === currentProvider
    return isJudge
      ? this.buildJudgePrompt(config, currentProvider)
      : this.buildDebaterPrompt(config, currentProvider)
  }
}

/**
 * Artwork Evaluation Mode
 */
export class ArtworkEvalStrategy extends BaseStrategy {
  build(config: DiscussionConfig, currentProvider: AIProvider): string {
    const label = PROVIDER_LABELS[currentProvider]
    const participantList = config.participants
      .map((p) => PROVIDER_LABELS[p])
      .join(', ')

    const contextNote = config.artworkContext
      ? `\n작가/사용자 설명: "${config.artworkContext}"`
      : ''

    const subMode = config.artworkSubMode || 'multiAiDiscussion'

    let prompt = ''

    switch (subMode) {
      case 'multiAiDiscussion':
        prompt = `당신은 "${label}"입니다. 여러 AI가 참여하는 아트워크 평가 토론에 참가하고 있습니다.
참여자: ${participantList}
${contextNote}

첨부된 이미지는 평가 대상 일러스트/드로잉 작품입니다.

규칙:
- 한국어로 답변하세요.
- 작품에 대한 구체적이고 건설적인 비평을 제공하세요 (200~400자).
- 다른 참여자의 의견을 구체적으로 언급하며 발전시키세요.
- "[GPT]:", "[Claude]:", "[Gemini]:" 형식의 라벨은 다른 참여자의 발언입니다.
- "[User]:" 라벨은 사용자의 개입입니다. 사용자의 질문이나 요청에 우선적으로 응답하세요.
- 구도, 색감, 기법, 독창성, 감정 전달, 완성도 등 다양한 측면을 다루세요.
- 강점과 개선점을 균형 있게 제시하세요.
- 미술 이론이나 역사적 참고점이 있다면 언급하세요.

${SYSTEM_PROMPT_CONFIG.ACCURACY_RULES}`
        break

      case 'roleBasedIndividual': {
        const roleConfig = config.roles.find((r) => r.provider === currentProvider)
        const roleLabel = roleConfig?.role || '미술 비평가'
        const roleDescription = getArtworkRoleDescription(getArtworkRoleValue(roleLabel))

        prompt = `당신은 "${roleLabel}" 역할의 "${label}"입니다.
첨부된 이미지는 평가 대상 일러스트/드로잉 작품입니다.
${contextNote}

${roleDescription}

규칙:
- 한국어로 답변하세요.
- 당신의 전문 분야 관점에서 독립적으로 이 작품을 평가하세요.
- 다른 AI의 의견을 참고하지 말고 독자적 비평을 제공하세요.
- 강점과 개선점을 구체적으로 제시하세요 (300~500자).
- 전문가적 깊이와 함께 이해하기 쉬운 설명을 제공하세요.

${SYSTEM_PROMPT_CONFIG.ACCURACY_RULES}`
        break
      }

      case 'scoreFeedback':
        prompt = `당신은 전문 미술 평가위원 "${label}"입니다.
첨부된 이미지를 다음 평가 기준에 따라 채점하고 피드백을 제공하세요.
${contextNote}

다음 형식으로 정확히 답변하세요:

📊 **평가 점수**

| 항목 | 점수 (10점 만점) | 코멘트 |
|------|-----------------|--------|
| 구도 | X점 | 한줄 평가 |
| 색감 | X점 | 한줄 평가 |
| 독창성 | X점 | 한줄 평가 |
| 기법 | X점 | 한줄 평가 |
| 감정 전달 | X점 | 한줄 평가 |
| 완성도 | X점 | 한줄 평가 |

**총점**: XX / 60점

💬 **종합 피드백**: (200~300자로 전반적인 평가와 개선 제안을 서술)

🌟 **강점**: (가장 돋보이는 2-3가지)

📝 **개선점**: (발전 가능한 2-3가지)

규칙:
- 한국어로 답변하세요.
- 위 형식을 정확히 지켜주세요.
- 각 항목의 점수는 1~10 사이의 정수로 부여하세요.
- 코멘트는 구체적이고 건설적으로 작성하세요.

${SYSTEM_PROMPT_CONFIG.ACCURACY_RULES}`
        break

      default:
        prompt = `당신은 "${label}"입니다. 첨부된 이미지 작품을 평가해주세요.\n${SYSTEM_PROMPT_CONFIG.ACCURACY_RULES}`
    }

    return prompt
  }
}
