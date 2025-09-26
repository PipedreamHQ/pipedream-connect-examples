"use server";

import {
  PipedreamClient,
  type CreateTokenOpts,
  type CreateTokenResponse,
  type GetAppResponse,
  type AccountsListRequest,
  type AccountsRetrieveRequest
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

const pd = new PipedreamClient({
  projectId: PIPEDREAM_PROJECT_ID,
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

export async function getAppInfo(nameSlug: string): Promise<GetAppResponse> {
  if (!nameSlug) {
    throw new Error("Name slug is required");
  }

  try {
    // Use the SDK's getApp() method which handles auth and path construction
    const response = await pd.apps.retrieve(nameSlug);
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
  const params: AccountsListRequest = {
    externalUserId: externalId,
    includeCredentials: !!includeCredentials,
  };

  const page = await pd.accounts.list(params);
  return page.data;

  // Parse and return the data you need. These may contain credentials,
  // which you should never return to the client
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

// Removed searchApps - now handled client-side using connect token

export async function makeAppRequest<T>(
  accountId: string,
  endpoint: string,
  nameSlug: string,
  opts: RequestInit,
): Promise<T> {
  if (!accountId) {
    throw new Error("Account ID is required");
  }
  if (!endpoint) {
    throw new Error("Endpoint is required");
  }
  if (!nameSlug) {
    throw new Error("Name slug is required");
  }

  try {
    const retrieveOpts: AccountsRetrieveRequest = { includeCredentials: true };
    const account = await pd.accounts.retrieve(accountId, retrieveOpts);
    
    if (!account.credentials) {
      throw new Error("No credentials found for account");
    }

    const appData = await pd.apps.retrieve(nameSlug);
    
    const headers = {
      authorization: `Bearer ${account.credentials?.oauth_access_token}`,
      "content-type": "application/json",
    }
    
    if (appData && appData.data.authType === "keys") {
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
    
    const resp: Response = await fetch(endpoint.toString(), config);
    
    if (!resp.ok) {
      throw new Error(`API request failed: ${resp.status} ${resp.statusText}`);
    }

    const result = await resp.json();
    return result;
  } catch (error) {
    console.error("Error making app request:", error);
    throw error;
  }
}
