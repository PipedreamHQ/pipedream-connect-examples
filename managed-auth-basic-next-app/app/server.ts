"use server";

import {
  createBackendClient,
  type ConnectTokenCreateOpts,
  type ConnectTokenResponse,
  type GetAppResponse
} from "@pipedream/sdk/server";

const {
  PIPEDREAM_PROJECT_ID,
  PIPEDREAM_CLIENT_ID,
  PIPEDREAM_CLIENT_SECRET,
  PIPEDREAM_PROJECT_ENVIRONMENT,
  PIPEDREAM_ALLOWED_ORIGINS
} = process.env;

if (!PIPEDREAM_CLIENT_ID)
  throw new Error("PIPEDREAM_CLIENT_ID not set in environment");
if (!PIPEDREAM_CLIENT_SECRET)
  throw new Error("PIPEDREAM_CLIENT_SECRET not set in environment");
if (!PIPEDREAM_PROJECT_ID)
  throw new Error("PIPEDREAM_PROJECT_ID not set in environment");
if (!PIPEDREAM_PROJECT_ENVIRONMENT || !["development", "production"].includes(PIPEDREAM_PROJECT_ENVIRONMENT))
  throw new Error("PIPEDREAM_PROJECT_ENVIRONMENT not set in environment");

const pd = createBackendClient({
  projectId: PIPEDREAM_PROJECT_ID,
  environment: PIPEDREAM_PROJECT_ENVIRONMENT as "development" | "production",
  credentials: {
    clientId: PIPEDREAM_CLIENT_ID,
    clientSecret: PIPEDREAM_CLIENT_SECRET,
  },
});

export async function serverConnectTokenCreate(opts: ConnectTokenCreateOpts): Promise<ConnectTokenResponse> {
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
  
  const createOpts = {
    // Keep snake_case - API expects snake_case parameters
    external_user_id: opts.external_user_id,
    ...(allowedOrigins && { allowed_origins: allowedOrigins }),
    // Include any other parameters from opts
    ...(opts.success_redirect_uri && { success_redirect_uri: opts.success_redirect_uri }),
    ...(opts.error_redirect_uri && { error_redirect_uri: opts.error_redirect_uri }),
    ...(opts.webhook_uri && { webhook_uri: opts.webhook_uri })
  };
  
  console.log('Creating connect token with options:', createOpts);
  
  return pd.createConnectToken(createOpts);
}

export async function getAppInfo(nameSlug: string): Promise<GetAppResponse> {
  if (!nameSlug) {
    throw new Error("Name slug is required");
  }

  try {
    // Use the SDK's getApp() method which handles auth and path construction
    const response = await pd.getApp(nameSlug);
    return response;
  } catch (err) {
    console.error("Error fetching app info:", err);
    throw err;
  }
}

export async function getUserAccounts(
  externalId: string,
  includeCredentials: boolean = false,
) {
  return pd.getAccounts({
    external_user_id: externalId,
    include_credentials: !!includeCredentials,
  });

  // Parse and return the data you need. These may contain credentials,
  // which you should never return to the client
}

export async function getAccountById(accountId: string) {
  try {
    const account = await pd.getAccountById(accountId);
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

// Removed searchApps - now handled client-side using connect token

export async function makeAppRequest<T>(
  accountId: string,
  endpoint: string,
  nameSlug: string,
  opts: RequestInit,
): Promise<T> {
  const account = await pd.getAccountById(accountId, { include_credentials: true })
  const appData = await pd.getApp(nameSlug)
  
  const headers = {
    authorization: `Bearer ${account.credentials?.oauth_access_token}`,
    "content-type": "application/json",
  }
  
  if (appData && appData.data.auth_type === "keys") {
    // For basic auth, you would need to implement the logic based on your app's configuration
    // This is a simplified version that assumes basic auth credentials are stored properly
    const username = account.credentials?.username || ""
    const password = account.credentials?.password || ""
    const buffer = `${username}:${password}`
    headers.authorization = `Basic ${Buffer.from(buffer).toString("base64")}`
  }
  
  const config: RequestInit = {
    method: opts.method || "GET",
    headers: {
      ...headers,
      ...opts.headers,
    },
  }

  if(opts.method != "GET") {
    config.body = opts.body
  }
  const resp: Response = await fetch(endpoint.toString(), config)

  const result = await resp.json()

  return result
}

