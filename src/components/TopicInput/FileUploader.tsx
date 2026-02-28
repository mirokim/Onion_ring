import { Upload, X, Camera as CameraIcon, ImagePlus, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isCameraAvailable, capturePhoto, pickFromGallery } from '@/lib/camera'
import { generateId } from '@/lib/utils'
import { readFileAsDataUrl } from '@/lib/fileHandling'
import { TOPIC_INPUT } from '@/constants'
import type { ReferenceFile } from '@/types'

interface Props {
  referenceFiles: ReferenceFile[]
  onFilesChange: (files: ReferenceFile[]) => void
  onRemoveFile: (id: string) => void
  disabled?: boolean
}

export function FileUploader({ referenceFiles, onFilesChange, onRemoveFile, disabled = false }: Props) {
  const { MAX_FILE_SIZE, MAX_FILES, ACCEPTED_TYPES, ACCEPTED_EXTENSIONS } = TOPIC_INPUT

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || disabled || referenceFiles.length >= MAX_FILES) return

    const newFiles: ReferenceFile[] = []

    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type as any)) continue
      if (file.size > MAX_FILE_SIZE) continue
      if (referenceFiles.length + newFiles.length >= MAX_FILES) break

      const dataUrl = await readFileAsDataUrl(file)
      newFiles.push({
        id: generateId(),
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        dataUrl,
      })
    }

    onFilesChange([...referenceFiles, ...newFiles])
  }

  const handleCamera = async () => {
    if (disabled || referenceFiles.length >= MAX_FILES) return
    const file = await capturePhoto()
    if (file) onFilesChange([...referenceFiles, file])
  }

  const handleGallery = async () => {
    if (disabled || referenceFiles.length >= MAX_FILES) return
    const file = await pickFromGallery()
    if (file) onFilesChange([...referenceFiles, file])
  }

  const canUploadMore = !disabled && referenceFiles.length < MAX_FILES

  return (
    <div className="space-y-2">
      <label
        className={cn(
          'flex flex-col items-center justify-center gap-2.5 p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all',
          !canUploadMore
            ? 'border-border text-text-muted cursor-not-allowed opacity-40'
            : 'border-border hover:border-accent/40 text-text-secondary hover:text-accent hover:bg-accent/5',
        )}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (canUploadMore) {
            void handleFileUpload(e.dataTransfer.files)
          }
        }}
      >
        <Upload className="w-5 h-5" />
        <span className="text-xs font-medium">
          이미지 또는 PDF 파일을 드래그하거나 클릭하여 업로드
        </span>
        <span className="text-[10px] text-text-muted">
          PNG, JPG, GIF, WebP, PDF | 최대 10MB | 최대 {MAX_FILES}개
        </span>
        <input
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          className="hidden"
          onChange={(e) => void handleFileUpload(e.target.files)}
          disabled={!canUploadMore}
        />
      </label>

      {/* Camera / Gallery buttons (native only) */}
      {isCameraAvailable() && canUploadMore && (
        <div className="flex gap-2">
          <button
            onClick={() => void handleCamera()}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-bg-surface border border-border rounded-xl text-text-secondary hover:bg-bg-hover transition"
          >
            <CameraIcon className="w-4 h-4" />
            <span className="text-xs">카메라</span>
          </button>
          <button
            onClick={() => void handleGallery()}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-bg-surface border border-border rounded-xl text-text-secondary hover:bg-bg-hover transition"
          >
            <ImagePlus className="w-4 h-4" />
            <span className="text-xs">갤러리</span>
          </button>
        </div>
      )}

      {/* File List */}
      {referenceFiles.length > 0 && (
        <div className="space-y-1.5">
          {referenceFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 px-3 py-2 bg-bg-surface rounded-xl border border-border"
            >
              {file.mimeType.startsWith('image/') ? (
                <img
                  src={file.dataUrl}
                  alt={file.filename}
                  className="w-9 h-9 object-cover rounded-lg shrink-0"
                />
              ) : (
                <div className="w-9 h-9 flex items-center justify-center bg-bg-hover rounded-lg shrink-0">
                  <FileText className="w-4 h-4 text-text-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-primary truncate font-medium">{file.filename}</p>
                <p className="text-[10px] text-text-muted">
                  {file.size < 1024
                    ? `${file.size} B`
                    : file.size < 1024 * 1024
                      ? `${(file.size / 1024).toFixed(1)} KB`
                      : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
                </p>
              </div>
              <button
                onClick={() => onRemoveFile(file.id)}
                className="p-1.5 hover:bg-error/15 rounded-lg text-text-muted hover:text-error transition shrink-0"
                aria-label={`파일 삭제 ${file.filename}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
