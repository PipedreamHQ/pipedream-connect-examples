"use server";

import {
  PipedreamClient,
  type CreateTokenOpts,
  type CreateTokenResponse,
} from "@pipedream/sdk/server";

const {
  NEXT_PUBLIC_PIPEDREAM_PROJECT_ID,
  PIPEDREAM_CLIENT_ID,
  PIPEDREAM_CLIENT_SECRET,
  PIPEDREAM_PROJECT_ENVIRONMENT,
  PIPEDREAM_ALLOWED_ORIGINS
} = process.env;

if (!PIPEDREAM_CLIENT_ID)
  throw new Error("PIPEDREAM_CLIENT_ID not set in environment");
if (!PIPEDREAM_CLIENT_SECRET)
  throw new Error("PIPEDREAM_CLIENT_SECRET not set in environment");
if (!NEXT_PUBLIC_PIPEDREAM_PROJECT_ID)
  throw new Error("PIPEDREAM_PROJECT_ID not set in environment");
if (!PIPEDREAM_PROJECT_ENVIRONMENT || !["development", "production"].includes(PIPEDREAM_PROJECT_ENVIRONMENT))
  throw new Error("PIPEDREAM_PROJECT_ENVIRONMENT not set in environment");

const pd = new PipedreamClient({
  projectId: NEXT_PUBLIC_PIPEDREAM_PROJECT_ID,
  projectEnvironment: PIPEDREAM_PROJECT_ENVIRONMENT as "development" | "production",
  clientId: PIPEDREAM_CLIENT_ID,
  clientSecret: PIPEDREAM_CLIENT_SECRET,
});

export async function serverConnectTokenCreate(opts: CreateTokenOpts): Promise<CreateTokenResponse> {
  if (!opts.externalUserId) {
    throw new Error("externalUserId is required");
  }

  // Add allowed_origins from environment if provided
  let allowedOrigins: string[] | undefined;
  
  if (PIPEDREAM_ALLOWED_ORIGINS) {
    try {
      // Try to parse as JSON array first
      allowedOrigins = JSON.parse(PIPEDREAM_ALLOWED_ORIGINS);
    } catch {
      // Fall back to comma-separated string
      allowedOrigins = PIPEDREAM_ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    }
  }
  
  const createOpts: CreateTokenOpts = {
    ...opts,
    externalUserId: opts.externalUserId,
  };

  if (allowedOrigins) {
    const existingOrigins = createOpts.allowedOrigins ?? [];
    createOpts.allowedOrigins = Array.from(new Set([...existingOrigins, ...allowedOrigins]));
  }
  
  try {
    console.log('Creating connect token with options:', createOpts);
    return await pd.tokens.create(createOpts);
  } catch (error) {
    console.error('Error creating connect token:', error);
    throw new Error('Failed to create connect token');
  }
}

export async function getAccountById(accountId: string) {
  try {
    const account = await pd.accounts.retrieve(accountId);
    // Return only safe fields, no credentials
    return {
      id: account.id,
      name: account.name,
      app: account.app
    };
  } catch (err) {
    console.error("Error fetching account by ID:", err);
    throw err;
  }
}
