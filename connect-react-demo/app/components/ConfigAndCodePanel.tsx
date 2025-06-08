"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ConfigPanel } from "./ConfigPanel"
import { LiveCodePanel } from "./LiveCodePanel"
import { IoSettingsOutline, IoCodeSlashOutline } from "react-icons/io5"

export function ConfigAndCodePanel() {
  const [activeTab, setActiveTab] = useState("config")

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b bg-white px-3 sm:px-4 py-2">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="config" className="flex items-center gap-2 h-10 text-sm">
              <IoSettingsOutline className="h-4 w-4" />
              <span className="hidden sm:inline">Configuration</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2 h-10 text-sm">
              <IoCodeSlashOutline className="h-4 w-4" />
              <span className="hidden sm:inline">Code Examples</span>
              <span className="sm:hidden">Code</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="config" className="flex-1 min-h-0 m-0">
          <ConfigPanel />
        </TabsContent>
        
        <TabsContent value="code" className="flex-1 min-h-0 m-0">
          <LiveCodePanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}