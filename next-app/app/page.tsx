"use client"

import CodePanel from "./CodePanel";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { serverConnectTokenCreate, getAppInfo } from "./server"
import { AppInfo, AppAuthType } from "@pipedream/sdk";

const frontendHost = process.env.NEXT_PUBLIC_PIPEDREAM_FRONTEND_HOST || "pipedream.com"

export default function Home() {
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null)
  const [connectLink, setConnectLink] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [setApp] = useState<string | null>(null)
  const [apn, setAuthProvisionId] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<AppResponse | null>(null);
  const [appSlug, setAppSlug] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [pd, setPd] = useState(null);

  useEffect(() => {
    // This code only runs in the browser
    async function loadClient() {
      const { createFrontendClient } = await import('@pipedream/sdk');
      const client = createFrontendClient({ frontendHost });
      setPd(client);
    }
  
    loadClient();
  }, []);

  const searchParams = useSearchParams()

  const docsConnect = "https://pipedream.com/docs/connect/"
  const docsTokenCreate =
    "https://pipedream.com/docs/connect/quickstart#generate-a-short-lived-token"
  const frontendSDKDocs = "https://pipedream.com/docs/connect/quickstart#use-the-pipedream-sdk-in-your-frontend"
  const connectOauthDocs = "https://pipedream.com/docs/connect/oauth-clients"

  const connectApp = (appSlug: string, appId: string | undefined) => {
    if (!externalUserId) {
      throw new Error("External user ID is required.");
    }
    if (!token) {
      throw new Error("Token is required.");
    }
    setAppSlug(appSlug)
    pd.connectAccount({
      app: appSlug,
      oauthAppId: oauthAppId || appId, // Use oauthAppId if provided
      token,
      onSuccess: ({ id: authProvisionId }) => {
        setAuthProvisionId(authProvisionId as string)
      }
    })
  }

  const connectAccount = async () => {
    if (!selectedApp) return
    await connectApp(selectedApp.name_slug, selectedApp?.id)
  }

  useEffect(() => {
    const uuid = searchParams.get("uuid") ? searchParams.get("uuid") : crypto.randomUUID()
    setExternalUserId(uuid);

    // Create token immediately after setting external user ID
    (async () => {
      try {
        const { token, connect_link_url, expires_at } = await serverConnectTokenCreate({
          external_user_id: uuid,
        })
        setToken(token)
        setConnectLink(connect_link_url)
        setExpiresAt(expires_at)
      } catch (error) {
        console.error("Error creating token:", error)
      }
    })()
  }, []);

  const handleAppSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppSlug(e.target.value)
    setError("")
  }

  const normalizeAppSlug = (slug: string): string => {
    return slug.trim().replace(/-/g, '_')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appSlug.trim()) {
      setError("Please enter an app slug");
      return;
    }
    if (!token) {
      setError("No token available");
      return;
    }
    
    const normalizedSlug = normalizeAppSlug(appSlug);
    try {
      const response = await getAppInfo(normalizedSlug, token);
      console.log('App Info:', response);
      setSelectedApp(response.data); // This is the key change - access the data property
    } catch (err) {
      console.error("Error:", err);
      setError(`Couldn't find the app slug, ${normalizedSlug}`);
    }
  }

  // Add new state for OAuth App ID
  const [oauthAppId, setOauthAppId] = useState<string>("");

  // Add handler for OAuth App ID input
  const handleOAuthAppIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOauthAppId(e.target.value);
    setError("");
  };

  // Add state to track if OAuth app ID has been confirmed
  const [isOAuthConfirmed, setIsOAuthConfirmed] = useState(false);

  // Add handler for OAuth app ID submission
  const handleOAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOAuthConfirmed(true);
  };

  // Reset OAuth confirmed state when app changes
  useEffect(() => {
    setIsOAuthConfirmed(false);
    setOauthAppId('');
  }, [selectedApp]);
  
  return (
    <main className="p-5 flex flex-col gap-2 max-w-6xl mb-48">
      {externalUserId && (
        <div>
          <h1 className="text-title mb-8">Pipedream Connect Example App</h1>
          <div className="mb-4 text-body">
            <p className="mb-4">Refer to the <a href={docsConnect} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">Pipedream Connect docs</a> for a full walkthrough of how to configure Connect for your site.</p>
            <p>When your customers connect accounts with Pipedream, you'll pass their unique user ID in your system — whatever you use to identify them. In this example, we generate a random external user ID for you:
              <span className="text-code font-bold"> {externalUserId}.</span>
            </p>
          </div>
          <div className="border border-b mb-4"></div>
          
          <div className="mb-8">
            <p className="text-body">In <code>server.ts</code>, the app calls <code>serverConnectTokenCreate</code> to create a short-lived token for the user. You'll use that token to initiate app connection requests from your site securely. <a href={docsTokenCreate} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">See docs</a>.</p>
          </div>
          <div className="mb-8">
            <CodePanel
              language="typescript"
              code={`import { serverConnectTokenCreate } from "@pipedream/sdk";

const { token, expires_at } = await serverConnectTokenCreate({
  external_user_id: "${externalUserId}", // The end user's ID in your system, this is an example
})`}
            />
          </div>

          {token && (
            <div className="mb-4 text-gray-600">
              <p>
                <span className="font-semibold">Connect Token:</span>
                <span className="font-code"> {token}; </span>
                <span className="font-semibold"> expiry: </span>
                <span className="font-code">{expiresAt}</span>
              </p>
            </div>
          )}
          
          <div className="py-2">
            <p className="text-subtitle pb-2">Enter an app name slug</p>
            <p className="text-body">Find the app you want to connect to here: <a target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600" href="https://pipedream.com/apps">https://pipedream.com/apps</a>, then copy the `name_slug` either from the <span className="font-semibold">Authentication</span> section of the app's page or from the URL (e.g., `google_sheets`).</p>
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md py-4">
            <input
              className="shadow appearance-none border rounded w-64 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="app-slug"
              type="text"
              placeholder="app_slug"
              value={appSlug}
              onChange={handleAppSlugChange}
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white p-2 px-4 rounded"
            >
              Continue
            </button>
          </form>
          {error && <p className="text-error mt-2">{error}</p>}
        </div>

        {selectedApp && (selectedApp as AppResponse).auth_type === 'oauth' && (
          <div className="py-2">
            <form onSubmit={handleOAuthSubmit}>
              <p className="text-subtitle pb-2">Enter an OAuth App ID for {appSlug} <span className="font-light">(optional)</span></p>
              <p className="text-body">To use Pipedream's OAuth client, click <span className="font-semibold">Continue</span>. To use your own, <a target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600" href={connectOauthDocs}>configure it in the Pipedream UI</a> and paste the `oauth_app_id` below, then click <span className="font-semibold">Continue</span>.</p>
              <div className="flex gap-2 my-4 max-w-md">
                <input
                  className="shadow appearance-none border rounded w-64 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="oauth-app-id"
                  type="text"
                  placeholder="OAuth App ID"
                  value={oauthAppId}
                  onChange={handleOAuthAppIdChange}
                />
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedApp && (
          (selectedApp as AppResponse).auth_type !== 'oauth' || isOAuthConfirmed
        ) && (
          <>
            <div className="border border-b my-2"></div>
              
              <div className="my-8">
                <h2 className="text-title mb-4">Connect your account</h2>
                <div className="my-4">
                  <p className="text-subtitle">Option 1: Connect Link</p>
                  <div className="text-body">
                    <span>Provide a hosted page via URL to your users to connect their account. This is useful if you aren't able to execute JavaScript or open an iFrame from your site. </span>
                    <span className="font-semibold">Note that this URL can only be used once, since Connect tokens are one-time use. </span>
                    <span><a target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600" href="https://pipedream.com/docs/connect/connect-link">See the docs</a> for more info.</span>
                  </div>
                  {connectLink && (
                    <a 
                      href={`${connectLink}&app=${selectedApp.name_slug}${oauthAppId ? `&oauthAppId=${oauthAppId}` : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono hover:underline text-blue-600 block mt-2"
                    >
                      {connectLink}&app={selectedApp.name_slug}{oauthAppId ? `&oauthAppId=${oauthAppId}` : ''}
                    </a>
                  )}
                </div>
                <div className="mt-8">
                  <p className="text-subtitle">Option 2: Connect via SDK</p>
                  <p className="text-body">Use the SDK to open a Pipedream iFrame directly from your site (<a target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600" href={frontendSDKDocs}>see docs</a>).</p>
                  <button 
                    className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded mt-2"
                    onClick={connectAccount}
                  >
                    Connect your {selectedApp.name_slug} account
                  </button>
                </div>
                <p className="my-4 text-body">
                  You'll call <code>pd.connectAccount</code> with the token and the <code>app_slug</code> of the app you'd like to connect:
                </p>
                <div className="mb-8">
                  <CodePanel
                    language="typescript"
                    code={`import { createFrontendClient } from "@pipedream/sdk"
        
const pd = createFrontendClient();
pd.connectAccount({
  app: "${selectedApp.name_slug}", // The app name to connect to
  oauthAppId: ${oauthAppId ? `"${oauthAppId}",` : ''}, // ${oauthAppId ? 'Using custom OAuth client' : 'Defaults to Pipedream\'s OAuth client if omitted'}
  token: "${token || '[TOKEN]'}",
  onSuccess: ({ id: accountId }) => {
    console.log('Account successfully connected: ${apn || '{accountId}'}');
  }
})`}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}