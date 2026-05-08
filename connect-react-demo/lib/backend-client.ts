
import { PipedreamClient } from "@pipedream/sdk"
import { env } from "@/lib/env";

// Module-level singleton so the OAuthTokenProvider's cached token is reused
// across warm function invocations instead of making a new /oauth/token request
// on every server action call.
let _client: PipedreamClient | undefined

export const backendClient = () => {
  if (!_client) {
    _client = new PipedreamClient({
      clientId: env.PIPEDREAM_CLIENT_ID,
      clientSecret: env.PIPEDREAM_CLIENT_SECRET,
      projectEnvironment: env.PIPEDREAM_PROJECT_ENVIRONMENT,
      projectId: env.PIPEDREAM_PROJECT_ID,
      ...(env.PIPEDREAM_API_HOST && { baseUrl: env.PIPEDREAM_API_HOST }),
    })
  }
  return _client
}
