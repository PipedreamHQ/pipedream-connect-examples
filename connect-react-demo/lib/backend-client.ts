
import { createBackendClient } from "@pipedream/sdk/server"
import { env } from "@/lib/env";


export const backendClient = () => {
    return createBackendClient({
        apiHost: env.PIPEDREAM_API_HOST,
        environment: env.PIPEDREAM_PROJECT_ENVIRONMENT,
        projectId: env.PIPEDREAM_PROJECT_ID,
        credentials: {
          clientId: env.PIPEDREAM_CLIENT_ID,
          clientSecret: env.PIPEDREAM_CLIENT_SECRET,
        },
        workflowDomain: env.PIPEDREAM_WORKFLOW_DOMAIN,
      })
}
