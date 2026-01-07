import blueTheme from "@/app/components/customization-select/blue-theme"
import darkTheme from "@/app/components/customization-select/dark-theme"
import defaultTheme from "@/app/components/customization-select/default-unstyled"
import React, { createContext, useContext, useState, startTransition, useEffect } from "react"
// @ts-ignore
import blueThemeCode from "raw-loader!@/app/components/customization-select/blue-theme.ts"
import { useFrontendClient, useApp } from "@pipedream/connect-react"
import { useSearchParams } from "next/navigation";
// @ts-ignore
import darkThemeCode from "raw-loader!@/app/components/customization-select/dark-theme.ts"
import { useQueryParams } from "./use-query-params"
import { ComponentType } from "@pipedream/sdk"

const customizationOptions = [
  {
    name: "default",
    label: "Default style",
    customization: defaultTheme,
    file: undefined,
  },
  {
    name: "blue",
    label: "Blue theme",
    customization: blueTheme,
    file: blueThemeCode.split("\n\n\n;")[0],
  },
  {
    name: "dark",
    label: "Dark theme",
    containerStyle: { backgroundColor: "#202020" },
    customization: darkTheme,
    file: darkThemeCode.split("\n\n\n;")[0],
  },
]

// Helper to get initial customization based on system preference
const getInitialCustomization = () => {
  // Default to light theme for SSR, will update client-side
  if (typeof window === "undefined") {
    return customizationOptions[0]
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  return prefersDark
    ? customizationOptions.find(o => o.name === "dark") || customizationOptions[0]
    : customizationOptions[0]
}

const useAppStateProviderValue = () => {
  const client = useFrontendClient()
  const externalUserId = client.externalUserId || ""

  const [customizationOption, setCustomizationOption] = useState(getInitialCustomization)

  // Listen for system color scheme changes and update theme accordingly
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e: MediaQueryListEvent) => {
      const newOption = e.matches
        ? customizationOptions.find(o => o.name === "dark") || customizationOptions[0]
        : customizationOptions[0]
      setCustomizationOption(newOption)
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const { queryParams, setQueryParam, setQueryParams } = useQueryParams()

  const propNames = queryParams.propNames ? queryParams.propNames.split(",") : []
  const setPropNames = (value: string[]) => setQueryParam("propNames", value?.length ? value.join(",") : undefined)

  // Helper to batch state updates with startTransition
  const updateStateAsync = (callback: () => void) => {
    startTransition(() => {
      callback()
    })
  }

  const selectedAppSlug = queryParams.app || "slack_v2"
  const setSelectedAppSlug = (value: string) => {
    updateStateAsync(() => {
      setQueryParams([
        { key: "component", value: undefined },
        { key: "app", value },
      ])
      // Clear proxy-related state when switching apps
      setAccountId("")
      setProxyUrl("")
      setProxyMethod("GET")
      setProxyBody("")
      setActionRunOutput(undefined)
    })
  }
  const removeSelectedAppSlug = () => {
    updateStateAsync(() => {
      setQueryParams([
        { key: "component", value: undefined },
        { key: "app", value: undefined },
      ])
      // Clear proxy-related state when removing app
      setAccountId("")
      setProxyUrl("")
      setProxyMethod("GET")
      setProxyBody("")
      setActionRunOutput(undefined)
    })
  }

  // Use useApp when we have a URL parameter, otherwise let SelectApp manage its own state
  const { app: fetchedApp } = selectedAppSlug && externalUserId
    ? useApp(selectedAppSlug)
    : {}
  const selectedApp = fetchedApp || undefined

  const selectedComponentType: ComponentType = queryParams.type as ComponentType || ComponentType.Action
  const setSelectedComponentType = (value: ComponentType) => setQueryParam("type", String(value))
  const removeSelectedComponentType = () => setQueryParam("type", undefined)

  const [webhookUrl, setWebhookUrl] = useState<string>("")
  const [webhookUrlValidationAttempted, setWebhookUrlValidationAttempted] = useState<boolean>(false)

  // Proxy-specific state
  const [editableExternalUserId, setEditableExternalUserId] = useState<string>(externalUserId)
  const [accountId, setAccountId] = useState<string>("")
  const [proxyUrl, setProxyUrl] = useState<string>("")
  const [proxyMethod, setProxyMethod] = useState<string>("GET")
  const [proxyBody, setProxyBody] = useState<string>("")

  const selectedComponentKey = queryParams.component || "slack_v2-send-message-to-channel"
  const setSelectedComponentKey = (value: string) => {
    // Batch all state updates to prevent multiple configureComponent calls
    updateStateAsync(() => {
      setQueryParams([{ key: "component", value }, { key: "propNames", value: undefined }])
      setConfiguredProps({})
      setActionRunOutput(undefined)
      setWebhookUrlValidationAttempted(false) // Reset validation state when switching components
    })
  }
  const removeSelectedComponentKey = () => {
    updateStateAsync(() => {
      setQueryParams([
        { key: "component", value: undefined },
        { key: "propNames", value: undefined },
      ])
      setConfiguredProps({})
      setActionRunOutput(undefined)
      setWebhookUrlValidationAttempted(false) // Reset validation state when removing component
    })
  }

  const selectedComponent = { key: selectedComponentKey }

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

  const enableDebugging = queryParams.enableDebugging === "true"
  const setEnableDebugging = (value: boolean) => setQueryParam("enableDebugging", value ? "true" : undefined)

  const code = React.useMemo(() => {
    return `import { createFrontendClient } from "@pipedream/sdk"
import { FrontendClientProvider, ComponentFormContainer } from "@pipedream/connect-react"${customizationOption.file
        ? `
import customization from "./customizations/${customizationOption.name}"`
        : ""
      }

const client = createFrontendClient()

export function MyPage() {
  return (
    <FrontendClientProvider client={client}>
      <ComponentFormContainer
        externalUserId="${externalUserId}"
        componentKey="${selectedComponent?.key}"${hideOptionalProps
        ? `
        hideOptionalProps={true}`
        : ""
      }${enableDebugging
        ? `
        enableDebugging={true}`
        : ""
      }${propNames.length
        ? `
        propNames={${JSON.stringify(propNames)}}`
        : ""
      }${customizationOption.file
        ? `
        \{...customization\}`
        : ""
      }
        // Optional: specify OAuth app ID for app-specific account connections
        // oauthAppId="your-oauth-app-id"
      />
    </FrontendClientProvider>
  )
}`
  }, [customizationOption.file, customizationOption.name, externalUserId, selectedComponent?.key, hideOptionalProps, enableDebugging, propNames]);

  const [fileCode, setFileCode] = useState<string>()

  return {
    externalUserId,

    customizationOptions,
    customizationOption,
    setCustomizationOption,

    propNames,
    setPropNames,

    selectedAppSlug,
    setSelectedAppSlug,
    removeSelectedAppSlug,

    selectedComponentType,
    setSelectedComponentType,
    removeSelectedComponentType,

    webhookUrl,
    setWebhookUrl,
    webhookUrlValidationAttempted,
    setWebhookUrlValidationAttempted,

    selectedComponentKey,
    setSelectedComponentKey,
    removeSelectedComponentKey,

    selectedApp,
    selectedComponent,

    showStressTest,

    stressTestConfiguredProps,
    setStressTestConfiguredProps,

    configuredProps,
    setConfiguredProps,

    actionRunOutput,
    setActionRunOutput,

    hideOptionalProps,
    setHideOptionalProps,

    enableDebugging,
    setEnableDebugging,

    fileCode,
    setFileCode,

    // Proxy-specific exports
    editableExternalUserId,
    setEditableExternalUserId,
    accountId,
    setAccountId,
    proxyUrl,
    setProxyUrl,
    proxyMethod,
    setProxyMethod,
    proxyBody,
    setProxyBody,

    code,
  }
}

const AppStateContext = createContext<ReturnType<typeof useAppStateProviderValue> | null>(null);

export const AppStateProvider = ({ children }: React.PropsWithChildren) => {
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
