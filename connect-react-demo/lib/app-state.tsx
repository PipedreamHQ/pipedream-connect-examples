import blueTheme from "@/app/components/customization-select/blue-theme"
import darkTheme from "@/app/components/customization-select/dark-theme"
import { createContext, useContext, useState } from "react"
// @ts-ignore
import blueThemeCode from "raw-loader!@/app/components/customization-select/blue-theme.ts"
import { useComponent, useFrontendClient } from "@pipedream/connect-react"
import { useSearchParams } from "next/navigation";
// @ts-ignore
import darkThemeCode from "raw-loader!@/app/components/customization-select/dark-theme.ts"
import { useQueryParams } from "./use-query-params"

const customizationOptions = [
  {
    name: "default",
    label: "Default Styles",
    customization: undefined,
    file: undefined,
  },
  {
    name: "blue",
    label: "Blue Theme",
    customization: blueTheme,
    file: blueThemeCode.split("\n\n\n;")[0],
  },
  {
    name: "dark",
    label: "Dark Theme",
    containerStyle: { backgroundColor: "#202020" },
    customization: darkTheme,
    file: darkThemeCode.split("\n\n\n;")[0],
  },
]

const useAppStateProviderValue = () => {
  const client = useFrontendClient()
  const userId = client.externalUserId || ""

  const [customizationOption, setCustomizationOption] = useState(
    customizationOptions[0]
  )

  const [activeTypingIndex, setActiveTypingIndex] = useState<number>(0)

  const refreshUserId = () => {} // no op since cannot serialize with "use client"

  const {queryParams, setQueryParam, setQueryParams} = useQueryParams()

  const propNames = queryParams.propNames ? queryParams.propNames.split(",") : []
  const setPropNames = (value: string[]) => setQueryParam("propNames", value?.length ? value.join(",") : undefined)

  // XXX Selected* -> Select* (to differentiate from actual selected component (on the left)) ?
  const selectedAppSlug = queryParams.app || "slack"
  const setSelectedAppSlug = (value: string) => setQueryParam("app", value)
  const removeSelectedAppSlug = () => setQueryParam("app", undefined)

  const selectedApp = { name_slug: selectedAppSlug }

  const selectedComponentKey = queryParams.component || "slack-send-message"
  const setSelectedComponentKey = (value: string) => {
    setQueryParams([{key: "component", value}, {key: "propNames", value: undefined}])
    setConfiguredProps({})
    setActionRunOutput(undefined)
  }
  const removeSelectedComponentKey = () => {
    setQueryParams([
      { key: "component", value: undefined },
      { key: "propNames", value: undefined },
    ]);
    setConfiguredProps({})
    setActionRunOutput(undefined)
  }

  const selectedComponent = { key: selectedComponentKey }

  const {
    component,
  }: {
    component?: any
  } = useComponent({
    key: selectedComponent?.key,
  })

  const searchParams = useSearchParams()

  const showStressTest = searchParams.get("stress") != null
  const [stressTestConfiguredProps, setStressTestConfiguredProps] = useState<
    Record<string, any>
  >({})

  const [configuredProps, setConfiguredProps] = useState<Record<string, any>>(
    {}
  )
  const [actionRunOutput, setActionRunOutput] = useState<any>()

  const hideOptionalProps = queryParams.hideOptionalProps === "true"
  const setHideOptionalProps = (value: boolean) => setQueryParam("hideOptionalProps", value ? "true" : undefined)

  const code = `import { createFrontendClient } from "@pipedream/sdk"
import { FrontendClientProvider, ComponentFormContainer } from "@pipedream/connect-react"${
    customizationOption.file
      ? `
import customization from "./customizations/${customizationOption.name}"`
      : ""
  }

const client = createFrontendClient()

export function MyPage() {
  return (
    <FrontendClientProvider client={client}>
      <ComponentFormContainer
        userId="${userId}"
        componentKey="${selectedComponent?.key}"${
    hideOptionalProps
      ? `
        hideOptionalProps={true}`
      : ""
  }${
    propNames.length
      ? `
        propNames={${JSON.stringify(propNames)}}`
      : ""
  }${
    customizationOption.file
      ? `
        \{...customization\}`
      : ""
  }
      />
    </FrontendClientProvider>
  )
}`

  const [fileCode, setFileCode] = useState<string>()

  return {
    userId,
    refreshUserId,

    customizationOptions,
    customizationOption,
    setCustomizationOption,

    activeTypingIndex,
    setActiveTypingIndex,

    propNames,
    setPropNames,

    selectedAppSlug,
    setSelectedAppSlug,
    removeSelectedAppSlug,

    selectedComponentKey,
    setSelectedComponentKey,
    removeSelectedComponentKey,

    selectedApp,
    selectedComponent,
    component,

    showStressTest,

    stressTestConfiguredProps,
    setStressTestConfiguredProps,

    configuredProps,
    setConfiguredProps,

    actionRunOutput,
    setActionRunOutput,

    hideOptionalProps,
    setHideOptionalProps,

    fileCode,
    setFileCode,

    code,
  }
}

const AppStateContext = createContext<ReturnType<typeof useAppStateProviderValue> | null>(null);

export const AppStateProvider = ({children}: React.PropsWithChildren) => {
  const providerValue = useAppStateProviderValue();

  return <AppStateContext.Provider value={providerValue}>{children}</AppStateContext.Provider>
}

export const useAppState = () => {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider")
  }
  return context
}
