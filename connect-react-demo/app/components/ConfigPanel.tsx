"use client"

import React, { useId, useState, useCallback, useMemo, useRef, useEffect } from "react"
import { SelectApp, SelectComponent, CustomizeProvider, useComponent } from "@pipedream/connect-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { BooleanToggle } from "./ui/boolean-toggle"
import { ComponentTypeSelector } from "./ComponentTypeSelector"
import { useAppState } from "@/lib/app-state"
import { cn, isValidUrl } from "@/lib/utils"
import Select from "react-select"
import { IoChevronDown, IoSettingsOutline } from "react-icons/io5"
import type { CSSObjectWithLabel } from "react-select"
import { getTypeDescription } from "../../lib/utils/type-descriptions"
import { ComponentType, ConfigurablePropType } from "@pipedream/sdk"

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
  type: ConfigurablePropType
  description: string
  required?: boolean
  children: React.ReactNode
  action?: React.ReactNode
  defaultValue?: unknown
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
    <div className="grid grid-cols-[120px_1fr] gap-3 items-center py-2 pl-4 pr-2 hover:bg-zinc-50/50">
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
    customizationOption,
    externalUserId,
    selectedApp,
    setSelectedAppSlug,
    removeSelectedAppSlug,
    selectedComponentType,
    setSelectedComponentType,
    selectedComponent,
    webhookUrl,
    setWebhookUrl,
    setSelectedComponentKey,
    removeSelectedComponentKey,
    setPropNames,
    customizationOptions,
    setCustomizationOption,
    hideOptionalProps,
    setHideOptionalProps,
    enableDebugging,
    setEnableDebugging,
    propNames,
    webhookUrlValidationAttempted,
    setWebhookUrlValidationAttempted,
    editableExternalUserId,
    setEditableExternalUserId,
    accountId,
    setAccountId,
  } = useAppState()
  
  // Check if proxy input editing is enabled via environment variable
  const enableProxyInput = process.env.NEXT_PUBLIC_ENABLE_PROXY_INPUT === 'true'
  const id1 = useId();
  const id2 = useId();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Local state for immediate UI updates, separate from router state
  const [localPropNames, setLocalPropNames] = useState(propNames)

  // Sync router state to local state
  useEffect(() => {
    setLocalPropNames(propNames)
  }, [propNames])

  // Debounced sync from local state to router
  useEffect(() => {
    const timer = setTimeout(() => {
      if (JSON.stringify(localPropNames) !== JSON.stringify(propNames)) {
        // Use requestAnimationFrame to ensure this happens outside any ongoing render
        requestAnimationFrame(() => {
          setPropNames(localPropNames)
        })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localPropNames, propNames, setPropNames])

  // Fetch component details to get configurable_props for the propNames dropdown
  const { component, isLoading, error } = useComponent({
    key: selectedComponent?.key || '',
  }, {
    useQueryOpts: {
      enabled: !!selectedComponent?.key
    }
  })


  // Common select styles for consistent UI
  const selectPortalStyles = useMemo(() => ({
    menuPortal: (base: CSSObjectWithLabel) => ({ ...base, zIndex: 9999 }),
    option: (base: CSSObjectWithLabel) => ({ ...base, fontSize: '14px' }),
  }), [])

  const multiSelectStyles = useMemo(() => ({
    ...selectPortalStyles,
    multiValue: (base: CSSObjectWithLabel) => ({ ...base, fontSize: '14px' }),
    multiValueLabel: (base: CSSObjectWithLabel) => ({ ...base, fontSize: '14px' }),
  }), [selectPortalStyles])

  const singleSelectStyles = useMemo(() => ({
    ...selectPortalStyles,
    singleValue: (base: CSSObjectWithLabel) => ({ ...base, fontSize: '14px' }),
  }), [selectPortalStyles])

  // Common Select props
  const commonSelectProps = useMemo(() => ({
    className: "react-select-container text-sm",
    classNamePrefix: "react-select",
    menuPortalTarget: typeof document !== 'undefined' ? document.body : undefined,
    components: {
      IndicatorSeparator: () => null,
    },
  }), [])

  const dropdownCustomization = {
    props: {
      controlSelect: {
        menuPortalTarget: typeof document !== 'undefined' ? document.body : undefined,
        menuPlacement: 'auto',
        menuShouldBlockScroll: false,
      },
    },
    styles: {
      controlSelect: {
        menu: (base: CSSObjectWithLabel) => ({
          ...base,
          zIndex: 99999,
          position: 'fixed',
        }),
        menuPortal: (base: CSSObjectWithLabel) => ({
          ...base,
          zIndex: 99999,
          position: 'fixed',
        }),
        control: (base: CSSObjectWithLabel) => ({
          ...base,
          position: 'relative',
          zIndex: 1,
        }),
      },
    },
  }

  const shouldShowWebhookUrlError = () => {
    return webhookUrlValidationAttempted && (!webhookUrl || !isValidUrl(webhookUrl))
  }

  const basicFormControls = (
    <div>
      <div className="grid grid-cols-[120px_1fr] gap-3 py-2 pl-4 pr-2 hover:bg-zinc-50/50">
        <div className="flex items-start pt-1.5">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="text-[13px] font-semibold text-neutral-500 border-b border-dotted border-neutral-300 cursor-help">
                  componentType
                </label>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 flex flex-col gap-1.5 max-w-xs bg-white border border-neutral-200 shadow-sm text-neutral-700 rounded-md p-2.5 font-mono text-[13px] leading-tight tracking-tight"
              >
                <div className="pb-1.5 mb-1.5 border-b border-neutral-200 font-medium">
                  <span className="text-[#d73a49]">type</span>{" "}
                  <span className="text-[#6f42c1]">componentType</span> ={" "}
                  <span className="text-[#d73a49]">'action' | 'trigger' | 'proxy'</span>
                </div>

                <div className="font-sans text-neutral-600 py-1 text-[13px] leading-normal font-normal">
                  Type of component to configure
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-1 pt-1.5 mt-1.5 border-t border-neutral-200">
                  <div>
                    <span className="text-[#d73a49] font-medium">
                      required:
                    </span>{" "}
                    <span className="text-[#22863a]">
                      true
                    </span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-start">
          <ComponentTypeSelector
            selectedType={selectedComponentType}
            onTypeChange={setSelectedComponentType}
          />
        </div>
      </div>
      <PropertyItem
        name="app"
        type="string"
        description="App to connect to"
        required={true}
      >
        <CustomizeProvider customization={dropdownCustomization}>
          <SelectApp
            value={selectedApp}
            onChange={(app) => {
              app
                ? setSelectedAppSlug(app.nameSlug)
                : removeSelectedAppSlug()
            }}
            appsOptions={{
              sortKey: "featured_weight",
              sortDirection: "desc",
              ...(selectedComponentType === ComponentType.Action
                ? { hasActions: true }
                : selectedComponentType === ComponentType.Trigger
                ? { hasTriggers: true }
                : {}),
            }}
          />
        </CustomizeProvider>
      </PropertyItem>
      {selectedComponentType !== "proxy" && (
        <PropertyItem
          name={selectedComponentType === ComponentType.Action ? "actionId" : "triggerId"}
          type="string"
          description={`${selectedComponentType === ComponentType.Action ? "Action" : "Trigger"} to use`}
          required={true}
        >
          <CustomizeProvider customization={dropdownCustomization}>
            {selectedApp ? (
              <SelectComponent
                app={selectedApp}
                componentType={selectedComponentType}
                value={selectedComponent}
                onChange={(comp) => {
                  comp
                    ? setSelectedComponentKey(comp.key)
                    : removeSelectedComponentKey()
                }}
                componentsOptions={{
                  registry: "all",
                }}
              />
            ) : (
              <div className="w-full px-3 py-1.5 text-sm text-gray-500 border rounded bg-gray-50">
                Loading components...
              </div>
            )}
          </CustomizeProvider>
        </PropertyItem>
      )}
      {selectedComponentType === "trigger" && (
        <PropertyItem
          name="webhookUrl"
          type="string"
          description="Webhook URL to receive trigger events (required)"
          required={true}
        >
          <div className="space-y-1">
            <input
              value={webhookUrl}
              onChange={(e) => {
                setWebhookUrl(e.target.value)
                // Reset validation state when user starts typing
                if (webhookUrlValidationAttempted) {
                  setWebhookUrlValidationAttempted(false)
                }
              }}
              placeholder="https://example.com/webhook"
              className={`w-full px-3 py-1.5 text-sm font-mono border-2 ${shouldShowWebhookUrlError()
                ? "border-red-500"
                : webhookUrl
                  ? "border-gray-200"
                  : "border-blue-500"
                } rounded bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
            />
            {shouldShowWebhookUrlError() && (
              <p className="text-xs text-red-600 mt-1">
                {!webhookUrl
                  ? "Webhook URL is required for triggers"
                  : "Please enter a valid URL"
                }
              </p>
            )}
            {!webhookUrl && !shouldShowWebhookUrlError() && (
              <p className="text-xs font-medium text-blue-500 mt-1">
                In order to deploy a trigger, enter a webhook URL that will receive events
              </p>
            )}
          </div>
        </PropertyItem>
      )}
      <PropertyItem
        name="externalUserId"
        type="string"
        description="Authenticated user identifier"
        required={true}
      >
        {selectedComponentType === "proxy" ? (
          <input
            value={editableExternalUserId || ""}
            onChange={enableProxyInput ? (e) => setEditableExternalUserId(e.target.value) : undefined}
            placeholder={enableProxyInput ? "Enter external user ID" : "External user ID (read-only)"}
            className={`w-full px-3 py-1.5 text-sm font-mono border rounded ${
              enableProxyInput 
                ? "bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                : "bg-zinc-50/50"
            }`}
            readOnly={!enableProxyInput}
          />
        ) : (
          <input
            value={externalUserId || ""}
            className="w-full px-3 py-1.5 text-sm font-mono border rounded bg-zinc-50/50"
            readOnly
          />
        )}
      </PropertyItem>
      {selectedApp && (
        <div className="grid grid-cols-[120px_1fr] gap-3 py-2 pl-4 pr-2 hover:bg-zinc-50/50">
          <div className="flex items-start pt-1.5">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className="text-[13px] font-semibold text-neutral-500 border-b border-dotted border-neutral-300 cursor-help">
                    app metadata
                  </label>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 flex flex-col gap-1.5 max-w-xs bg-white border border-neutral-200 shadow-sm text-neutral-700 rounded-md p-2.5 font-mono text-[13px] leading-tight tracking-tight"
                >
                  <div className="font-sans text-neutral-600 py-1 text-[13px] leading-normal font-normal">
                    Complete metadata for the selected app
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-start min-w-0">
            <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded text-xs font-mono overflow-auto max-h-96">
              <pre className="text-gray-700 whitespace-pre w-max">
                {JSON.stringify(selectedApp, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
      {selectedComponentType === "proxy" && enableProxyInput && (
        <PropertyItem
          name="accountId"
          type="string"
          description="Account ID for authenticated requests"
          required={true}
        >
          <input
            value={accountId || ""}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Enter account ID"
            className="w-full px-3 py-1.5 text-sm font-mono border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </PropertyItem>
      )}
    </div>
  )

  const advancedFormControls = (
    <div>
      <PropertyItem
        name="hideOptionalProps"
        type="boolean"
        description="Only show required form fields"
        required={false}
        defaultValue={false}
      >
        <BooleanToggle
          value={hideOptionalProps}
          onChange={setHideOptionalProps}
          aria-label="Hide optional properties toggle"
        />
      </PropertyItem>
      <PropertyItem
        name="enableDebugging"
        type="boolean"
        description="Surface SDK and configuration errors in the form"
        required={false}
        defaultValue={false}
      >
        <BooleanToggle
          value={enableDebugging}
          onChange={setEnableDebugging}
          aria-label="Enable debugging toggle"
        />
      </PropertyItem>

      <PropertyItem
        name="propNames"
        type="string[]"
        description="Filter which properties are displayed in the form"
        required={false}
      >
        <Select
          instanceId={id1}
          {...commonSelectProps}
          options={useMemo(() =>
            (component?.configurableProps || []).map((prop: any) => ({
              label: prop.label ? `${prop.label} (${prop.name})` : prop.name,
              value: prop.name,
            })), [component?.configurableProps]
          )}
          isMulti={true}
          value={useMemo(() =>
            localPropNames.map((name) => {
              const prop = (component?.configurableProps || []).find((p: any) => p.name === name)
              return {
                label: prop?.label ? `${prop.label} (${prop.name})` : name,
                value: name,
              }
            }), [localPropNames, component?.configurableProps]
          )}
          onChange={useCallback((vs) => {
            setLocalPropNames((vs || []).map((v) => v.value))
          }, [])}
          placeholder="Select properties to show..."
          styles={multiSelectStyles}
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
          {...commonSelectProps}
          options={customizationOptions}
          value={customizationOption}
          onChange={(v) => {
            if (v) {
              setCustomizationOption(v)
            }
          }}
          getOptionValue={(o) => o.name}
          placeholder="Choose a theme..."
          styles={singleSelectStyles}
        />
      </PropertyItem>
    </div>
  )

  const triggerInfo = selectedComponentType === "trigger" && (
    <div className="bg-sky-100/50 backdrop-blur-xl border rounded border-neutral-200/50 px-4 py-2 mb-10 m-4 shadow-sm hidden md:block">
      <div className="text-sm text-neutral-700 leading-relaxed">
        <p className="py-2 flex gap-2">
          {/* <BsInfoCircleFill className="h-4 w-4 text-neutral-500 flex-shrink-0 mt-1" /> */}
          <span>
            When you deploy a trigger via the Pipedream Connect, we'll emit events to a{' '}
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
  )

  return (
    <div className="flex flex-col">
      <div className="px-4 md:px-6 py-4 border-b bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Demo Configuration</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select an action or trigger and explore additional configuration options
        </p>
      </div>
      <div>
        <div className="px-4 md:px-6 py-4">
          {basicFormControls}

          {/* Desktop: Show with section header */}
          {selectedComponentType !== "proxy" && (
            <div className="hidden md:block mt-6">
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Additional Config Options</h3>
                {advancedFormControls}
              </div>
            </div>
          )}

          {/* Mobile: Collapsible */}
          {selectedComponentType !== "proxy" && (
            <div className="md:hidden mt-4">
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 text-sm font-medium text-neutral-500 hover:text-neutral-600 hover:bg-neutral-25 rounded border border-neutral-150">
                  <div className="flex items-center gap-2">
                    <IoSettingsOutline className="h-4 w-4" />
                    More options
                  </div>
                  <IoChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
                </CollapsibleTrigger>

                <CollapsibleContent>
                  {advancedFormControls}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {triggerInfo}
        </div>
      </div>
    </div>
  )
}
