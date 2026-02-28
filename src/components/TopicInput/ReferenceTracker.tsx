import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReferenceInput } from './ReferenceInput'
import { FileUploader } from './FileUploader'
import type { ReferenceFile } from '@/types'

interface Props {
  useReference: boolean
  onUseReferenceChange: (use: boolean) => void
  referenceText: string
  onReferenceTextChange: (text: string) => void
  referenceFiles: ReferenceFile[]
  onReferenceFilesChange: (files: ReferenceFile[]) => void
  onRemoveFile: (id: string) => void
}

export function ReferenceTracker({
  useReference,
  onUseReferenceChange,
  referenceText,
  onReferenceTextChange,
  referenceFiles,
  onReferenceFilesChange,
  onRemoveFile,
}: Props) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2.5 cursor-pointer">
        <div
          className={cn(
            'relative w-8 h-[18px] rounded-full transition-colors cursor-pointer',
            useReference ? 'bg-accent' : 'bg-bg-hover',
          )}
          onClick={() => onUseReferenceChange(!useReference)}
        >
          <div
            className={cn(
              'absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform',
              useReference ? 'translate-x-[16px]' : 'translate-x-[2px]',
            )}
          />
        </div>
        <FileText className="w-3.5 h-3.5 text-text-secondary" />
        <span className="text-xs font-medium text-text-secondary">참고 자료 포함</span>
      </label>

      {useReference && (
        <div className="space-y-3 pl-0">
          <ReferenceInput referenceText={referenceText} onTextChange={onReferenceTextChange} />
          <FileUploader
            referenceFiles={referenceFiles}
            onFilesChange={onReferenceFilesChange}
            onRemoveFile={onRemoveFile}
          />
        </div>
      )}
    </div>
  )
}
