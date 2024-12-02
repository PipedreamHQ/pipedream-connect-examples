import { selectStyles } from "@pipedream/connect-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { IoAddOutline } from "react-icons/io5"
import Select from "react-select"

interface FormSettingsSectionProps {
  hideOptionalProps: boolean
  setHideOptionalProps: (hide: boolean) => void
  propNames: string[]
  setPropNames: (names: string[]) => void
  component: any
}

export const FormSettingsSection = ({
  hideOptionalProps,
  setHideOptionalProps,
  propNames,
  setPropNames,
  component,
}: FormSettingsSectionProps) => (
  <div className="px-4 py-3 space-y-3">
    <div className="grid grid-cols-[140px,1fr] items-center gap-3">
      <div>
        <div className="text-[13px] font-medium text-zinc-700">
          Hide Optional Props
        </div>
      </div>
      <Switch
        checked={hideOptionalProps}
        onCheckedChange={setHideOptionalProps}
        className="h-[16px] w-[28px] data-[state=checked]:bg-blue-600 justify-self-end"
      />
    </div>

    <div className="space-y-2">
      <div className="grid grid-cols-[140px,1fr] items-center gap-3">
        <div className="text-[13px] font-medium text-zinc-700">
          Filter Props
        </div>
        {!propNames.length && (
          <Button
            variant="outline"
            className="h-7 px-2 font-medium justify-self-end"
            onClick={() => {
              if (component) {
                const firstPropNames = []
                for (const prop of component.configurable_props) {
                  firstPropNames.push(prop.name)
                  if (firstPropNames.length >= 2) break
                }
                setPropNames(firstPropNames)
              }
            }}
          >
            <IoAddOutline className="h-3.5 w-3.5 mr-1" />
            Add Filter
          </Button>
        )}
      </div>
      {propNames.length > 0 && (
        <div className="pl-[140px]">
          <Select
            options={(component?.configurable_props || []).map((prop: any) => ({
              label: prop.name,
              value: prop.name,
            }))}
            isMulti={true}
            value={propNames.map((name) => ({
              label: name,
              value: name,
            }))}
            onChange={(vs) => setPropNames(vs.map((v) => v.value))}
            className="w-full"
            classNamePrefix="react-select"
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={selectStyles}
          />
        </div>
      )}
    </div>
  </div>
)
