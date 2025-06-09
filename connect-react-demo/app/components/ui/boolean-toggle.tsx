import { cn } from "../../../lib/utils"

interface BooleanToggleProps {
  value: boolean
  onChange: (value: boolean) => void
  labels?: { true: string; false: string }
  className?: string
  "aria-label"?: string
}

export const BooleanToggle = ({ 
  value, 
  onChange, 
  labels = { true: "TRUE", false: "FALSE" },
  className,
  "aria-label": ariaLabel
}: BooleanToggleProps) => {
  return (
    <div 
      className={cn("w-fit flex rounded-md border border-zinc-200 shadow-sm", className)}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value}
        onClick={() => onChange(true)}
        className={cn(
          "px-3 py-1 text-xs font-medium font-mono transition-colors",
          value
            ? "bg-zinc-900 text-white"
            : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
        )}
      >
        {labels.true}
      </button>
      <div className="w-px bg-zinc-200" />
      <button
        type="button"
        role="radio"
        aria-checked={!value}
        onClick={() => onChange(false)}
        className={cn(
          "px-3 py-1 text-xs font-medium font-mono transition-colors",
          !value
            ? "bg-zinc-900 text-white"
            : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
        )}
      >
        {labels.false}
      </button>
    </div>
  )
}