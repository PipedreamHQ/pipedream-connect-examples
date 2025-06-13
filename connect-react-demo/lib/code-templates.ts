export interface CodeTemplateData {
  externalUserId: string
  componentKey?: string
  configuredProps: Record<string, any>
  selectedComponentType: "action" | "trigger"
  webhookUrl?: string
  hideOptionalProps?: boolean
  enableDebugging?: boolean
  propNames?: string[]
}

export const generateComponentCode = (data: CodeTemplateData) => {
  if (!data.componentKey) {
    return `// Select an app and component to see the implementation code

import { SelectApp, SelectComponent } from "@pipedream/connect-react"
import { useState } from "react"

function AppSelector() {
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
            Choose a ${data.selectedComponentType}
          </label>
          <SelectComponent
            app={selectedApp}
            componentType="${data.selectedComponentType}"
            value={selectedComponent}
            onChange={setSelectedComponent}
          />
        </div>
      )}
    </div>
  )
}`
  }

  const optionalProps = [
    data.hideOptionalProps && `        hideOptionalProps={true}`,
    data.enableDebugging && `        enableDebugging={true}`,
    data.propNames?.length && `        propNames={${JSON.stringify(data.propNames)}}`,
  ].filter(Boolean).join('\n')

  const webhookUrlLine = data.selectedComponentType === "trigger" 
    ? `\n      webhookUrl: "${data.webhookUrl || 'https://your-app.com/webhook'}",` 
    : ""

  return `import { ComponentForm, useFrontendClient, useComponent } from "@pipedream/connect-react"
import { useState } from "react"

function MyComponent() {
  const frontendClient = useFrontendClient()
  const [configuredProps, setConfiguredProps] = useState(${JSON.stringify(data.configuredProps, null, 2).replace(/\n/g, '\n  ')})

  const { component } = useComponent({
    key: "${data.componentKey}"
  })

  const handleSubmit = async (ctx) => {
    const result = await frontendClient.${data.selectedComponentType === "action" ? "actionRun" : "deployTrigger"}({
      externalUserId: "${data.externalUserId}",
      ${data.selectedComponentType}Id: "${data.componentKey}",
      configuredProps: ctx.configuredProps,${webhookUrlLine}
    })
    
    // Handle success - show toast, redirect, etc.
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <ComponentForm
        externalUserId="${data.externalUserId}"
        component={component}
        configuredProps={configuredProps}
        onUpdateConfiguredProps={setConfiguredProps}${optionalProps ? '\n' + optionalProps : ''}
        onSubmit={handleSubmit}
      />
    </div>
  )
}`
}

export const generateSetupCode = (externalUserId: string) => `import { FrontendClientProvider } from "@pipedream/connect-react"
import { createFrontendClient } from "@pipedream/sdk/browser"

export function ClientProvider({ children }) {
  const client = createFrontendClient({
    environment: process.env.PIPEDREAM_PROJECT_ENVIRONMENT
    tokenCallback: async ({ externalUserId }) => {
      // Call your backend to get a Connect token for this user
      const response = await fetch('/api/connect/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ externalUserId }),
      })
      const { token } = await response.json()
      return token
    },
    externalUserId: "${externalUserId}", // Your user's unique ID
  })

  return (
    <FrontendClientProvider client={client}>
      {children}
    </FrontendClientProvider>
  )
}`

export const generateApiCode = (externalUserId: string) => `import { NextRequest, NextResponse } from 'next/server'
import { createBackendClient } from '@pipedream/sdk/server'

const pd = createBackendClient({
  projectId: process.env.PIPEDREAM_PROJECT_ID!,
  environment: process.env.PIPEDREAM_PROJECT_ENVIRONMENT!,
  credentials: {
    clientId: process.env.PIPEDREAM_CLIENT_ID!,
    clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
  },
})

export async function POST(request: NextRequest) {
  const { externalUserId } = await request.json()
  
  // Generate a Connect token for this user
  const { token } = await pd.createConnectToken({
    external_user_id: externalUserId,
    allowed_origins: [
      'http://localhost:3000',
      'https://your-app.com',
    ],
  })
  
  return NextResponse.json({ token })
}`

export const CODE_FILES = [
  { 
    id: "current", 
    name: "MyComponent.tsx", 
    description: "Main React component that renders the integration form and handles user interactions",
    icon: "📄"
  },
  { 
    id: "setup", 
    name: "ClientProvider.tsx", 
    description: "Provider component that configures the Pipedream SDK and wraps your app",
    icon: "⚙️"
  },
  { 
    id: "api", 
    name: "api/connect/token/route.ts", 
    description: "Backend API endpoint that securely generates Connect tokens for frontend authentication",
    icon: "🔗"
  }
] as const