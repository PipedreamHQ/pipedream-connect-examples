"use client"

import { useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ConfigPanel } from "./ConfigPanel"
import { LiveCodePanel } from "./LiveCodePanel"
import { DemoHeader } from "./DemoHeader"
import { DemoPanel } from "./DemoPanel"
import { SDKDebugger } from "./SDKDebugger"
import { Badge } from "@/components/ui/badge"
import { useSDKLoggerCallCount, useSDKLoggerPendingCount } from "@/lib/sdk-logger"
import { IoSettingsOutline, IoFlashOutline, IoCodeSlashOutline } from "react-icons/io5"

export default function Demo() {
  const [activeTab, setActiveTab] = useState("config")
  const callCount = useSDKLoggerCallCount()
  const pendingCount = useSDKLoggerPendingCount()

  return (
    <div className="flex flex-col min-h-0 h-screen">
      <DemoHeader />
      
      {/* Mobile: Vertical stacked layout */}
      <div className="md:hidden flex flex-col h-full overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="border-b flex-shrink-0">
              <TabsList className="h-12 w-full justify-center rounded-none bg-transparent p-0">
                <TabsTrigger 
                  value="config" 
                  className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 flex-1"
                >
                  <IoSettingsOutline className="h-4 w-4" />
                  <span className="ml-2">Config</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="code" 
                  className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 flex-1"
                >
                  <IoCodeSlashOutline className="h-4 w-4" />
                  <span className="ml-2">Code</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="debugger" 
                  className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 relative flex-1"
                >
                  <IoFlashOutline className="h-4 w-4" />
                  <span className="ml-2">Debug</span>
                  {callCount > 0 && (
                    <Badge 
                      variant={pendingCount > 0 ? "default" : "secondary"} 
                      className="ml-1 h-4 px-1 text-xs"
                    >
                      {callCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="config" className="flex-1 min-h-0 m-0 overflow-auto">
              <ConfigPanel />
            </TabsContent>
            
            <TabsContent value="code" className="flex-1 min-h-0 m-0 overflow-auto">
              <LiveCodePanel />
            </TabsContent>
            
            <TabsContent value="debugger" className="flex-1 min-h-0 m-0 overflow-auto">
              <SDKDebugger />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="border-t flex-shrink-0 max-h-[50%] overflow-auto">
          <DemoPanel />
        </div>
      </div>

      {/* Desktop: Resizable horizontal layout with unified tabs */}
      <div className="hidden md:block min-h-0 h-full">
        <ResizablePanelGroup direction="horizontal" className="min-h-0 h-full">
          <ResizablePanel
            defaultSize={43}
            minSize={25}
            maxSize={60}
            className="min-h-0 bg-zinc-50"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <div className="border-b bg-white">
                <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0 px-4">
                  <TabsTrigger 
                    value="config" 
                    className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6"
                  >
                    <IoSettingsOutline className="h-4 w-4 mr-2" />
                    Config
                  </TabsTrigger>
                  <TabsTrigger 
                    value="code" 
                    className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6"
                  >
                    <IoCodeSlashOutline className="h-4 w-4 mr-2" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger 
                    value="debugger" 
                    className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 relative"
                  >
                    <IoFlashOutline className="h-4 w-4 mr-2" />
                    Debug
                    {callCount > 0 && (
                      <Badge 
                        variant={pendingCount > 0 ? "default" : "secondary"} 
                        className="ml-2 h-5 px-1.5 text-xs"
                      >
                        {callCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="config" className="flex-1 min-h-0 m-0">
                <ConfigPanel />
              </TabsContent>
              
              <TabsContent value="code" className="flex-1 min-h-0 m-0">
                <LiveCodePanel />
              </TabsContent>
              
              <TabsContent value="debugger" className="flex-1 min-h-0 m-0">
                <SDKDebugger />
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-border" />

          <ResizablePanel defaultSize={57} className="min-h-0">
            <div className="flex flex-col min-h-0 h-full">
              <DemoPanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
