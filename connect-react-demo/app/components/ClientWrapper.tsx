"use client"

import { AppStateProvider } from "@/lib/app-state"
import { useStableUuid } from "@/lib/stable-uuid"
import { FrontendClientProvider } from "@pipedream/connect-react"
import { createFrontendClient } from "@pipedream/sdk/browser"
import { fetchToken } from "../actions/backendClient"
import { SDKLoggerProvider, useSDKLogger, createLoggedFrontendClient } from "@/lib/sdk-logger"
import Demo from "./Demo"

const ClientProviderWithLogger = () => {
  const [externalUserId] = useStableUuid()
  const logger = useSDKLogger()

  const baseClient = createFrontendClient({
    environment: process.env.PIPEDREAM_PROJECT_ENVIRONMENT,
    tokenCallback: fetchToken,
    externalUserId,
  });

  const client = createLoggedFrontendClient(baseClient, logger)

  return (
    <FrontendClientProvider client={client}>
      <AppStateProvider>
        <Demo />
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
