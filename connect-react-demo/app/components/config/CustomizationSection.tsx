import { selectStyles } from "@pipedream/connect-react"
import Select from "react-select"

interface CustomizationSectionProps {
  customizationOptions: any[]
  customizationOption: any
  setCustomizationOption: (option: any) => void
  setFileCode: (code: string | undefined) => void
}

export const CustomizationSection = ({
  customizationOptions,
  customizationOption,
  setCustomizationOption,
  setFileCode,
}: CustomizationSectionProps) => (
  <div className="px-4 py-3">
    <div className="grid grid-cols-[140px,1fr] items-center gap-3">
      <div className="text-[13px] font-medium text-zinc-700">Theme</div>
      <Select
        options={customizationOptions}
        value={customizationOption}
        onChange={(v) => {
          if (v) {
            setCustomizationOption(v)
            setFileCode(undefined)
          }
        }}
        getOptionValue={(o) => o.name}
        components={{
          IndicatorSeparator: () => null,
        }}
        styles={selectStyles}
      />
    </div>
  </div>
)
