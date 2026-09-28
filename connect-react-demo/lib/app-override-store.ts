// Local-dev-only: the app override selected in the config panel.
//
// connect-react doesn't support app overrides, so instead of threading the ID
// through its components we wrap the frontend client and inject appOverrideId
// into connectAccount calls for the matching app.
// See https://pipedream.com/docs/connect/managed-auth/app-overrides

type ActiveAppOverride = { app: string; appOverrideId: string }

let active: ActiveAppOverride | undefined

export function setActiveAppOverride(value: ActiveAppOverride | undefined) {
  active = value
}

export function withAppOverride<T extends { connectAccount: (opts: any) => any }>(client: T): T {
  const connectAccount = client.connectAccount.bind(client)
  client.connectAccount = (opts: any) => {
    const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    if (isLocalhost && active && opts?.app === active.app && !opts.appOverrideId) {
      return connectAccount({ ...opts, appOverrideId: active.appOverrideId })
    }
    return connectAccount(opts)
  }
  return client
}
