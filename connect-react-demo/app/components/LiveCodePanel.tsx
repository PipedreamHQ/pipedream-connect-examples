"use client"

import { useState } from "react"
import { useAppState } from "@/lib/app-state"
import { cn } from "@/lib/utils"
import { CodeBlock } from "./ui/code-block"
import { 
  generateComponentCode, 
  generateSetupCode, 
  generateApiCode, 
  CODE_FILES 
} from "@/lib/code-templates"

export function LiveCodePanel() {
  const { 
    component, 
    selectedComponentType, 
    userId,
    configuredProps,
    webhookUrl,
    selectedApp,
    hideOptionalProps,
    enableDebugging,
    propNames
  } = useAppState()

  const [activeTab, setActiveTab] = useState("current")
  const [showLiveUpdates, setShowLiveUpdates] = useState(true)

  const currentComponentCode = generateComponentCode({
    userId,
    componentKey: component?.key,
    configuredProps,
    selectedComponentType,
    webhookUrl,
    hideOptionalProps,
    enableDebugging,
    propNames
  })

  const setupCode = generateSetupCode(userId)

  const apiCode = generateApiCode(userId)

  const files = CODE_FILES

  const getCodeForFile = (fileId: string) => {
    switch (fileId) {
      case "current": return currentComponentCode
      case "setup": return setupCode
      case "api": return apiCode
      default: return ""
    }
  }

  return (
    <div className="flex flex-col bg-gray-50">
      {/* Header section - fixed height */}
      <div className="flex-shrink-0 bg-white border-b">
        <div className="px-4 sm:px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Implementation Code</h2>
          <p className="text-sm text-gray-500 mt-1">
            {files.find(f => f.id === activeTab)?.description || "Ready-to-use React files - copy these into your project to add Pipedream Connect"}
          </p>
        </div>
        
        {/* IDE-style file tabs */}
        <div className="flex border-b bg-gray-100 pl-4 sm:pl-6 overflow-x-auto">
          {files.map((file, index) => (
            <button
              key={file.id}
              onClick={() => setActiveTab(file.id)}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-3 text-sm border-r border-gray-200 transition-colors relative whitespace-nowrap min-h-[44px]",
                activeTab === file.id
                  ? "bg-white text-gray-900 border-b-2 border-blue-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <span className="text-xs">{file.icon}</span>
              <span className="font-mono text-xs sm:text-sm">{file.name}</span>
              {activeTab === file.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Code section */}
      <div className="relative px-4 sm:px-6 pb-6">
        <CodeBlock language={activeTab === "api" ? "typescript" : "tsx"}>
          {getCodeForFile(activeTab)}
        </CodeBlock>
        
        {activeTab === "current" && component && showLiveUpdates && (
          <div className="absolute bottom-4 left-0 right-0 mx-6 p-3 bg-blue-900/90 backdrop-blur-sm rounded-lg border border-blue-700/50">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm flex-1">
                <p className="font-medium text-blue-100">Live Updates</p>
                <p className="text-blue-200 mt-1">
                  This code updates in real-time as you configure the component in the demo.
                </p>
              </div>
              <button
                onClick={() => setShowLiveUpdates(false)}
                className="text-blue-300 hover:text-blue-100 transition-colors p-1"
                aria-label="Dismiss"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}