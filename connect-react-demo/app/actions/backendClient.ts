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

export const fetchToken = async (opts: FetchTokenOpts) => {
  const serverClient = backendClient()

  const resp = await serverClient.tokens.create({
    externalUserId: opts.externalUserId,
    allowedOrigins: allowedOrigins, // TODO set this to the correct origin
    webhookUri: process.env.PIPEDREAM_CONNECT_WEBHOOK_URI,
  });
  return resp
}
