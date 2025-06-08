"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs"
import { ConfigPanel } from "./ConfigPanel"
import { LiveCodePanel } from "./LiveCodePanel"
import { DemoPanel } from "./DemoPanel"
import { SDKDebugger } from "./SDKDebugger"
import { DemoHeader } from "./DemoHeader"
import { DemoTabTrigger } from "./DemoTabTrigger"
import { useSDKLoggerCallCount, useSDKLoggerPendingCount } from "@/lib/sdk-logger"
import { IoSettingsOutline, IoFlashOutline, IoCodeSlashOutline } from "react-icons/io5"

const TABS = [
  { value: "config", icon: IoSettingsOutline, label: "Config" },
  { value: "code", icon: IoCodeSlashOutline, label: "Code" },
  { value: "debugger", icon: IoFlashOutline, label: "Debug" },
] as const

export default function Demo() {
  const [activeTab, setActiveTab] = useState("config")
  const callCount = useSDKLoggerCallCount()
  const pendingCount = useSDKLoggerPendingCount()

  return (
    <div className="flex flex-col min-h-screen">
      <DemoHeader />
      
      <div className="px-4 sm:px-6 py-6 sm:py-8 border-b bg-white">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-semibold text-neutral-800 mb-4">
            Pipedream Connect Demo
          </h1>
          
          <div className="space-y-4 text-neutral-700">
            <p className="text-lg font-medium text-neutral-800">
              Demo of Pipedream Connect: One SDK, thousands of API integrations for your app or AI agent
            </p>
            <p className="text-sm sm:text-base leading-relaxed">
              This demo shows Pipedream Connect in action using the <strong>@pipedream/connect-react</strong> frontend package. 
              Connect provides managed authentication, prebuilt components, and access to 2,700+ APIs with 10,000+ triggers and actions.
              You can use our backend API/SDK with your own frontend, or use our React components like shown here.
            </p>
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
