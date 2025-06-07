"use client"

import CodePanel from "./CodePanel";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { serverConnectTokenCreate, getAppInfo } from "./server"
import { AppResponse, BrowserClient } from "@pipedream/sdk/browser";

const frontendHost = process.env.NEXT_PUBLIC_PIPEDREAM_FRONTEND_HOST || "pipedream.com"

export default function Home() {
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null)
  const [connectLink, setConnectLink] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [apn, setAuthProvisionId] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<AppResponse | null>(null);
  const [appSlug, setAppSlug] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [pd, setPd] = useState<BrowserClient | null>(null);
  const [isOAuthConfirmed, setIsOAuthConfirmed] = useState(true);

  useEffect(() => {
    // This code only runs in the browser
    async function loadClient() {
      const { createFrontendClient } = await import('@pipedream/sdk/browser');
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

  interface ConnectResult {
    id: string
  }

  interface ConnectConfig {
    app: string
    token: string
    onSuccess: (result: ConnectResult) => void
  }

  const connectApp = (appSlug: string) => {
    if (!externalUserId) {
      throw new Error("External user ID is required.");
    }
    if (!token) {
      throw new Error("Token is required.");
    }
    setAppSlug(appSlug)
    
    const connectConfig: ConnectConfig = {
      app: appSlug,
      token,
      onSuccess: ({ id }: ConnectResult) => {
        setAuthProvisionId(id)
      }
    }

    if (!pd) {
      console.error("Pipedream SDK not loaded")
      return
    }
    pd.connectAccount(connectConfig)
  }

  const connectAccount = async () => {
    if (!selectedApp) return
    await connectApp(selectedApp.name_slug)
  }

  useEffect(() => {
    const uuid = searchParams.get("uuid") ? searchParams.get("uuid") : crypto.randomUUID()
    if (!uuid) {
      console.error("No external user ID provided")
      return
    }
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
      const response = await getAppInfo(normalizedSlug);
      // console.log('App Info:', response);
      setSelectedApp(response); // This is the key change - access the data property
    } catch (err) {
      console.error("Error:", err);
      setError(`Couldn't find the app slug, ${normalizedSlug}`);
    }
  }

  // Set OAuth confirmed state when app changes
  useEffect(() => {
    setIsOAuthConfirmed(true);
  }, [selectedApp]);
  
  return (
    <main className="p-5 flex flex-col gap-2 max-w-6xl mb-48">
      {externalUserId && (
        <div>
          <h1 className="text-title mb-8">Pipedream Connect Example App</h1>
          <div className="mb-4 text-body">
            <p className="mb-4">Refer to the <a href={docsConnect} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">Pipedream Connect docs</a> for a full walkthrough of how to configure Connect for your site.</p>
            <p>When your customers connect accounts with Pipedream, you&apos;ll pass their unique user ID in your system — whatever you use to identify them. In this example, we&apos;ll generate a random external user ID for you:
              <span className="text-code font-bold"> {externalUserId}.</span>
            </p>
          </div>
          <div className="border border-b mb-4"></div>
          
          <div className="mb-8">
            <p className="text-body">In <code>server.ts</code>, the app calls <code>serverConnectTokenCreate</code> to create a short-lived token for the user. You&apos;ll use that token to initiate app connection requests from your site securely. <a href={docsTokenCreate} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">See docs</a>.</p>
          </div>
          <div className="mb-8">
            <CodePanel
              language="typescript"
              code={`import { serverConnectTokenCreate } from "@pipedream/sdk";

const resp = await serverConnectTokenCreate({
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
            <p className="text-body">Find the app you want to connect to here: <a target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600" href="https://pipedream.com/apps">https://pipedream.com/apps</a>, then copy the `name_slug` either from the <span className="font-semibold">Authentication</span> section of the app&apos;s page or from the URL (e.g., `google_sheets`).</p>
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
                    <span>Provide a URL to your users to connect their account. This is useful if you aren&apos;t able to execute JavaScript or open an iFrame from your app. </span>
                    <span><a target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600" href="https://pipedream.com/docs/connect/connect-link">See the docs</a> for more info.</span>
                  </div>
                  {connectLink && (
                    <a 
                      href={`${connectLink}&app=${selectedApp.name_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono hover:underline text-blue-600 block mt-2"
                    >
                      {connectLink}&app={selectedApp.name_slug}
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
                    Connect {selectedApp.name}
                  </button>
                </div>
                <p className="my-4 text-body">
                  You&apos;ll call <code>pd.connectAccount</code> with the token and the <code>app_slug</code> of the app you&apos;d like to connect:
                </p>
                <div className="mb-8">
                  <CodePanel
                    language="typescript"
                    code={`import { createFrontendClient } from "@pipedream/sdk/browser"
        
const pd = createFrontendClient();
pd.connectAccount({
  app: "${selectedApp.name_slug}", // The app name to connect to
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