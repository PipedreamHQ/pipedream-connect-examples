
import { PipedreamClient } from "@pipedream/sdk"
import { env } from "@/lib/env";

export const backendClient = () => {
  return new PipedreamClient({
    clientId: env.PIPEDREAM_CLIENT_ID,
    clientSecret: env.PIPEDREAM_CLIENT_SECRET,
    projectEnvironment: env.PIPEDREAM_PROJECT_ENVIRONMENT,
    projectId: env.PIPEDREAM_PROJECT_ID,
    ...(env.PIPEDREAM_API_HOST && { apiHost: env.PIPEDREAM_API_HOST }),
  })
}
