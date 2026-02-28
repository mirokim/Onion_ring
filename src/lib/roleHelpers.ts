/**
 * Role and description helper utilities
 * Eliminates repeated lookups and type conversions
 */

import {
  ROLE_OPTIONS,
  ROLE_DESCRIPTIONS,
  ARTWORK_ROLE_OPTIONS,
  ARTWORK_ROLE_DESCRIPTIONS,
} from '@/types'

/**
 * Map of role values to labels for quick lookup
 */
const ROLE_VALUE_TO_LABEL_MAP = new Map(ROLE_OPTIONS.map((r) => [r.value, r.label]))

/**
 * Map of role labels to values for reverse lookup
 */
const ROLE_LABEL_TO_VALUE_MAP = new Map(ROLE_OPTIONS.map((r) => [r.label, r.value]))

/**
 * Artwork role map (same pattern)
 */
const ARTWORK_ROLE_VALUE_TO_LABEL_MAP = new Map(ARTWORK_ROLE_OPTIONS.map((r) => [r.value, r.label]))
const ARTWORK_ROLE_LABEL_TO_VALUE_MAP = new Map(ARTWORK_ROLE_OPTIONS.map((r) => [r.label, r.value]))

/**
 * Type guards and key types
 */
type RoleValue = typeof ROLE_OPTIONS[number]['value']
type RoleLabel = typeof ROLE_OPTIONS[number]['label']
type ArtworkRoleValue = typeof ARTWORK_ROLE_OPTIONS[number]['value']
type ArtworkRoleLabel = typeof ARTWORK_ROLE_OPTIONS[number]['label']

/**
 * Gets the description for a regular role
 * @param roleValue - the role value (e.g., 'pro', 'con')
 */
export function getRoleDescription(roleValue: string): string {
  return ROLE_DESCRIPTIONS[roleValue as RoleValue] || ''
}

/**
 * Gets the label for a role value
 * @param roleValue - the role value (e.g., 'pro')
 * @return the label (e.g., '찬성')
 */
export function getRoleLabel(roleValue: string): string {
  return ROLE_VALUE_TO_LABEL_MAP.get(roleValue as RoleValue) || '중립'
}

/**
 * Gets the value for a role label (reverse lookup)
 * @param roleLabel - the role label (e.g., '찬성')
 * @return the value (e.g., 'pro')
 */
export function getRoleValue(roleLabel: string): string {
  return ROLE_LABEL_TO_VALUE_MAP.get(roleLabel as RoleLabel) || 'neutral'
}

/**
 * Gets both label and description for a role
 * Used when building system prompts
 */
export function getRoleInfo(roleValue: string): { label: string; description: string } {
  return {
    label: getRoleLabel(roleValue),
    description: getRoleDescription(roleValue),
  }
}

/**
 * Same pattern for artwork roles
 */
export function getArtworkRoleDescription(roleValue: string): string {
  return ARTWORK_ROLE_DESCRIPTIONS[roleValue as ArtworkRoleValue] || ''
}

export function getArtworkRoleLabel(roleValue: string): string {
  return ARTWORK_ROLE_VALUE_TO_LABEL_MAP.get(roleValue as ArtworkRoleValue) || '미술 비평가'
}

export function getArtworkRoleValue(roleLabel: string): string {
  return ARTWORK_ROLE_LABEL_TO_VALUE_MAP.get(roleLabel as ArtworkRoleLabel) || 'critic'
}

export function getArtworkRoleInfo(roleValue: string): { label: string; description: string } {
  return {
    label: getArtworkRoleLabel(roleValue),
    description: getArtworkRoleDescription(roleValue),
  }
}

/**
 * Looks up role info by label (for when you have role label instead of value)
 * @param roleLabel - the role label (e.g., '찬성')
 * @param isArtwork - whether to use artwork role system
 */
export function getRoleInfoByLabel(roleLabel: string, isArtwork = false): { label: string; description: string; value: string } {
  if (isArtwork) {
    const value = getArtworkRoleValue(roleLabel)
    return {
      label: roleLabel,
      description: getArtworkRoleDescription(value),
      value,
    }
  }

  const value = getRoleValue(roleLabel)
  return {
    label: roleLabel,
    description: getRoleDescription(value),
    value,
  }
}

/**
 * Validates if a role exists
 */
export function isValidRole(roleValue: string, isArtwork = false): boolean {
  if (isArtwork) {
    return ARTWORK_ROLE_OPTIONS.some((r) => r.value === roleValue)
  }
  return ROLE_OPTIONS.some((r) => r.value === roleValue)
}
