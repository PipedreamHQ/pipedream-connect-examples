"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { IoCopyOutline, IoCheckmarkOutline, IoCodeSlashOutline } from "react-icons/io5"
import { useAppState } from "@/lib/app-state"
import { cn } from "@/lib/utils"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

function CodeBlock({ children, className, language = "tsx" }: { children: string, className?: string, language?: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("relative", className)} style={{ height: 'calc(100vh - 280px)' }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={copyToClipboard}
        className="absolute top-3 right-3 h-8 w-8 p-0 bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm z-10"
      >
        {copied ? (
          <IoCheckmarkOutline className="h-4 w-4 text-green-400" />
        ) : (
          <IoCopyOutline className="h-4 w-4 text-gray-300" />
        )}
      </Button>
      <div className="h-full overflow-hidden">
        <SyntaxHighlighter
          language={language === "tsx" ? "typescript" : language}
          style={tomorrow}
          customStyle={{
            margin: 0,
            padding: '24px 32px',
            background: '#1a1a1a',
            fontSize: '14px',
            lineHeight: '1.6',
            height: '100%',
            overflow: 'auto'
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
            }
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

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

  // Generate the current ComponentForm code
  const currentComponentCode = component ? `import { ComponentForm, useFrontendClient, useComponent } from "@pipedream/connect-react"
import { useState } from "react"

export default function MyIntegrationPage() {
  const frontendClient = useFrontendClient()
  const [configuredProps, setConfiguredProps] = useState(${JSON.stringify(configuredProps, null, 2).replace(/\n/g, '\n  ')})

  const { component } = useComponent({
    key: "${component.key}"
  })

  const handleSubmit = async (ctx) => {
    try {
      const result = await frontendClient.${selectedComponentType}Run({
        userId: "${userId}",
        ${selectedComponentType}Id: "${component.key}",
        configuredProps: ctx.configuredProps,${selectedComponentType === "trigger" ? `
        webhookUrl: "${webhookUrl || 'https://your-app.com/webhook'}",` : ""}
      })
      
      console.log('✅ ${selectedComponentType} succeeded:', result)
      // Handle success - show toast, redirect, etc.
      
    } catch (error) {
      console.error('❌ ${selectedComponentType} failed:', error)
      // Handle error - show error message
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        ${component.app?.name} - ${component.name}
      </h1>
      
      <ComponentForm
        userId="${userId}"
        component={component}
        configuredProps={configuredProps}
        onUpdateConfiguredProps={setConfiguredProps}${hideOptionalProps ? `
        hideOptionalProps={true}` : ""}${enableDebugging ? `
        enableDebugging={true}` : ""}${propNames && propNames.length > 0 ? `
        propNames={${JSON.stringify(propNames)}}` : ""}
        onSubmit={handleSubmit}
      />
    </div>
  )
}` : `// Select an app and component to see the implementation code

import { SelectApp, SelectComponent } from "@pipedream/connect-react"
import { useState } from "react"

export default function AppSelector() {
  const [selectedApp, setSelectedApp] = useState()
  const [selectedComponent, setSelectedComponent] = useState()
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Choose an app
        </label>
        <SelectApp 
          value={selectedApp} 
          onChange={setSelectedApp} 
        />
      </div>
      
      {selectedApp && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Choose a {selectedComponentType}
          </label>
          <SelectComponent
            app={selectedApp}
            componentType="${selectedComponentType}"
            value={selectedComponent}
            onChange={setSelectedComponent}
          />
        </div>
      )}
    </div>
  )
}`

  // Generate setup code
  const setupCode = `"use client"

import { FrontendClientProvider } from "@pipedream/connect-react"
import { createFrontendClient } from "@pipedream/sdk/browser"

export function ClientProvider({ children }) {
  const client = createFrontendClient({
    environment: process.env.NEXT_PUBLIC_PIPEDREAM_PROJECT_ENVIRONMENT!,
    tokenCallback: async () => {
      const response = await fetch('/api/connect/token')
      return response.json()
    },
    externalUserId: "${userId}",
  })

  return (
    <FrontendClientProvider client={client}>
      {children}
    </FrontendClientProvider>
  )
}`

  // Generate API route code using the backend SDK
  const apiCode = `import { NextRequest, NextResponse } from 'next/server'
import { createBackendClient } from '@pipedream/sdk/server'

const pd = createBackendClient({
  projectId: process.env.PIPEDREAM_PROJECT_ID!,
  environment: process.env.PIPEDREAM_PROJECT_ENVIRONMENT!,
  credentials: {
    clientId: process.env.PIPEDREAM_CLIENT_ID!,
    clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
  },
})

export async function GET(request: NextRequest) {
  try {
    // Get the current user (from session, JWT, etc.)
    const userId = await getCurrentUserId(request)
    
    // Generate a Connect token for this user using the backend SDK
    const { token } = await pd.createConnectToken({
      external_user_id: userId,
      // Optional: restrict access to specific origins
      // allowed_origins: ['https://your-app.com'],
    })
    
    return NextResponse.json({ token })
  } catch (error) {
    console.error('Failed to generate Connect token:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' }, 
      { status: 500 }
    )
  }
}

async function getCurrentUserId(request: NextRequest) {
  // TODO: Implement your user authentication logic
  // This could be from JWT, session, etc.
  return "${userId}"
}`

  const files = [
    { 
      id: "current", 
      name: "IntegrationPage.tsx", 
      description: "Main integration component with form",
      icon: "📄"
    },
    { 
      id: "setup", 
      name: "ClientProvider.tsx", 
      description: "SDK client configuration",
      icon: "⚙️"
    },
    { 
      id: "api", 
      name: "route.ts", 
      description: "Backend token generation API",
      icon: "🔗"
    }
  ]

  const getCodeForFile = (fileId: string) => {
    switch (fileId) {
      case "current": return currentComponentCode
      case "setup": return setupCode
      case "api": return apiCode
      default: return ""
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header section - fixed height */}
      <div className="flex-shrink-0 bg-white border-b">
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <IoCodeSlashOutline className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Implementation Code</h2>
          </div>
        </div>
        
        {/* IDE-style file tabs */}
        <div className="flex border-b bg-gray-100">
          {files.map((file, index) => (
            <button
              key={file.id}
              onClick={() => setActiveTab(file.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm border-r border-gray-200 transition-colors relative",
                activeTab === file.id
                  ? "bg-white text-gray-900 border-b-2 border-blue-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <span className="text-xs">{file.icon}</span>
              <span className="font-mono">{file.name}</span>
              {activeTab === file.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Code section - takes remaining height */}
      <div className="flex-1 min-h-0 relative">
        <CodeBlock language={activeTab === "api" ? "typescript" : "tsx"}>
          {getCodeForFile(activeTab)}
        </CodeBlock>
        
        {activeTab === "current" && component && (
          <div className="absolute bottom-4 left-4 right-4 p-3 bg-blue-900/90 backdrop-blur-sm rounded-lg border border-blue-700/50">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm">
                <p className="font-medium text-blue-100">Live Updates</p>
                <p className="text-blue-200 mt-1">
                  This code updates in real-time as you configure the component in the demo.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}