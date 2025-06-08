"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfigPanel } from "./ConfigPanel"
import { LiveCodePanel } from "./LiveCodePanel"
import { DemoPanel } from "./DemoPanel"
import { SDKDebugger } from "./SDKDebugger"
import { PipedreamLogo } from "./PipedreamLogo"
import { Badge } from "@/components/ui/badge"
import { useSDKLoggerCallCount, useSDKLoggerPendingCount } from "@/lib/sdk-logger"
import { IoSettingsOutline, IoFlashOutline, IoCodeSlashOutline, IoHelpCircleOutline, IoMenuOutline } from "react-icons/io5"
import { SiGithub } from "react-icons/si"

export default function Demo() {
  const [activeTab, setActiveTab] = useState("config")
  const callCount = useSDKLoggerCallCount()
  const pendingCount = useSDKLoggerPendingCount()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-neutral-200 relative">
        {/* Left side - Logo */}
        <div className="flex items-center">
          <PipedreamLogo className="text-neutral-600 h-[18px] w-auto" />
        </div>
        
        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-x-2">
          <Button
            variant="outline"
            className="flex items-center gap-x-2 text-neutral-600 hover:text-neutral-800 border-neutral-200 hover:bg-neutral-50"
            onClick={() => window.open("https://pipedream.com/support", "_blank")}
          >
            Contact us
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-x-2 text-neutral-600 hover:text-neutral-800 border-neutral-200 hover:bg-neutral-50"
            onClick={() => window.open("https://pipedream.com/docs/connect/components", "_blank")}
          >
            Read the docs
          </Button>
          <Button variant="default" className="gap-2" asChild>
            <a
              href="https://github.com/PipedreamHQ/pipedream-connect-examples/tree/master/connect-react-demo"
              target="_blank"
              rel="noopener noreferrer"
            >
              <SiGithub className="h-4 w-4" />
              View on GitHub
            </a>
          </Button>
        </div>

        {/* Mobile hamburger menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="!h-11 !w-11 !p-0">
                <IoMenuOutline className="!h-7 !w-7" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => window.open("https://pipedream.com/support", "_blank")} className="justify-start">
                <IoHelpCircleOutline className="h-4 w-4 mr-3" />
                Contact us
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open("https://pipedream.com/docs/connect/components", "_blank")} className="justify-start">
                <div className="h-4 w-4 mr-3 flex items-center justify-center text-sm">📖</div>
                Read the docs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open("https://github.com/PipedreamHQ/pipedream-connect-examples/tree/master/connect-react-demo", "_blank")} className="justify-start">
                <SiGithub className="h-4 w-4 mr-3" />
                View on GitHub
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Title Section */}
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
      
      {/* Mobile: Tab-specific layouts */}
      <div className="md:hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
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
          
          {/* Config tab: Natural scrolling with demo at bottom */}
          <TabsContent value="config" className="m-0">
            <div className="flex flex-col">
              <ConfigPanel />
              <div className="border-t">
                <DemoPanel />
              </div>
            </div>
          </TabsContent>
          
          {/* Code tab: Natural scrolling, no demo */}
          <TabsContent value="code" className="m-0">
            <LiveCodePanel />
          </TabsContent>
          
          {/* Debug tab: Natural scrolling, no demo */}
          <TabsContent value="debugger" className="m-0">
            <SDKDebugger />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: Two-column layout */}
      <div className="hidden md:block">
        <div className="grid grid-cols-2 gap-6 px-6 py-6">
          {/* Left column - Config/Code/Debug tabs */}
          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
              <div className="border-b bg-gray-50/50">
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

          {/* Right column - Demo */}
          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
            <DemoPanel />
          </div>
        </div>
      </div>
      
    </div>
  )
}
