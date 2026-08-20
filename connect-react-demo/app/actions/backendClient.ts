"use server"

import { env } from "@/lib/env";
import { backendClient } from "@/lib/backend-client";
import type { RunActionOpts, DeployTriggerOpts, AccountCredentials } from "@pipedream/sdk";

export type FetchTokenOpts = {
  externalUserId: string
  successRedirectUri?: string
}

export type ProxyRequestOpts = {
  externalUserId: string
  accountId: string
  url: string
  method: string
  data?: any
  headers?: Record<string, string>
}

export type ActionError = {
  message: string
  status?: number
  data?: any
}

export type ActionResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: ActionError }

const allowedOrigins = ([
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ...env.PIPEDREAM_ALLOWED_ORIGINS,
].filter(Boolean) as string[]).map((origin) => {
  if (origin.startsWith("http")) {
    return origin
  }
  return `https://${origin}`
});

export const fetchToken = async (opts: FetchTokenOpts) => {
  const serverClient = backendClient()

  const resp = await serverClient.tokens.create({
    externalUserId: opts.externalUserId,
    allowedOrigins: allowedOrigins, // TODO set this to the correct origin
    webhookUri: process.env.PIPEDREAM_CONNECT_WEBHOOK_URI,
    ...(opts.successRedirectUri && { successRedirectUri: opts.successRedirectUri }),
    scope: "connect:accounts:write connect:actions:* connect:*",
    expiresIn: 60 * 60 // 1 hour
  });
  return resp
}

const _proxyRequest = async (opts: ProxyRequestOpts): Promise<ActionResult<any>> => {
  const serverClient = backendClient()

  const baseRequest = {
    url: opts.url,
    externalUserId: opts.externalUserId,
    accountId: opts.accountId,
    ...(opts.headers && { headers: opts.headers }),
  }

  const method = opts.method.toUpperCase()

  try {
    let resp
    switch (method) {
      case "GET":
        resp = await serverClient.proxy.get(baseRequest)
        break
      case "POST":
        resp = await serverClient.proxy.post({
          ...baseRequest,
          body: opts.data,
        })
        break
      case "PUT":
        resp = await serverClient.proxy.put({
          ...baseRequest,
          body: opts.data,
        })
        break
      case "DELETE":
        resp = await serverClient.proxy.delete(baseRequest)
        break
      case "PATCH":
        resp = await serverClient.proxy.patch({
          ...baseRequest,
          body: opts.data,
        })
        break
      default:
        return { error: { message: `Unsupported HTTP method: ${method}` } }
    }

    return { data: resp }
  } catch (error: any) {
    console.error("[proxy] failed", { message: error.message, status: error.statusCode, body: error.body })
    return {
      error: {
        message: error.message || "Proxy request failed",
        status: error.statusCode,
        data: error.body,
      },
    }
  }
}

export const proxyRequest = _proxyRequest

export const validateConnectToken = async (opts: { token: string; appId: string }) => {
  const serverClient = backendClient()
  return serverClient.tokens.validate(opts.token, {
    appId: opts.appId,
  })
}

export type GetAccountCredentialsOpts = {
  externalUserId: string
  accountId: string
  /** Optional app name slug. Narrows the search so fewer pages are walked. */
  app?: string
}

const _lookupAccountCredentials = async (opts: GetAccountCredentialsOpts) => {
  const serverClient = backendClient()

  // Use list with filters to get the account with credentials
  // This ensures we're scoped to the correct external user
  const accountsPage = await serverClient.accounts.list({
    externalUserId: opts.externalUserId,
    includeCredentials: true,
    ...(opts.app && { app: opts.app }),
  })

  // Page is async-iterable, so this walks every page rather than just the first
  for await (const account of accountsPage) {
    if (account.id === opts.accountId) {
      return account.credentials
    }
  }

  throw new Error(`Account ${opts.accountId} not found for user ${opts.externalUserId}`)
}

export const getAccountCredentials = async (opts: GetAccountCredentialsOpts) => {
  try {
    return await _lookupAccountCredentials(opts)
  } catch (error: any) {
    console.error("Failed to get account credentials:", error)
    throw new Error(error.message || "Failed to get account credentials")
  }
}

// Same lookup, but reports failures as data so client components can render them
// instead of hitting an unhandled server action rejection.
//
// SECURITY: this returns plaintext credentials for whatever externalUserId the
// caller passes, and there is no session to authorize that against. Server
// actions are public POST endpoints, so the production guard below is the only
// thing standing between this and a credential dump on the deployed demo. It is
// checked server-side on purpose — gating the UI alone would not stop a
// hand-crafted request.
export const fetchAccountCredentials = async (
  opts: GetAccountCredentialsOpts
): Promise<ActionResult<AccountCredentials>> => {
  if (env.PIPEDREAM_PROJECT_ENVIRONMENT === "production") {
    console.warn("[accounts.list] credentials request refused in production", { accountId: opts.accountId })
    return {
      error: { message: "Viewing account credentials is disabled in the production environment." },
    }
  }

  console.log("[accounts.list] credentials requested", { externalUserId: opts.externalUserId, accountId: opts.accountId })
  try {
    const credentials = await _lookupAccountCredentials(opts)
    // Deliberately NOT toSerializableResult: that logs the payload, which would
    // write plaintext secrets to the server log. Same JSON round-trip (to strip
    // undefined and class instances for the server action boundary), but only
    // the field names are logged.
    const serialized: AccountCredentials = JSON.parse(JSON.stringify(credentials ?? {}))
    console.log("[accounts.list] credentials returned", { fields: Object.keys(serialized) })
    return { data: serialized }
  } catch (error: any) {
    return { error: toActionError("accounts.list", error) }
  }
}

// Strip undefined values and class instances so Next.js can serialize the
// server action response. JSON round-trip is the simplest safe way to do this.
function toSerializableResult<T>(prefix: string, value: T): T {
  try {
    const serialized = JSON.parse(JSON.stringify(value))
    console.log(`[${prefix}] success`, JSON.stringify(serialized).slice(0, 500))
    return serialized
  } catch (err: any) {
    console.error(`[${prefix}] serialization failed`, err.message, typeof value, JSON.stringify(Object.keys(value as any ?? {})))
    throw new Error(`${prefix} response could not be serialized: ${err.message}`)
  }
}

function toActionError(prefix: string, error: any): ActionError {
  const status = error.statusCode ?? error.status
  const body = error.body ?? error.data
  console.error(`[${prefix}] failed`, { status, body, message: error.message })
  // Summarize body: if it's a string (e.g. HTML from a gateway 502) just take the
  // first 200 chars; if it's an object, stringify it.
  let detail: string
  if (body == null) {
    detail = error.message ?? "unknown error"
  } else if (typeof body === "string") {
    detail = body.slice(0, 200)
  } else {
    detail = JSON.stringify(body)
  }
  return {
    message: `${prefix} failed (HTTP ${status ?? "unknown"}): ${detail}`,
    status,
    data: body,
  }
}

export const runAction = async (opts: RunActionOpts): Promise<ActionResult<any>> => {
  const serverClient = backendClient()
  console.log("[actions.run] called", { id: opts.id, externalUserId: opts.externalUserId })
  try {
    return { data: toSerializableResult("actions.run", await serverClient.actions.run(opts)) }
  } catch (error: any) {
    return { error: toActionError("actions.run", error) }
  }
}

export const deployTrigger = async (opts: DeployTriggerOpts): Promise<ActionResult<any>> => {
  const serverClient = backendClient()
  console.log("[triggers.deploy] called", { externalUserId: opts.externalUserId })
  try {
    return { data: toSerializableResult("triggers.deploy", await serverClient.triggers.deploy(opts)) }
  } catch (error: any) {
    return { error: toActionError("triggers.deploy", error) }
  }
}

export const listAccounts = async (opts: { externalUserId: string; app?: string }): Promise<ActionResult<any>> => {
  const serverClient = backendClient()
  console.log("[accounts.list] called", { externalUserId: opts.externalUserId, app: opts.app })
  try {
    const page = await serverClient.accounts.list({
      externalUserId: opts.externalUserId,
      ...(opts.app && { app: opts.app }),
    })
    return { data: toSerializableResult("accounts.list", page.data) }
  } catch (error: any) {
    return { error: toActionError("accounts.list", error) }
  }
}

export const getProjectId = async () => env.PIPEDREAM_PROJECT_ID

export type PostCallbackOpts = {
  callbackUri: string
  resourceProvider: string
  selectedFiles: Array<{
    name: string
    description?: string
    file_id: string
    web_url?: string
  }>
  metadata: {
    skill_id: string
    agent_id: string
    external_user_id: string
    auth_provision_id: string
  }
  configuredProps: Record<string, unknown>
}

export const postToCallback = async (opts: PostCallbackOpts) => {
  try {
    const resp = await fetch(opts.callbackUri, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource_provider: opts.resourceProvider,
        selected_files: opts.selectedFiles,
        metadata: {
          ...opts.metadata,
          pipedream_project_id: env.PIPEDREAM_PROJECT_ID,
        },
        configured_props: opts.configuredProps,
      }),
    })

    if (!resp.ok) {
      console.warn(`Callback POST failed with status ${resp.status}`)
    }
  } catch (error: any) {
    console.error("Failed to post to callback:", error)
    // Don't throw - this is fire-and-forget
  }
}
