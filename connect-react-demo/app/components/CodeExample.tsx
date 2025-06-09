"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { IoCopyOutline, IoCheckmarkOutline, IoCodeSlashOutline, IoChevronDown } from "react-icons/io5"
import { cn } from "@/lib/utils"
import { useAppState } from "@/lib/app-state"

interface CodeExampleProps {
  title: string
  description: string
  children: string
  className?: string
}

function CodeBlock({ children, className }: { children: string, className?: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={copyToClipboard}
        className="absolute top-2 right-2 h-8 w-8 p-0 bg-gray-800/10 hover:bg-gray-800/20 backdrop-blur-sm"
      >
        {copied ? (
          <IoCheckmarkOutline className="h-4 w-4 text-green-600" />
        ) : (
          <IoCopyOutline className="h-4 w-4 text-gray-600" />
        )}
      </Button>
      <pre className="text-sm bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto pr-12 font-mono">
        <code>{children}</code>
      </pre>
    </div>
  )
}

export function CodeExample({ title, description, children, className }: CodeExampleProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between h-auto p-4 text-left"
        >
          <div className="flex items-start gap-3">
            <IoCodeSlashOutline className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900">{title}</div>
              <div className="text-sm text-gray-500 mt-1">{description}</div>
            </div>
          </div>
          <IoChevronDown 
            className={cn(
              "h-4 w-4 transition-transform text-gray-400 flex-shrink-0",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="mt-3">
          <CodeBlock>{children}</CodeBlock>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function LiveCodeExamples() {
  const { 
    selectedComponentKey, 
    selectedComponentType, 
    userId,
    configuredProps,
    webhookUrl 
  } = useAppState()

  const [activeFileTab, setActiveFileTab] = useState("app")

  // Real app integration files
  const appCode = `// app/layout.tsx (Next.js App Router)
import { ClientProvider } from './components/ClientProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  )
}`

  const clientProviderCode = `// app/components/ClientProvider.tsx
"use client"

import { FrontendClientProvider } from "@pipedream/connect-react"
import { createFrontendClient } from "@pipedream/sdk/browser"

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const client = createFrontendClient({
    environment: process.env.NEXT_PUBLIC_PIPEDREAM_ENVIRONMENT,
    tokenCallback: async () => {
      const response = await fetch('/api/connect/token')
      const { token } = await response.json()
      return token
    },
    externalUserId: "user-${userId}",
  })

  return (
    <FrontendClientProvider client={client}>
      {children}
    </FrontendClientProvider>
  )
}`

  const integrationPageCode = selectedComponentKey ? `// app/integrations/page.tsx
"use client"

import { useState } from "react"
import { SelectApp, ComponentForm, useFrontendClient } from "@pipedream/connect-react"

export default function IntegrationsPage() {
  const [selectedApp, setSelectedApp] = useState()
  const [selectedComponent, setSelectedComponent] = useState()
  const [configuredProps, setConfiguredProps] = useState({})
  const frontendClient = useFrontendClient()

  const handleComponentSubmit = async (ctx) => {
    try {
      ${selectedComponentType === "action" ? 
        `const result = await frontendClient.actionRun({
        userId: "user-${userId}",
        actionId: "${selectedComponentKey}",
        configuredProps: ctx.configuredProps,
      })` : 
        `const result = await frontendClient.deployTrigger({
        userId: "user-${userId}",
        triggerId: "${selectedComponentKey}",
        configuredProps: ctx.configuredProps,
        webhookUrl: "https://your-app.com/api/webhook",
      })`}
      
      console.log('Success:', result)
      // Handle success (show toast, redirect, etc.)
    } catch (error) {
      console.error('Error:', error)
      // Handle error (show error message)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Connect Your Apps</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select an app to connect
          </label>
          <SelectApp value={selectedApp} onChange={setSelectedApp} />
        </div>

        {selectedComponent && (
          <ComponentForm
            userId="user-${userId}"
            component={selectedComponent}
            configuredProps={configuredProps}
            onUpdateConfiguredProps={setConfiguredProps}
            onSubmit={handleComponentSubmit}
          />
        )}
      </div>
    </div>
  )
}` : `// app/integrations/page.tsx
// Select a component in the demo to see the full page example`

  const apiRouteCode = `// app/api/connect/token/route.ts (Next.js API Route)
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get the current user (from session, JWT, etc.)
    const userId = await getCurrentUserId(request)
    
    // Generate a Connect token for this user
    const response = await fetch(
      \`https://api.pipedream.com/v1/connect/token\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${process.env.PIPEDREAM_API_KEY}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          external_user_id: userId,
          // Optional: scope to specific apps or components
        }),
      }
    )

    const { token } = await response.json()
    
    return NextResponse.json({ token })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate token' }, 
      { status: 500 }
    )
  }
}`

  const files = [
    { id: "app", name: "layout.tsx", description: "App setup with provider" },
    { id: "provider", name: "ClientProvider.tsx", description: "SDK client configuration" },
    { id: "page", name: "integrations/page.tsx", description: "Integration UI page" },
    { id: "api", name: "api/connect/token/route.ts", description: "Backend token generation" },
  ]

  const getFileContent = (fileId: string) => {
    switch (fileId) {
      case "app": return appCode
      case "provider": return clientProviderCode
      case "page": return integrationPageCode
      case "api": return apiRouteCode
      default: return ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <IoCodeSlashOutline className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Implementation Steps</h3>
        <span className="text-sm text-gray-500">Complete Next.js integration</span>
      </div>
      
      {/* File tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => setActiveFileTab(file.id)}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm",
                activeFileTab === file.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {file.name}
            </button>
          ))}
        </nav>
      </div>

      {/* File content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">
              {files.find(f => f.id === activeFileTab)?.name}
            </h4>
            <p className="text-sm text-gray-500">
              {files.find(f => f.id === activeFileTab)?.description}
            </p>
          </div>
        </div>
        
        <CodeBlock>{getFileContent(activeFileTab)}</CodeBlock>
      </div>
    </div>
  )
}