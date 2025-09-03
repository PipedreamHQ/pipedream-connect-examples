
import { PipedreamEnvironment, PipedreamClient } from "@pipedream/sdk"
import { env } from "@/lib/env";

const getEnvironment = (): PipedreamEnvironment => {
  if (env.PIPEDREAM_API_HOST) {
    return `https://${env.PIPEDREAM_API_HOST}` as PipedreamEnvironment;
  }

  if (env.NODE_ENV === "development") {
    return PipedreamEnvironment.Dev;
  }

  return PipedreamEnvironment.Prod;
}

export const backendClient = () => {
  return new PipedreamClient({
    clientId: env.PIPEDREAM_CLIENT_ID,
    clientSecret: env.PIPEDREAM_CLIENT_SECRET,
    environment: getEnvironment(),
    projectEnvironment: env.PIPEDREAM_PROJECT_ENVIRONMENT,
    projectId: env.PIPEDREAM_PROJECT_ID,
    workflowDomain: env.PIPEDREAM_WORKFLOW_DOMAIN,
  })
}
