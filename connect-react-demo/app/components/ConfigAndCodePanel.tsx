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
        <div className="border-b bg-white px-4 py-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <IoSettingsOutline className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <IoCodeSlashOutline className="h-4 w-4" />
              Code Examples
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