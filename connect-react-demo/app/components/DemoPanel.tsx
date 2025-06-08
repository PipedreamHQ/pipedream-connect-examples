import React, { useState } from "react"
import { ComponentForm, CustomizeProvider, useFrontendClient } from "@pipedream/connect-react"
import { useAppState } from "@/lib/app-state"
import { PageSkeleton } from "./PageSkeleton"
import { TerminalCollapsible } from "./TerminalCollapsible"

export const DemoPanel = () => {
  const frontendClient = useFrontendClient()
  const {
    customizationOption,
    userId,
    component,
    propNames,
    hideOptionalProps,
    configuredProps,
    setConfiguredProps,
    setActionRunOutput,
    actionRunOutput,
    selectedComponentType,
    webhookUrl,
    enableDebugging,
  } = useAppState()

  const [
    dynamicPropsId,
    setDynamicPropsId,
  ] = useState<string | undefined>();

  const [
    sdkErrors,
    setSdkErrors,
  ] = useState<unknown[] | unknown | undefined>(undefined);

  const handleDynamicProps = (dynamicProps: { id: string | undefined }) => {
    setDynamicPropsId(dynamicProps.id)
  }

  return (
    <div className="flex flex-col bg-neutral-50/50">
      <div className="p-4 md:p-6 relative">
        <div className="absolute inset-0 overflow-hidden">
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

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="rounded-lg shadow-sm bg-white overflow-hidden border border-neutral-200">
            <PageSkeleton>
              <div className="p-4 sm:p-6 space-y-4">
                <CustomizeProvider customization={customizationOption}>
                  {component && (
                    <ComponentForm
                      userId={userId}
                      component={component}
                      configuredProps={configuredProps}
                      onUpdateConfiguredProps={setConfiguredProps}
                      hideOptionalProps={hideOptionalProps}
                      propNames={propNames}
                      enableDebugging={enableDebugging}
                      onSubmit={async (ctx) => {
                        if (selectedComponentType === "action") {
                          try {
                            const data = await frontendClient.actionRun({
                              userId,
                              actionId: component.key,
                              configuredProps,
                              dynamicPropsId,
                            })
                            // Update both states in a single render cycle
                            React.startTransition(() => {
                              setSdkErrors(undefined)
                              setActionRunOutput(data)
                            })
                          } catch (error) {
                            React.startTransition(() => {
                              setSdkErrors(error)
                              setActionRunOutput(undefined)
                            })
                          }
                        } else if (selectedComponentType === "trigger") {
                          try {
                            const data = await frontendClient.deployTrigger({
                              userId,
                              triggerId: component.key,
                              configuredProps,
                              webhookUrl,
                              dynamicPropsId,
                            })
                            // Update both states in a single render cycle
                            React.startTransition(() => {
                              setSdkErrors(undefined)
                              setActionRunOutput(data)
                            })
                          } catch (error) {
                            React.startTransition(() => {
                              setSdkErrors(error)
                              setActionRunOutput(undefined)
                            })
                          }
                        }
                      }}
                      onDynamicPropsChange={handleDynamicProps}
                      errors={sdkErrors}
                    />
                  )}
                </CustomizeProvider>
              </div>
            </PageSkeleton>
          </div>
        </div>

        <TerminalCollapsible
          isOpen={true}
          onOpenChange={() => {}}
          hasOutput={!!actionRunOutput}
          output={actionRunOutput}
        />
      </div>
    </div>
  )
}