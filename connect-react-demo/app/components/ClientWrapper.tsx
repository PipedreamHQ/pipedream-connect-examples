"use client"

import { useMemo } from "react"
import { AppStateProvider } from "@/lib/app-state"
import { useStableUuid } from "@/lib/stable-uuid"
import { FrontendClientProvider } from "@pipedream/connect-react"
import {
  createFrontendClient,
  type PipedreamEnvironment,
  type ProjectEnvironment
} from "@pipedream/sdk/browser"
import { fetchToken, type FetchTokenOpts } from "../actions/backendClient"
import { SDKLoggerProvider, useSDKLogger, createLoggedFrontendClient } from "@/lib/sdk-logger"
import Demo from "./Demo"
function DemoWithLoading({ isLoading }: { isLoading: boolean }) {
  return <Demo isLoading={isLoading} />
}

// Wrap the server action to defer it from React's render phase.
// Next.js server actions use startTransition internally which updates router state.
// This can cause "Cannot update a component while rendering" errors if called during render.
const deferredTokenCallback = (opts: FetchTokenOpts) => {
  return new Promise<Awaited<ReturnType<typeof fetchToken>>>((resolve, reject) => {
    // Use setTimeout(0) to defer the server action call to the next event loop tick,
    // ensuring it happens outside of React's render phase
    setTimeout(() => {
      fetchToken(opts).then(resolve, reject)
    }, 0)
  })
}

const ClientProviderWithLogger = () => {
  const [externalUserId] = useStableUuid()
  const logger = useSDKLogger()

  const frontendHost = process.env.NEXT_PUBLIC_PIPEDREAM_FRONTEND_HOST
  const environment = process.env.NEXT_PUBLIC_PIPEDREAM_ENVIRONMENT as PipedreamEnvironment || undefined
  const projectEnvironment = process.env.NEXT_PUBLIC_PIPEDREAM_PROJECT_ENVIRONMENT as ProjectEnvironment

  const client = useMemo(() => {
    if (!externalUserId) return null
    return createLoggedFrontendClient(
      createFrontendClient({
        ...(frontendHost && { frontendHost }),
        ...(environment && { environment }),
        ...(projectEnvironment && { projectEnvironment }),
        tokenCallback: deferredTokenCallback,
        externalUserId,
      }),
      logger
    )
  }, [externalUserId, frontendHost, environment, projectEnvironment, logger])

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
