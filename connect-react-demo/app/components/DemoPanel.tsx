import {ComponentForm, CustomizeProvider, useFrontendClient} from "@pipedream/connect-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppState } from "@/lib/app-state"
import { PageSkeleton } from "./PageSkeleton"
import { TerminalCollapsible } from "./TerminalCollapsible"
import {useState} from "react";

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
  } = useAppState()

  const [
    dynamicPropsId,
    setDynamicPropsId,
  ] = useState<string | undefined>();

  const handleDynamicProps = (dynamicProps: { id: string | undefined }) => {
    setDynamicPropsId(dynamicProps.id)
  }

  return (
    <div className="flex flex-col min-h-0 h-full bg-neutral-50/50 overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="min-h-full p-6 relative">
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
              linear-gradient(rgb(243 244 246 / 0.8) 1px, transparent 1px),
              linear-gradient(to right, rgb(243 244 246 / 0.8) 1px, transparent 1px)
            `,
                    backgroundSize: "40px 40px",
                    maskImage: "linear-gradient(to bottom, white, transparent)",
                  }}
                />
              </div>
            </div>

            <div className="absolute inset-0">
              <div className="absolute inset-x-0 bottom-0 h-px bg-zinc-200" />

              {[20, 40, 60, 80].map((top) => (
                <svg
                  key={top}
                  className="absolute inset-x-0"
                  style={{ top: `${top}%` }}
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="100%"
                    y2="0"
                    strokeWidth="1"
                    stroke="#E4E7EC"
                    strokeDasharray="2 4"
                    strokeLinecap="round"
                  />
                </svg>
              ))}
            </div>

            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(circle at 25% 0%, transparent 0%, rgba(255,255,255,0.3) 100%),
                  radial-gradient(circle at 75% 0%, transparent 0%, rgba(255,255,255,0.3) 100%)
                `,
                maskImage: "linear-gradient(to bottom, white 30%, transparent)",
              }}
            />
          </div>

          <div className="relative max-w-[85%] w-full mx-auto lg:max-w-3xl space-y-4">
            <div className="relative rounded-lg border border-zinc-200/60 bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

              <div
                className="bg-white"
                style={customizationOption.containerStyle ?? {}}
              >
                <PageSkeleton customizationOption={customizationOption}>
                  <div className="flex-1 p-6">
                    <CustomizeProvider
                      {...(customizationOption.customization || {})}
                    >
                      {component && (
                        <ComponentForm
                          userId={userId}
                          component={component}
                          propNames={propNames}
                          hideOptionalProps={hideOptionalProps}
                          configuredProps={configuredProps}
                          onUpdateConfiguredProps={setConfiguredProps}
                          onUpdateDynamicProps={handleDynamicProps}
                          onSubmit={async () => {
                            setActionRunOutput(undefined)
                            if (selectedComponentType === "action") {
                              const data = await frontendClient.actionRun({
                                userId,
                                actionId: component.key,
                                configuredProps,
                                dynamicPropsId
                              })
                              setActionRunOutput(data)
                            } else if (selectedComponentType === "trigger") {
                              if (!webhookUrl) {
                                throw new Error("webhookUrl is required")
                              }
                              const data = await frontendClient.deployTrigger({
                                userId,
                                triggerId: component.key,
                                configuredProps,
                                webhookUrl,
                              })
                              setActionRunOutput(data)
                            }
                          }}
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
      </ScrollArea>
    </div>
  )
}
