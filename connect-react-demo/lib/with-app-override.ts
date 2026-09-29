import { isLocalHostname } from "./utils"

// Local-dev-only: inject the app override selected in the config panel into
// connectAccount calls. Stopgap until connect-react supports appOverrideId
// (it only takes oauthAppConfig) — then pass it through as a prop instead.
// The URL query params are the source of truth for the selection.
// See https://pipedream.com/docs/connect/managed-auth/app-overrides
export function withAppOverride<T extends { connectAccount: (opts: any) => any }>(client: T): T {
  const connectAccount = client.connectAccount.bind(client)
  client.connectAccount = (opts: any) => {
    const params = new URLSearchParams(window.location.search)
    const appOverrideId = params.get("appOverrideId")
    // appOverrideId is cleared whenever the app changes; the app param is absent
    // only when the demo is on its default app
    const app = params.get("app")
    if (isLocalHostname(window.location.hostname) && appOverrideId && (!app || app === opts.app)) {
      return connectAccount({ ...opts, appOverrideId })
    }
    return connectAccount(opts)
  }
  return client
}
