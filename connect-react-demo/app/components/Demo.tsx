"use client"

import { useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ConfigPanel } from "./ConfigPanel"
import { DemoHeader } from "./DemoHeader"
import { DemoPanel } from "./DemoPanel"
import { SDKDebugger } from "./SDKDebugger"
import { Badge } from "@/components/ui/badge"
import { useSDKLoggerCallCount, useSDKLoggerPendingCount } from "@/lib/sdk-logger"

export default function Demo() {
  const [activeTab, setActiveTab] = useState("demo")
  const callCount = useSDKLoggerCallCount()
  const pendingCount = useSDKLoggerPendingCount()

  return (
    <div className="flex flex-col min-h-0 h-screen">
      <DemoHeader />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="border-b">
          <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger 
              value="demo" 
              className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6"
            >
              Component Demo
            </TabsTrigger>
            <TabsTrigger 
              value="sdk" 
              className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 relative"
            >
              SDK Debugger
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
        
        <TabsContent value="demo" className="flex-1 min-h-0 m-0">
          <ResizablePanelGroup direction="horizontal" className="min-h-0 h-full">
            <ResizablePanel
              defaultSize={43}
              minSize={25}
              maxSize={60}
              className="min-h-0 bg-zinc-50"
            >
              <div className="flex flex-col min-h-0 h-full">
                <ConfigPanel />
              </div>
            </ResizablePanel>

            <ResizableHandle className="w-px bg-border" />

            <ResizablePanel defaultSize={57} className="min-h-0">
              <div className="flex flex-col min-h-0 h-full">
                <DemoPanel />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </TabsContent>
        
        <TabsContent value="sdk" className="flex-1 min-h-0 m-0">
          <SDKDebugger />
        </TabsContent>
      </Tabs>
    </div>
  )
}
