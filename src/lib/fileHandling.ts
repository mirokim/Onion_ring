/**
 * File handling utilities - consolidated from UserIntervention and TopicInput
 * Handles file validation, conversion, and manipulation
 */

import type { ReferenceFile } from '@/types'
import { generateId } from './utils'
import { FILE_HANDLING } from '@/constants'

export interface FileValidationError {
  type: 'type' | 'size' | 'count'
  message: string
}

/**
 * Validates if a file is acceptable
 * @returns validation error or null if valid
 */
export function validateFile(
  file: File,
  currentCount: number = 0,
): FileValidationError | null {
  if (!FILE_HANDLING.ACCEPTED_TYPES.includes(file.type as any)) {
    return {
      type: 'type',
      message: `지원하지 않는 형식: ${file.type}`,
    }
  }

  if (file.size > FILE_HANDLING.MAX_FILE_SIZE) {
    const mbSize = (FILE_HANDLING.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)
    return {
      type: 'size',
      message: `파일이 너무 큽니다 (최대 ${mbSize}MB)`,
    }
  }

  if (currentCount >= FILE_HANDLING.MAX_FILES) {
    return {
      type: 'count',
      message: `최대 ${FILE_HANDLING.MAX_FILES}개 파일까지만 첨부 가능합니다`,
    }
  }

  return null
}

/**
 * Converts a File object to a ReferenceFile with data URL
 * Usually used with FileList from input or drag-drop
 */
export async function fileToReferenceFile(file: File): Promise<ReferenceFile> {
  const dataUrl = await readFileAsDataUrl(file)
  return {
    id: generateId(),
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    dataUrl,
  }
}

/**
 * Reads a File as a data URL (base64)
 * Common pattern for storing files in state or sending via API
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Processes a FileList, validating and converting each file
 * Returns both successful conversions and any errors
 */
export async function processFileList(
  fileList: FileList | null,
  existingCount: number = 0,
): Promise<{ files: ReferenceFile[]; errors: FileValidationError[] }> {
  const files: ReferenceFile[] = []
  const errors: FileValidationError[] = []

  if (!fileList) {
    return { files, errors }
  }

  for (const file of Array.from(fileList)) {
    const error = validateFile(file, existingCount + files.length)
    if (error) {
      errors.push(error)
      continue
    }

    try {
      const refFile = await fileToReferenceFile(file)
      files.push(refFile)
    } catch (err) {
      errors.push({
        type: 'type',
        message: `파일 읽기 실패: ${file.name}`,
      })
    }
  }

  return { files, errors }
}

/**
 * Extracts base64 data from a data URL
 * Used when sending files to API or storing in database
 */
export function extractBase64FromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:[^;]*;base64,(.+)$/)
  return match?.[1] ?? ''
}

/**
 * Converts binary data back to a data URL
 * Used when retrieving files from database
 */
export function binaryToDataUrl(mimeType: string, binary: Uint8Array): string {
  const binaryString = String.fromCharCode(...binary)
  const base64 = btoa(binaryString)
  return `data:${mimeType};base64,${base64}`
}

/**
 * Gets readable file size (B, KB, MB, etc)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}
