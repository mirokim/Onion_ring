/**
 * PromptBuilder: Factory for building system prompts using strategy pattern
 * Simplifies debateEngine.ts by centralizing prompt logic
 */

import type { AIProvider, DiscussionConfig, DiscussionMode } from '@/types'
import {
  RoundRobinStrategy,
  FreeDiscussionStrategy,
  RoleAssignmentStrategy,
  BattleStrategy,
  ArtworkEvalStrategy,
  type PromptStrategy,
} from './strategies'

/**
 * PromptBuilder uses Strategy pattern to build system prompts
 * Each discussion mode has its own strategy class
 */
export class PromptBuilder {
  private strategies: Record<DiscussionMode, PromptStrategy> = {
    roundRobin: new RoundRobinStrategy(),
    freeDiscussion: new FreeDiscussionStrategy(),
    roleAssignment: new RoleAssignmentStrategy(),
    battle: new BattleStrategy(),
    artworkEval: new ArtworkEvalStrategy(),
  }

  /**
   * Build system prompt for current provider in given discussion
   * @param config - Discussion configuration
   * @param currentProvider - AI provider to build prompt for
   * @returns System prompt string
   */
  buildSystemPrompt(config: DiscussionConfig, currentProvider: AIProvider): string {
    const strategy = this.strategies[config.mode]
    if (!strategy) {
      throw new Error(`Unknown discussion mode: ${config.mode}`)
    }
    return strategy.build(config, currentProvider)
  }

  /**
   * Build multiple prompts for all participants
   * Useful for validation or batch operations
   */
  buildAllPrompts(config: DiscussionConfig): Record<AIProvider, string> {
    const prompts: Record<string, string> = {}
    for (const provider of config.participants) {
      prompts[provider] = this.buildSystemPrompt(config, provider)
    }
    return prompts as Record<AIProvider, string>
  }
}

/**
 * Global instance for singleton usage
 */
export const promptBuilder = new PromptBuilder()
