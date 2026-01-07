import React, { useState, useMemo } from "react"
import { ComponentFormContainer, CustomizeProvider, useFrontendClient, useCustomize, useAccounts, type FormContext } from "@pipedream/connect-react"
import type { ConfigurableProps, DynamicProps, App, Account } from "@pipedream/sdk"
import { useAppState } from "@/lib/app-state"
import { PageSkeleton } from "./PageSkeleton"
import { TerminalCollapsible } from "./TerminalCollapsible"
import { SDKError } from "@/lib/types/pipedream"
import { ProxyRequestBuilder } from "./ProxyRequestBuilder"

// Separate component that uses useCustomize (must be inside CustomizeProvider)
function ProxyConnectFlow({
  selectedApp,
  accountId,
  frontendClient,
  externalUserId,
  setAccountId,
  setEditableExternalUserId,
  sdkErrors,
  setSdkErrors,
}: {
  selectedApp: App | null
  accountId: string
  frontendClient: ReturnType<typeof useFrontendClient>
  externalUserId: string
  setAccountId: (id: string) => void
  setEditableExternalUserId: (id: string) => void
  sdkErrors: SDKError | undefined
  setSdkErrors: (error: SDKError | undefined) => void
}) {
  const { theme } = useCustomize()

  // Fetch accounts for the selected app
  const { accounts, isLoading: isLoadingAccounts, refetch: refetchAccounts } = useAccounts(
    {
      external_user_id: externalUserId,
      app: selectedApp?.nameSlug,
    },
    {
      useQueryOpts: {
        enabled: !!selectedApp,
      },
    }
  )

  const connectNewAccount = async () => {
    if (!selectedApp) return
    try {
      await frontendClient.connectAccount({
        app: selectedApp.nameSlug,
        onSuccess: async ({ id }: { id: string }) => {
          console.log('🎉 Account connected successfully!', { accountId: id })
          await refetchAccounts()
          setAccountId(id)
          setEditableExternalUserId(externalUserId)
        },
        onError: (error: Error) => {
          console.error('Connection failed:', error)
          setSdkErrors(error)
        }
      })
    } catch (error) {
      console.error('Error connecting account:', error)
      setSdkErrors(error as SDKError)
    }
  }

  // Styles
  const selectStyles: React.CSSProperties = {
    color: theme.colors.neutral80,
    backgroundColor: theme.colors.neutral0,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.colors.neutral20,
    padding: 6,
    borderRadius: theme.borderRadius,
    boxShadow: theme.boxShadow.input,
    alignSelf: "stretch",
    cursor: "pointer",
    fontSize: "0.875rem",
  }

  const labelStyles: React.CSSProperties = {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: theme.colors.neutral70,
  }

  const sectionStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: `${theme.spacing.baseUnit}px`,
    alignItems: "flex-start",
  }

  const containerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  }

  // No app selected
  if (!selectedApp) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0", color: theme.colors.neutral50 }}>
        Select an app to get started with proxy requests
      </div>
    )
  }

  // Styles for connect button (matching ControlApp from connect-react)
  const connectButtonStyles: React.CSSProperties = {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius,
    border: "solid 1px",
    borderColor: theme.colors.primary25,
    color: theme.colors.primary25,
    padding: "0.5rem 1rem",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
  }

  const descriptionStyles: React.CSSProperties = {
    color: theme.colors.neutral50,
    fontWeight: 400,
    fontSize: "0.75rem",
    textWrap: "balance",
    lineHeight: "1.5",
    margin: 0,
  }

  // Show fancy connect button when no accounts exist
  if (!isLoadingAccounts && accounts.length === 0) {
    return (
      <div style={containerStyles}>
        <div style={sectionStyles}>
          <span style={labelStyles}>Connect {selectedApp.name} account</span>
          <button
            type="button"
            onClick={connectNewAccount}
            style={connectButtonStyles}
          >
            Connect {selectedApp.name}
          </button>
          <p style={descriptionStyles}>Credentials are encrypted.</p>
        </div>
        {sdkErrors && (
          <div style={{ fontSize: "0.875rem", color: theme.colors.danger }}>
            {String(sdkErrors)}
          </div>
        )}
      </div>
    )
  }

  // Show account selector and request builder
  return (
    <div style={containerStyles}>
      {/* Account Selector */}
      <div style={sectionStyles}>
        <span style={labelStyles}>Select {selectedApp.name} account</span>
        {isLoadingAccounts ? (
          <div style={{ color: theme.colors.neutral60, fontSize: "0.875rem" }}>
            Loading {selectedApp.name} accounts...
          </div>
        ) : (
          <select
            value={accountId || ""}
            onChange={(e) => {
              const value = e.target.value
              if (value === "_new") {
                connectNewAccount()
              } else {
                setAccountId(value)
                setEditableExternalUserId(externalUserId)
              }
            }}
            style={selectStyles}
          >
            <option value="" disabled>
              Select {selectedApp.name} account...
            </option>
            {accounts.map((account: Account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
            <option value="_new">+ Connect new {selectedApp.name} account...</option>
          </select>
        )}
        {sdkErrors && (
          <div style={{ fontSize: "0.875rem", color: theme.colors.danger }}>
            {String(sdkErrors)}
          </div>
        )}
      </div>

      {/* Show ProxyRequestBuilder when account is selected */}
      {accountId && <ProxyRequestBuilder />}
    </div>
  )
}

export const DemoPanel = () => {
  const frontendClient = useFrontendClient()
  const {
    customizationOption,
    externalUserId,
    selectedComponentKey,
    propNames,
    hideOptionalProps,
    configuredProps,
    setConfiguredProps,
    setActionRunOutput,
    actionRunOutput,
    selectedComponentType,
    webhookUrl,
    enableDebugging,
    setWebhookUrlValidationAttempted,
    selectedApp,
    accountId,
    setAccountId,
    editableExternalUserId,
    setEditableExternalUserId,
  } = useAppState()

  const [dynamicPropsId, setDynamicPropsId] = useState<string | undefined>()
  const [sdkErrors, setSdkErrors] = useState<SDKError | undefined>()

  // Define OAuth app ID mappings for testing
  // const oauthAppConfig = useMemo(() => ({
  //   'github': 'oa_abc1234',
  //   'google_sheets': 'oa_def4567',
  //   'slack': 'oa_1234567',
  // }), [])

  // Debounce propNames to prevent cascading render issues with app props
  const [debouncedPropNames, setDebouncedPropNames] = useState(propNames)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPropNames(propNames)
    }, 100)
    return () => clearTimeout(timer)
  }, [propNames])

  const handleDynamicProps = (dynamicProps: Pick<DynamicProps, "id">) => {
    setDynamicPropsId(dynamicProps.id)
  }

  const handleSubmit = async (ctx: FormContext<ConfigurableProps>) => {
    if (!selectedComponentKey) return

    // Validate webhookUrl for triggers
    if (selectedComponentType === "trigger") {
      if (!webhookUrl || webhookUrl.trim() === "") {
        React.startTransition(() => {
          setWebhookUrlValidationAttempted(true)
          setSdkErrors(new Error("Webhook URL is required for to deploy a trigger. Please enter a valid URL to receive events."))
          setActionRunOutput(undefined)
        })
        return
      }

      // Validate URL format
      try {
        new URL(webhookUrl)
      } catch {
        React.startTransition(() => {
          setWebhookUrlValidationAttempted(true)
          setSdkErrors(new Error("Invalid webhook URL format. Please enter a valid URL (e.g., https://example.com/webhook)."))
          setActionRunOutput(undefined)
        })
        return
      }
    }

    try {
      // Check if component requires stash for file handling
      const needsStash = ctx.component.stash === "required" || ctx.component.stash === "optional"

      const data = selectedComponentType === "action"
        ? await frontendClient.actions.run({
          externalUserId,
          id: selectedComponentKey,
          configuredProps,
          dynamicPropsId,
          ...(needsStash && { stashId: "" })  // Add stashId if component uses file stash
        })
        : await frontendClient.triggers.deploy({
          externalUserId,
          id: selectedComponentKey,
          configuredProps,
          webhookUrl,
          dynamicPropsId,
        })

      React.startTransition(() => {
        setSdkErrors(undefined)
        setActionRunOutput(data)
        setWebhookUrlValidationAttempted(false) // Reset validation state on successful submission
      })
    } catch (error) {
      React.startTransition(() => {
        setSdkErrors(error as SDKError)
        setActionRunOutput(undefined)
      })
    }
  }

  return (
    <div className="flex flex-col bg-neutral-50/50">
      <div className="p-4 md:p-6 relative">
        <div className="absolute inset-0 overflow-visible">
          <div className="absolute inset-0 grid grid-cols-12 gap-x-6">
            <div className="absolute right-0 top-0 h-full w-px bg-zinc-200" />

            <div className="col-start-2 col-span-10 relative">
              <svg className="absolute left-[25%] top-0 h-full">
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="100%"
                  strokeWidth="1"
                  stroke="#E4E7EC"
                  strokeDasharray="4 6"
                  strokeLinecap="round"
                />
              </svg>

              <svg className="absolute left-1/2 top-0 h-full">
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="100%"
                  strokeWidth="1"
                  stroke="#E4E7EC"
                  strokeDasharray="4 6"
                  strokeLinecap="round"
                />
              </svg>

              <svg className="absolute left-[75%] top-0 h-full">
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="100%"
                  strokeWidth="1"
                  stroke="#E4E7EC"
                  strokeDasharray="4 6"
                  strokeLinecap="round"
                />
              </svg>
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    radial-gradient(ellipse 380px 140px at 50% 0%, rgba(28, 100, 242, 0.08) 0%, transparent 50%),
                    radial-gradient(ellipse 400px 200px at 25% 0%, rgba(155, 135, 245, 0.06) 0%, transparent 50%),
                    radial-gradient(ellipse 400px 200px at 75% 0%, rgba(220, 38, 127, 0.06) 0%, transparent 50%)
                  `,
                  maskImage: "linear-gradient(to bottom, white 0%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, white 0%, transparent 100%)",
                }}
              />
            </div>
          </div>
        </div>

        <div className="relative max-w-2xl mx-auto">
          <div
            className="rounded-lg shadow-sm bg-white overflow-visible border border-neutral-200"
            style={customizationOption.containerStyle}
          >
            <PageSkeleton customizationOption={customizationOption}>
              <div className="p-4 sm:p-6 space-y-4">
                {selectedComponentType === "proxy" ? (
                  // For proxy: show connect flow if app selected but no account, otherwise show proxy form
                  <CustomizeProvider {...customizationOption.customization}>
                    <ProxyConnectFlow
                      selectedApp={selectedApp}
                      accountId={accountId}
                      frontendClient={frontendClient}
                      externalUserId={externalUserId}
                      setAccountId={setAccountId}
                      setEditableExternalUserId={setEditableExternalUserId}
                      sdkErrors={sdkErrors}
                      setSdkErrors={setSdkErrors}
                    />
                  </CustomizeProvider>
                ) : (
                  <CustomizeProvider {...customizationOption.customization}>
                    {selectedComponentKey && (
                      <ComponentFormContainer
                        externalUserId={externalUserId}
                        componentKey={selectedComponentKey}
                        configuredProps={configuredProps}
                        onUpdateConfiguredProps={setConfiguredProps}
                        hideOptionalProps={hideOptionalProps}
                        propNames={debouncedPropNames}
                        enableDebugging={enableDebugging}
                        onSubmit={handleSubmit}
                        onUpdateDynamicProps={handleDynamicProps}
                        sdkResponse={sdkErrors}
                      // oauthAppConfig={oauthAppConfig}
                      />
                    )}
                  </CustomizeProvider>
                )}
              </div>
            </PageSkeleton>
          </div>
        </div>

        <TerminalCollapsible
          isOpen={true}
          onOpenChange={() => { }}
          hasOutput={!!actionRunOutput}
          output={actionRunOutput}
        />
      </div>
    </div>
  )
}
