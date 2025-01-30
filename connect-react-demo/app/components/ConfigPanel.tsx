"use client"

import { useId } from "react"
import { SelectApp, SelectComponent } from "@pipedream/connect-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAppState } from "@/lib/app-state"
import { cn } from "@/lib/utils"
import Select from "react-select"
import { CodeSection } from "./config/CodeSection"
import { ScrollArea } from "@/components/ui/scroll-area"

function getTypeDescription(prop: {
  name: string
  type: string
  description: string
  optional?: boolean
  default?: any
  min?: number
  max?: number
  secret?: boolean
}) {
  let syntax = ""

  switch (prop.type) {
    case "string":
      syntax = `<span class="text-[#569cd6]">string</span>`
      break
    case "integer":
      syntax = `<span class="text-[#569cd6]">number</span>`
      break
    case "boolean":
      syntax = `<span class="text-[#569cd6]">boolean</span>`
      break
    case "app":
      syntax = `<span class="text-[#4ec9b0]">AppConnection</span>`
      break
    case "any":
      syntax = `<span class="text-[#569cd6]">any</span>`
      break
    default:
      if (prop.type.endsWith("[]")) {
        const baseType = prop.type.slice(0, -2)
        syntax = `<span class="text-[#4ec9b0]">Array</span>&lt;<span class="text-[#569cd6]">${baseType}</span>&gt;`
      } else {
        syntax = `<span class="text-[#569cd6]">${prop.type}</span>`
      }
  }

  if (prop.optional) {
    syntax = `${syntax} <span class="text-[#d4d4d4]">|</span> <span class="text-[#569cd6]">undefined</span>`
  }

  return {
    syntax,
    isArray: prop.type.endsWith("[]"),
    isOptional: prop.optional,
  }
}

const typeBadgeStyles = {
  string:
    "text-[13px] font-mono bg-blue-50 text-blue-700 border-blue-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
  boolean:
    "text-[13px] font-mono bg-purple-50 text-purple-700 border-purple-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
  array:
    "text-[13px] font-mono bg-indigo-50 text-indigo-700 border-indigo-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
  object:
    "text-[13px] font-mono bg-cyan-50 text-cyan-700 border-cyan-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
}

interface PropertyItemProps {
  name: string
  type: string
  description: string
  required?: boolean
  children: React.ReactNode
  action?: React.ReactNode
  defaultValue?: any
  min?: number
  max?: number
  secret?: boolean
}

const PropertyItem = ({
  name,
  type,
  description,
  required,
  children,
  action,
  defaultValue,
  min,
  max,
  secret,
}: PropertyItemProps) => {
  const typeInfo = getTypeDescription({
    name,
    type,
    description,
    optional: required === false,
    default: defaultValue,
    min,
    max,
    secret,
  })

  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 items-center py-2 pl-4 pr-2 hover:bg-zinc-50/50">
      <div className="flex items-center">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="text-[13px] font-semibold text-neutral-500 border-b border-dotted border-neutral-300 cursor-help">
                {name}
              </label>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 flex flex-col gap-1.5 max-w-xs bg-white border border-neutral-200 shadow-sm text-neutral-700 rounded-md p-2.5 font-mono text-[13px] leading-tight tracking-tight"
            >
              <div className="pb-1.5 mb-1.5 border-b border-neutral-200 font-medium">
                <span className="text-[#d73a49]">type</span>{" "}
                <span className="text-[#6f42c1]">{name}</span> ={" "}
                <span
                  dangerouslySetInnerHTML={{
                    __html: typeInfo.syntax
                      .replace(/#569cd6/g, "#d73a49")
                      .replace(/#4ec9b0/g, "#6f42c1"),
                  }}
                />
              </div>

              <div className="font-sans text-neutral-600 py-1 text-[13px] leading-normal font-normal">
                {description}
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-1 pt-1.5 mt-1.5 border-t border-neutral-200">
                {required !== undefined && (
                  <div>
                    <span className="text-[#d73a49] font-medium">
                      required:
                    </span>{" "}
                    <span className="text-[#22863a]">
                      {required.toString()}
                    </span>
                  </div>
                )}

                {defaultValue !== undefined && (
                  <div>
                    <span className="text-[#d73a49] font-medium">default:</span>{" "}
                    <span className="text-[#22863a]">
                      {JSON.stringify(defaultValue)}
                    </span>
                  </div>
                )}

                {type === "integer" && (
                  <>
                    {min !== undefined && (
                      <div>
                        <span className="text-[#d73a49] font-medium">min:</span>{" "}
                        <span className="text-[#005cc5]">{min}</span>
                      </div>
                    )}
                    {max !== undefined && (
                      <div>
                        <span className="text-[#d73a49] font-medium">max:</span>{" "}
                        <span className="text-[#005cc5]">{max}</span>
                      </div>
                    )}
                  </>
                )}

                {secret && (
                  <div>
                    <span className="text-[#d73a49] font-medium">secret:</span>{" "}
                    <span className="text-[#22863a]">true</span>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">{children}</div>
        {action}
      </div>
    </div>
  )
}

export const ConfigPanel = () => {
  const {
    fileCode,
    setFileCode,
    customizationOption,
    code,
    userId,
    selectedApp,
    setSelectedAppSlug,
    removeSelectedAppSlug,
    selectedComponentType,
    selectedComponent,
    webhookUrl,
    setWebhookUrl,
    setSelectedComponentKey,
    removeSelectedComponentKey,
    setPropNames,
    setConfiguredProps,
    setActionRunOutput,
    customizationOptions,
    setCustomizationOption,
    hideOptionalProps,
    setHideOptionalProps,
    propNames,
    component,
  } = useAppState()
  const id1 = useId();
  const id2 = useId();

  const isValidWebhookUrl = () => {
    if (!webhookUrl) {
      return true
    }

    try {
      new URL(webhookUrl);
    } catch {
      return false
    }
    return true
  }


  const formControls = (
    <div className="divide-y">
      <PropertyItem
        name="userId"
        type="string"
        description="Authenticated user identifier"
        required={true}
      >
        <input
          value={userId || ""}
          className="w-full px-3 py-1.5 text-sm font-mono border rounded bg-zinc-50/50"
          readOnly
        />
      </PropertyItem>
      {selectedComponentType === "trigger" && (
        <PropertyItem
          name="webhookUrl"
          type="string"
          description="Webhook for trigger"
          required={false}
        >
          <input
            value={webhookUrl}
            onChange={(e) => {
              setWebhookUrl(e.target.value)
            }}
            placeholder="Enter a webhook URL to receive emitted events"
            className={`w-full px-3 py-1.5 text-sm font-mono border-2 ${isValidWebhookUrl() ? "" : "border-red-500"}  rounded bg-zinc-50/50`}
          />
        </PropertyItem>
      )}
      <PropertyItem
        name="componentKey"
        type="string"
        description="Unique identifier for the component to be rendered"
        required={true}
      >
        <div className="grid grid-cols-2 gap-1">
          <SelectApp
            value={selectedApp}
            onChange={(app) => {
              app
                ? setSelectedAppSlug(app.name_slug)
                : removeSelectedAppSlug()
            }}
          />
          <SelectComponent
            app={selectedApp}
            componentType={selectedComponentType}
            value={selectedComponent}
            onChange={(comp) => {
              comp
                ? setSelectedComponentKey(comp.key)
                : removeSelectedComponentKey()

            }}
          />
        </div>
      </PropertyItem>
      <PropertyItem
        name="hideOptionalProps"
        type="boolean"
        description="Only show required form fields"
        required={false}
        defaultValue={false}
      >
        <div className="w-fit flex rounded-md border border-zinc-200 shadow-sm">
          <button
            onClick={() => setHideOptionalProps(true)}
            className={cn(
              "px-3 py-1 text-xs font-medium font-mono",
              hideOptionalProps
                ? "bg-zinc-900 text-white"
                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
            )}
          >
            TRUE
          </button>
          <div className="w-px bg-zinc-200" />
          <button
            onClick={() => setHideOptionalProps(false)}
            className={cn(
              "px-3 py-1 text-xs font-medium font-mono",
              !hideOptionalProps
                ? "bg-zinc-900 text-white"
                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
            )}
          >
            FALSE
          </button>
        </div>
      </PropertyItem>

      <PropertyItem
        name="propNames"
        type="string[]"
        description="Filter which properties are displayed in the form"
        required={false}
      >
        <Select
          instanceId={id1}
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
          className="react-select-container text-sm"
          classNamePrefix="react-select"
          placeholder="Select properties to show..."
          components={{
            IndicatorSeparator: () => null,
          }}
        />
      </PropertyItem>

      <PropertyItem
        name="customization"
        type="CustomizationConfig"
        description="Theme and styling configuration options"
        required={false}
      >
        <Select
          instanceId={id2}
          options={customizationOptions}
          value={customizationOption}
          onChange={(v) => {
            if (v) {
              setCustomizationOption(v)
              setFileCode(undefined)
            }
          }}
          getOptionValue={(o) => o.name}
          className="react-select-container text-sm"
          classNamePrefix="react-select"
          placeholder="Choose a theme..."
          components={{
            IndicatorSeparator: () => null,
          }}
        />
      </PropertyItem>
      {selectedComponentType === "trigger" && (
        <div className="bg-sky-100/50 backdrop-blur-xl border rounded border-neutral-200/50 px-4 py-2 mb-10 m-4 shadow-sm">
          <div className="text-sm text-neutral-700 leading-relaxed">
            <p className="py-2 flex gap-2">
              {/* <BsInfoCircleFill className="h-4 w-4 text-neutral-500 flex-shrink-0 mt-1" /> */}
              <span>
                When you deploy a trigger via the Pipedream components API, we'll emit events to a{' '}
                <code className="font-mono mx-1">webhookUrl</code> that you define. To test your trigger:
              </span>
            </p>
            <ol className="list-decimal list-outside ml-6 space-y-2">
              <li className="pl-2">
                Configure the trigger and define a <code className="font-mono text-sm">webhookUrl</code> to receive events (use a{' '}
                <a
                  href="https://pipedream.com/new?h=tch_BXfkaA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-800 hover:text-sky-900 hover:underline transition-colors"
                >
                  RequestBin
                </a>
                {' '}for example)
              </li>
              <li className="pl-2">
                Click <span className="font-semibold">Submit</span> on the right (may take up to a minute, but can happen asynchronously in your app)
              </li>
              <li className="pl-2">
                Generate some actual events in the relevant app and check your webhook for emitted events.
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col min-h-0 h-full">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-0 space-y-4">
          <div className="">
            <CodeSection
              fileCode={fileCode || ""}
              setFileCode={setFileCode}
              code={code}
              customizationOption={customizationOption}
              formControls={formControls}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
