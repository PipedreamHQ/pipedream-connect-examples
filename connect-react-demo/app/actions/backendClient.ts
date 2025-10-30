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
    const proxyOptions = {
      searchParams: {
        external_user_id: opts.externalUserId,
        account_id: opts.accountId
      }
    }

    const targetRequest = {
      url: opts.url,
      options: {
        method: opts.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
        ...(opts.data && { body: JSON.stringify(opts.data) }),
        ...(opts.data && { headers: { "Content-Type": "application/json" } })
      }
    }

    const resp = await serverClient.makeProxyRequest(proxyOptions, targetRequest);
    
    // Log the response structure for debugging
    console.log('Proxy response structure:', {
      resp,
      type: typeof resp,
      keys: Object.keys(resp || {}),
      hasHeaders: !!(resp as any)?.headers,
      hasStatus: !!(resp as any)?.status
    });
    
    // Return both the response data and any available metadata (like headers)
    // Note: The Pipedream SDK might return headers differently
    return {
      data: resp,
      headers: (resp as any)?.headers || (resp as any)?.response?.headers || {},
      status: (resp as any)?.status || (resp as any)?.response?.status || 200,
      rawResponse: resp // Include raw response for debugging
    }
  } catch (error: any) {
    // Re-throw with structured error info
    throw {
      message: error.message || 'Proxy request failed',
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    }
  }
}

export const proxyRequest = _proxyRequest
