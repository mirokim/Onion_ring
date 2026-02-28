import { cn } from '@/lib/utils'
import { TOPIC_INPUT } from '@/constants'

interface Props {
  referenceText: string
  onTextChange: (text: string) => void
}

export function ReferenceInput({ referenceText, onTextChange }: Props) {
  const { REFERENCE_MAX_LENGTH } = TOPIC_INPUT
  const charCount = referenceText.length
  const isNearLimit = charCount > REFERENCE_MAX_LENGTH * 0.9

  return (
    <div className="space-y-1.5">
      <textarea
        value={referenceText}
        onChange={(e) => {
          if (e.target.value.length <= REFERENCE_MAX_LENGTH) {
            onTextChange(e.target.value)
          }
        }}
        placeholder="토론에 참고할 텍스트를 붙여넣으세요."
        className="w-full px-4 py-3 text-sm bg-bg-surface border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition placeholder:text-text-muted/60"
        rows={4}
      />
      <div className="flex justify-end">
        <span
          className={cn(
            'text-[10px]',
            isNearLimit ? 'text-warning' : 'text-text-muted',
          )}
        >
          {charCount.toLocaleString()} / {REFERENCE_MAX_LENGTH.toLocaleString()}자
        </span>
      </div>
    </div>
  )
}
