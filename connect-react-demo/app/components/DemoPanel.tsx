import React, { useState, useMemo } from "react"
import { ComponentFormContainer, CustomizeProvider, useFrontendClient, type FormContext } from "@pipedream/connect-react"
import type { ConfigurableProps, DynamicProps } from "@pipedream/sdk"
import { useAppState } from "@/lib/app-state"
import { PageSkeleton } from "./PageSkeleton"
import { TerminalCollapsible } from "./TerminalCollapsible"
import { SDKError } from "@/lib/types/pipedream"
import { ProxyRequestBuilder } from "./ProxyRequestBuilder"

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
                  selectedApp && !accountId ? (
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-semibold">Connect {selectedApp.name}</h3>
                      <p className="text-gray-600">Connect your {selectedApp.name} account to start making API requests</p>
                      <button 
                        className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
                        onClick={async () => {
                          try {
                            await frontendClient.connectAccount({
                              app: selectedApp.nameSlug,
                              onSuccess: ({ id }: { id: string }) => {
                                console.log('🎉 Account connected successfully!', { accountId: id })
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
                            setSdkErrors(error)
                          }
                        }}
                      >
                        Connect {selectedApp.name}
                      </button>
                      {sdkErrors && (
                        <div className="text-red-600 text-sm mt-2">
                          {String(sdkErrors)}
                        </div>
                      )}
                    </div>
                  ) : accountId ? (
                    <ProxyRequestBuilder />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Select an app to get started with proxy requests
                    </div>
                  )
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
