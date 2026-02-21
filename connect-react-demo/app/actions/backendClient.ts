"use server"

import { env } from "@/lib/env";
import { backendClient } from "@/lib/backend-client";

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

const _proxyRequest = async (opts: ProxyRequestOpts) => {
  const serverClient = backendClient()

  try {
    const baseRequest = {
      url: opts.url,
      externalUserId: opts.externalUserId,
      accountId: opts.accountId,
      ...(opts.headers && { headers: opts.headers }),
    }

    let resp
    const method = opts.method.toUpperCase()

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
        throw new Error(`Unsupported HTTP method: ${method}`)
    }

    return {
      data: resp,
    }
  } catch (error: any) {
    // Create a proper Error object to preserve stack trace
    const proxyError = new Error(error.message || 'Proxy request failed') as Error & {
      status?: number
      data?: any
    }
    proxyError.status = error.statusCode
    proxyError.data = error.body
    throw proxyError
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
