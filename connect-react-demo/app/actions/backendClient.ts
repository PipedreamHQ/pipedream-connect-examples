"use server"

import { env } from "@/lib/env";
import { backendClient } from "@/lib/backend-client";

export type FetchTokenOpts = {
  externalUserId: string
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

const _fetchToken = async (opts: FetchTokenOpts) => {
  const serverClient = backendClient()

  const resp = await serverClient.createConnectToken({
    external_user_id: opts.externalUserId,
    allowed_origins: allowedOrigins, // TODO set this to the correct origin
    webhook_uri: process.env.PIPEDREAM_CONNECT_WEBHOOK_URI,
  });
  return resp
}

// export const fetchToken = unstable_cache(_fetchToken, [], { revalidate: 3600 })
export const fetchToken = _fetchToken
