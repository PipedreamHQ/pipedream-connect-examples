"use server";

import {
  createBackendClient,
  type ConnectTokenCreateOpts,
  type ConnectTokenResponse,
  type ProjectEnvironment,
  type AccountsRequestResponse,
  type AppResponse
} from "@pipedream/sdk/server";

const {
  PIPEDREAM_API_HOST,
  PIPEDREAM_PROJECT_ID,
  PIPEDREAM_CLIENT_ID,
  PIPEDREAM_CLIENT_SECRET,
  PIPEDREAM_PROJECT_ENVIRONMENT
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
  environment: PIPEDREAM_PROJECT_ENVIRONMENT as ProjectEnvironment,
  credentials: {
    clientId: PIPEDREAM_CLIENT_ID,
    clientSecret: PIPEDREAM_CLIENT_SECRET,
  },
  apiHost: PIPEDREAM_API_HOST,
});

export async function serverConnectTokenCreate(opts: ConnectTokenCreateOpts): Promise<ConnectTokenResponse> {
  return pd.createConnectToken(opts);
}

export async function getAppInfo(nameSlug: string, token: string): Promise<AppResponse> {
  if (!nameSlug) {
    throw new Error("Name slug is required");
  }
  if (!token) {
    throw new Error("Token is required");
  }

  try {
    return await pd.makeRequest(`/apps/${nameSlug}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (err) {
    console.error("Error fetching app info:", err);
    throw err;
  }
}

export async function getUserAccounts(
  externalId: string,
  includeCredentials: boolean = false,
): Promise<AccountsRequestResponse> {
  return pd.getAccounts({
    external_user_id: externalId,
    include_credentials: !!includeCredentials,
  })

  // Parse and return the data you need. These may contain credentials,
  // which you should never return to the client
}

export async function getTestRequest(nameSlug: string) {
  const appData = apps[nameSlug]
  if (appData) {
    const headers = appData.header_params.reduce((acc, header) => {
      acc[header.key] = header.value
      return acc
    }, {})

    if (appData.auth?.type === "bearer") {
      headers.authorization = "Bearer ${oauth_access_token}"
    } else if (appData.auth?.type === "basic") {
      // get username and password
      const regex = /{{custom_fields\.(\w+)}}/
      const userMatch = appData.auth.basic_username.match(regex)
      const passMatch = appData.auth.basic_password.match(regex)

      const user = userMatch ? userMatch[1] : ""
      const pass = passMatch ? passMatch[1] : ""

      const value = `Basic Base64(${user}:${pass}) // use the given values for basic auth`

      headers.authorization = value
    } else {
      // null, do nothing?
    }
    return {
      config: {
        method: appData.method,
        headers,
      },
      url: appData.url,
      authType: appData.auth?.type,
    }
  } else {
    return {}
  }
}

export async function makeAppRequest<T>(
  accountId: string,
  endpoint: string,
  nameSlug: string,
  opts: RequestInit,
): Promise<T> {
  const oauthToken = await pd.getAccountById(accountId, {include_credentials: true})
  const appData = apps[nameSlug]
  const headers = {
    authorization: `Bearer ${oauthToken.credentials?.oauth_access_token}`,
    "content-type": "application/json",
  }
  if (appData && appData.auth?.type === "basic") {
    const regex = /{{custom_fields\.(\w+)}}/
    const userMatch = appData.auth.basic_username.match(regex)
    const passMatch = appData.auth.basic_password.match(regex)

    const user = userMatch ? userMatch[1] : null
    const pass = passMatch ? passMatch[1] : null

    const username = user ? oauthToken.credentials?.[user] : ""
    const password = pass ? oauthToken.credentials?.[pass] : ""
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

