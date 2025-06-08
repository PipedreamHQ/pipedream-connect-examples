import { cn } from "@/lib/utils"
import { IoCubeSharp, IoFlashOutline } from "react-icons/io5"

interface ComponentTypeSelectorProps {
  selectedType: "action" | "trigger"
  onTypeChange: (type: "action" | "trigger") => void
}

const COMPONENT_TYPES = [
  { value: "action", label: "Action", icon: IoCubeSharp },
  { value: "trigger", label: "Trigger", icon: IoFlashOutline },
] as const

export function ComponentTypeSelector({ selectedType, onTypeChange }: ComponentTypeSelectorProps) {
  return (
    <div className="w-fit flex rounded-md border border-zinc-200 shadow-sm">
      {COMPONENT_TYPES.map((type, index) => (
        <div key={type.value} className="flex">
          <button
            onClick={(e) => {
              e.preventDefault()
              onTypeChange(type.value)
            }}
            type="button"
            className={cn(
              "px-3 py-1.5 text-xs font-medium font-mono flex items-center gap-2",
              selectedType === type.value
                ? "bg-zinc-900 text-white"
                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
            )}
          >
            <type.icon className="h-3 w-3" />
            {type.label}
          </button>
          {index === 0 && <div className="w-px bg-zinc-200" />}
        </div>
      ))}
    </div>
  )
}