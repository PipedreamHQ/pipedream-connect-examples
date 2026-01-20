
import { PipedreamClient } from "@pipedream/sdk"
import { env } from "@/lib/env";

// Debug logging on module load
console.log("[backend-client] Pipedream config:", {
  clientId: env.PIPEDREAM_CLIENT_ID,
  projectId: env.PIPEDREAM_PROJECT_ID,
  projectEnvironment: env.PIPEDREAM_PROJECT_ENVIRONMENT,
  apiHost: env.PIPEDREAM_API_HOST,
});

export const backendClient = () => {
  return new PipedreamClient({
    clientId: env.PIPEDREAM_CLIENT_ID,
    clientSecret: env.PIPEDREAM_CLIENT_SECRET,
    projectEnvironment: env.PIPEDREAM_PROJECT_ENVIRONMENT,
    projectId: env.PIPEDREAM_PROJECT_ID,
    ...(env.PIPEDREAM_API_HOST && { apiHost: env.PIPEDREAM_API_HOST }),
  })
}
