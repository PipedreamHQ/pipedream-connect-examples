"use server"

import { env } from "@/lib/env";
import { backendClient } from "@/lib/backend-client";

export type FetchTokenOpts = {
  externalUserId: string
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
