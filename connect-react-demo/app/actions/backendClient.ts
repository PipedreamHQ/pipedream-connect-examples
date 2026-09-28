"use server"

import { env } from "@/lib/env";
import { backendClient } from "@/lib/backend-client";
import { headers } from "next/headers";
import type {
  RunActionOpts,
  DeployTriggerOpts,
  AppOverride,
  CreateAppOverrideOpts,
  UpdateAppOverrideOpts,
  OauthApp,
  CreateOauthAppOpts,
  UpdateOauthAppOpts,
} from "@pipedream/sdk";

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
}

export const getAccountCredentials = async (opts: GetAccountCredentialsOpts) => {
  const serverClient = backendClient()

  try {
    // Use list with filters to get the account with credentials
    // This ensures we're scoped to the correct external user
    const accountsPage = await serverClient.accounts.list({
      externalUserId: opts.externalUserId,
      includeCredentials: true,
    })

    // Find the specific account by ID
    const account = accountsPage.data.find(a => a.id === opts.accountId)
    if (!account) {
      throw new Error(`Account ${opts.accountId} not found for user ${opts.externalUserId}`)
    }

    return account.credentials
  } catch (error: any) {
    console.error("Failed to get account credentials:", error)
    throw new Error(error.message || "Failed to get account credentials")
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

export const listAccounts = async (opts: { externalUserId: string; app?: string; oauthAppId?: string }): Promise<ActionResult<any>> => {
  const serverClient = backendClient()
  console.log("[accounts.list] called", { externalUserId: opts.externalUserId, app: opts.app, oauthAppId: opts.oauthAppId })
  try {
    const page = await serverClient.accounts.list({
      externalUserId: opts.externalUserId,
      ...(opts.app && { app: opts.app }),
      ...(opts.oauthAppId && { oauthAppId: opts.oauthAppId }),
    })
    return { data: toSerializableResult("accounts.list", page.data) }
  } catch (error: any) {
    return { error: toActionError("accounts.list", error) }
  }
}

export const getProjectId = async () => env.PIPEDREAM_PROJECT_ID

// App overrides — local dev only. These mutate project config (overrides, OAuth
// clients), so refuse unless the request itself came to localhost. The client-side
// hostname check only hides the UI; this is what actually blocks a deployed build.
async function assertLocalhost(prefix: string): Promise<ActionError | undefined> {
  const host = ((await headers()).get("host") ?? "").split(":")[0]
  if (!["localhost", "127.0.0.1"].includes(host)) {
    return { message: `${prefix} is only available on localhost`, status: 403 }
  }
}

export type AppCustomField = {
  name: string
  label?: string
  description?: string
  type?: string
  optional?: boolean | null
  default?: unknown
}

export const getAppOverridesContext = async (app: string): Promise<ActionResult<{
  app: { nameSlug: string; name: string; authType?: string; customFields: AppCustomField[] }
  overrides: AppOverride[]
  oauthApps: OauthApp[]
}>> => {
  const denied = await assertLocalhost("appOverrides.context")
  if (denied) return { error: denied }
  const serverClient = backendClient()
  try {
    const [appResp, overrides, oauthApps] = await Promise.all([
      serverClient.apps.retrieve(app),
      serverClient.appOverrides.list({ app, limit: 100 }),
      serverClient.oauthApps.list({ app, limit: 100 }),
    ])
    let customFields: AppCustomField[] = []
    try {
      customFields = JSON.parse(appResp.data.customFieldsJson || "[]")
    } catch {
      // Malformed customFieldsJson — treat as no custom fields
    }
    return {
      data: toSerializableResult("appOverrides.context", {
        app: {
          nameSlug: appResp.data.nameSlug,
          name: appResp.data.name,
          authType: appResp.data.authType,
          customFields,
        },
        overrides: overrides.data,
        oauthApps: oauthApps.data,
      }),
    }
  } catch (error: any) {
    return { error: toActionError("appOverrides.context", error) }
  }
}

export const createAppOverride = async (opts: CreateAppOverrideOpts): Promise<ActionResult<AppOverride>> => {
  const denied = await assertLocalhost("appOverrides.create")
  if (denied) return { error: denied }
  try {
    return { data: toSerializableResult("appOverrides.create", await backendClient().appOverrides.create(opts)) }
  } catch (error: any) {
    return { error: toActionError("appOverrides.create", error) }
  }
}

export const updateAppOverride = async (id: string, opts: UpdateAppOverrideOpts): Promise<ActionResult<AppOverride>> => {
  const denied = await assertLocalhost("appOverrides.update")
  if (denied) return { error: denied }
  try {
    return { data: toSerializableResult("appOverrides.update", await backendClient().appOverrides.update(id, opts)) }
  } catch (error: any) {
    return { error: toActionError("appOverrides.update", error) }
  }
}

export const deleteAppOverride = async (id: string): Promise<ActionResult<true>> => {
  const denied = await assertLocalhost("appOverrides.delete")
  if (denied) return { error: denied }
  try {
    await backendClient().appOverrides.delete(id)
    return { data: true }
  } catch (error: any) {
    return { error: toActionError("appOverrides.delete", error) }
  }
}

// Creates the client with blank credentials so its redirect URI exists before the
// user registers it with the provider; credentials are set later via updateOauthApp.
export const createOauthApp = async (opts: Pick<CreateOauthAppOpts, "app" | "name">): Promise<ActionResult<OauthApp>> => {
  const denied = await assertLocalhost("oauthApps.create")
  if (denied) return { error: denied }
  try {
    const oauthApp = await backendClient().oauthApps.create({ ...opts, clientId: "", clientSecret: "" })
    return { data: toSerializableResult("oauthApps.create", oauthApp) }
  } catch (error: any) {
    return { error: toActionError("oauthApps.create", error) }
  }
}

export const updateOauthApp = async (id: string, opts: UpdateOauthAppOpts): Promise<ActionResult<OauthApp>> => {
  const denied = await assertLocalhost("oauthApps.update")
  if (denied) return { error: denied }
  try {
    return { data: toSerializableResult("oauthApps.update", await backendClient().oauthApps.update(id, opts)) }
  } catch (error: any) {
    return { error: toActionError("oauthApps.update", error) }
  }
}

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
