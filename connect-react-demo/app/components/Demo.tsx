"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ConfigPanel } from "./ConfigPanel"
import { LiveCodePanel } from "./LiveCodePanel"
import { DemoPanel } from "./DemoPanel"
import { SDKDebugger } from "./SDKDebugger"
import { DemoHeader } from "./DemoHeader"
import { DemoTabTrigger } from "./DemoTabTrigger"
import { useSDKLoggerCallCount, useSDKLoggerPendingCount } from "@/lib/sdk-logger"
import { IoSettingsOutline, IoFlashOutline, IoCodeSlashOutline, IoChevronDown } from "react-icons/io5"
import { cn } from "@/lib/utils"

const TABS = [
  { value: "config", icon: IoSettingsOutline, label: "Config" },
  { value: "code", icon: IoCodeSlashOutline, label: "Code" },
  { value: "debugger", icon: IoFlashOutline, label: "Debug" },
] as const

export default function Demo() {
  const [activeTab, setActiveTab] = useState("config")
  const [showMoreInfo, setShowMoreInfo] = useState(false)
  const callCount = useSDKLoggerCallCount()
  const pendingCount = useSDKLoggerPendingCount()

  return (
    <div className="flex flex-col min-h-screen">
      <DemoHeader />
      
      <div className="px-4 sm:px-6 py-8 sm:py-12 border-b bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
            Pipedream Connect
          </h1>
          
          <div className="space-y-6 text-neutral-700">
            <p className="text-xl sm:text-2xl font-medium text-neutral-800">
              One SDK, thousands of API integrations for your app or AI agent
            </p>
          
            {/* Desktop: Show full content always */}
            <div className="hidden sm:block space-y-6">
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                This demo app shows Pipedream Connect in action using the{" "}
                <a 
                  href="https://github.com/PipedreamHQ/pipedream/tree/master/packages/connect-react" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 transition-colors border-b border-blue-200 hover:border-blue-300"
                >
                  @pipedream/connect-react
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>{" "}
                frontend package. 
                Connect provides managed authentication, prebuilt form components, and access to 2,700+ APIs with 10,000+ triggers and actions.
                You can use our backend API/SDK with your own frontend, or use our React components like shown here.
              </p>
            </div>

            {/* Mobile: Collapsible content */}
            <div className="sm:hidden">
              <Collapsible open={showMoreInfo} onOpenChange={setShowMoreInfo}>
                <CollapsibleTrigger className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  <span>More info</span>
                  <IoChevronDown className={cn("h-3 w-3 transition-transform", showMoreInfo && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-3">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      This demo app shows Pipedream Connect in action using the{" "}
                      <a 
                        href="https://github.com/PipedreamHQ/pipedream/tree/master/packages/connect-react" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 transition-colors border-b border-blue-200 hover:border-blue-300"
                      >
                        @pipedream/connect-react
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>{" "}
                      frontend package. 
                      Connect provides managed authentication, prebuilt form components, and access to 2,700+ APIs with 10,000+ triggers and actions.
                      You can use our backend API/SDK with your own frontend, or use our React components like shown here.
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      </div>
      
      <div className="md:hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <div className="border-b flex-shrink-0">
            <TabsList className="h-12 w-full justify-center rounded-none bg-transparent p-0">
              {TABS.map((tab) => (
                <DemoTabTrigger
                  key={tab.value}
                  value={tab.value}
                  icon={tab.icon}
                  label={tab.label}
                  callCount={callCount}
                  pendingCount={pendingCount}
                  isMobile
                />
              ))}
            </TabsList>
          </div>
          
          <TabsContent value="config" className="m-0">
            <div className="flex flex-col">
              <ConfigPanel />
              <div className="border-t">
                <DemoPanel />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="code" className="m-0">
            <LiveCodePanel />
          </TabsContent>
          
          <TabsContent value="debugger" className="m-0">
            <SDKDebugger />
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-2 gap-6 px-6 py-6">
          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
              <div className="border-b bg-gray-50/50">
                <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0 px-4">
                  {TABS.map((tab) => (
                    <DemoTabTrigger
                      key={tab.value}
                      value={tab.value}
                      icon={tab.icon}
                      label={tab.label}
                      callCount={callCount}
                      pendingCount={pendingCount}
                    />
                  ))}
                </TabsList>
              </div>
              
              <TabsContent value="config" className="m-0">
                <ConfigPanel />
              </TabsContent>
              
              <TabsContent value="code" className="m-0">
                <LiveCodePanel />
              </TabsContent>
              
              <TabsContent value="debugger" className="m-0">
                <SDKDebugger />
              </TabsContent>
            </Tabs>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
            <DemoPanel />
          </div>
        </div>
      </div>
      
    </div>
  )
}
