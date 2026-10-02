import {
  createFrontendClient,
  type PipedreamClient,
  type PipedreamClientOpts,
  type StartConnectOpts,
} from "@pipedream/sdk/browser"
import { validateConnectToken } from "@/app/actions/backendClient"

const WORKDAY_FRONTEND_HOST =
  process.env.NEXT_PUBLIC_PIPEDREAM_WORKDAY_FRONTEND_HOST || "cdn.api.myworkday.com"

// Workday-official OAuth clients only connect from Connect pages served on the
// Workday domain, so their connectAccount iframe opens on WORKDAY_FRONTEND_HOST;
// every other client keeps opts.frontendHost.
export function createConnectClient(opts: PipedreamClientOpts): PipedreamClient {
  const client = createFrontendClient(opts)
  const workdayClient = createFrontendClient({
    ...opts,
    frontendHost: WORKDAY_FRONTEND_HOST,
  })

  const connectAccount = client.connectAccount.bind(client)
  client.connectAccount = async (connectOpts: StartConnectOpts) => {
    const token =
      connectOpts.token ||
      (await opts.tokenCallback({ externalUserId: opts.externalUserId })).token
    const validation = await validateConnectToken({
      token,
      appId: connectOpts.app,
      oauthAppId: connectOpts.oauthAppId,
      appOverrideId: connectOpts.appOverrideId,
    })

    return validation.oauthAppWorkdayOfficial
      ? workdayClient.connectAccount({ ...connectOpts, token })
      : connectAccount({ ...connectOpts, token })
  }

  return client
}
