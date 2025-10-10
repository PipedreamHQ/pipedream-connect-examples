"use client"

import { AppStateProvider } from "@/lib/app-state"
import { useStableUuid } from "@/lib/stable-uuid"
import { FrontendClientProvider } from "@pipedream/connect-react"
import {
  createFrontendClient,
  type PipedreamEnvironment,
  type ProjectEnvironment
} from "@pipedream/sdk/browser"
import { fetchToken } from "../actions/backendClient"
import { SDKLoggerProvider, useSDKLogger, createLoggedFrontendClient } from "@/lib/sdk-logger"
import Demo from "./Demo"
function DemoWithLoading({ isLoading }: { isLoading: boolean }) {
  return <Demo isLoading={isLoading} />
}

const ClientProviderWithLogger = () => {
  const [externalUserId] = useStableUuid()
  const logger = useSDKLogger()

  const frontendHost = process.env.NEXT_PUBLIC_PIPEDREAM_FRONTEND_HOST
  const environment = process.env.NEXT_PUBLIC_PIPEDREAM_ENVIRONMENT as PipedreamEnvironment || undefined
  const projectEnvironment = process.env.NEXT_PUBLIC_PIPEDREAM_PROJECT_ENVIRONMENT as ProjectEnvironment

  const client = externalUserId ? createLoggedFrontendClient(
    createFrontendClient({
      ...(frontendHost && { frontendHost }),
      ...(environment && { environment }),
      ...(projectEnvironment && { projectEnvironment }),
      tokenCallback: fetchToken,
      externalUserId,
    }),
    logger
  ) : null

  if (!client) {
    return <DemoWithLoading isLoading={true} />
  }

  return (
    <FrontendClientProvider client={client}>
      <AppStateProvider>
        <DemoWithLoading isLoading={false} />
      </AppStateProvider>
    </FrontendClientProvider>
  );
}

export const ClientWrapper = () => {
  return (
    <SDKLoggerProvider>
      <ClientProviderWithLogger />
    </SDKLoggerProvider>
  );
}
