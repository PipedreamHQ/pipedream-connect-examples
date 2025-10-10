
import { PipedreamEnvironment, PipedreamClient } from "@pipedream/sdk"
import { env } from "@/lib/env";

const getEnvironment = (): PipedreamEnvironment => {
  if (env.PIPEDREAM_API_HOST) {
    return `https://${env.PIPEDREAM_API_HOST}` as PipedreamEnvironment;
  }

  // Default to Prod for local development (Dev environment requires DEV_NAMESPACE)
  return PipedreamEnvironment.Prod;
}

export const backendClient = () => {
  return new PipedreamClient({
    clientId: env.PIPEDREAM_CLIENT_ID,
    clientSecret: env.PIPEDREAM_CLIENT_SECRET,
    environment: getEnvironment(),
    projectEnvironment: env.PIPEDREAM_PROJECT_ENVIRONMENT,
    projectId: env.PIPEDREAM_PROJECT_ID,
  })
}
