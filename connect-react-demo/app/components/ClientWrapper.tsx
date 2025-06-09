"use client"

import { AppStateProvider } from "@/lib/app-state"
import { useStableUuid } from "@/lib/stable-uuid"
import { FrontendClientProvider } from "@pipedream/connect-react"
import { createFrontendClient } from "@pipedream/sdk/browser"
import { fetchToken } from "../actions/backendClient"
import { SDKLoggerProvider, useSDKLogger, createLoggedFrontendClient } from "@/lib/sdk-logger"
import Demo from "./Demo"
function DemoWithLoading({ isLoading }: { isLoading: boolean }) {
  return <Demo isLoading={isLoading} />
}

const ClientProviderWithLogger = () => {
  const [externalUserId] = useStableUuid()
  const logger = useSDKLogger()

  const client = externalUserId ? createLoggedFrontendClient(
    createFrontendClient({
      environment: process.env.PIPEDREAM_PROJECT_ENVIRONMENT,
      tokenCallback: fetchToken,
      externalUserId,
    }),
    logger
  ) : null

  return (
    <FrontendClientProvider client={client}>
      {client ? (
        <AppStateProvider>
          <DemoWithLoading isLoading={false} />
        </AppStateProvider>
      ) : (
        <DemoWithLoading isLoading={true} />
      )}
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
