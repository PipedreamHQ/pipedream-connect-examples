import { cn } from "@/lib/utils"
import { IoCubeSharp, IoFlashOutline, IoGlobe } from "react-icons/io5"
import { TOGGLE_STYLES } from "@/lib/constants/ui"
import { ComponentType } from "@pipedream/sdk"

interface ComponentTypeSelectorProps {
  selectedType: ComponentType | "proxy"
  onTypeChange: (type: ComponentType | "proxy") => void
}

const COMPONENT_TYPES = [
  {
    value: "action",
    label: "Action",
    icon: IoCubeSharp,
    description: "Perform read and write API operations"
  },
  {
    value: "trigger",
    label: "Trigger",
    icon: IoFlashOutline,
    description: "React to events and webhooks"
  },
  {
    value: "proxy",
    label: "API Proxy",
    icon: IoGlobe,
    description: "Make direct API requests with connected accounts"
  },
] as const

export function ComponentTypeSelector({ selectedType, onTypeChange }: ComponentTypeSelectorProps) {
  return (
    <div className="flex flex-col">
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
                selectedType === type.value ? TOGGLE_STYLES.active : TOGGLE_STYLES.inactive
              )}
            >
              <type.icon className="h-3 w-3" />
              {type.label}
            </button>
            {index < COMPONENT_TYPES.length - 1 && <div className={TOGGLE_STYLES.separator} />}
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500 mt-2">
        {COMPONENT_TYPES.find(type => type.value === selectedType)?.description}
      </div>
    </div>
  )
}
