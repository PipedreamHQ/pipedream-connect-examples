"use client"

import CodePanel from "./CodePanel";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { serverConnectTokenCreate, serverConnectGetApps } from "./server"
import { AppInfo } from "@pipedream/sdk";

const frontendHost = process.env.NEXT_PUBLIC_PIPEDREAM_FRONTEND_HOST || "pipedream.com"

export default function Home() {
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null)
  const [connectLink, setConnectLink] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [app, setApp] = useState<string | null>(null)
  const [apn, setAuthProvisionId] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null)
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
    "https://pipedream.com/docs/connect/quickstart#connect-to-the-pipedream-api-from-your-server-and-create-a-token"
  const frontendSDKDocs = "https://pipedream.com/docs/connect/quickstart#connect-your-account-from-the-frontend"

  const connectApp = (appSlug: string, appId: string | undefined) => {
    if (!externalUserId) {
      throw new Error("External user ID is required.");
    }
    if (!token) {
      throw new Error("Token is required.");
    }
    setApp(appSlug)
    pd.connectAccount({
      app: appSlug,
      oauthAppId: appId,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!appSlug.trim()) {
      setError("Please enter an app slug")
      return
    }
    
    const normalizedSlug = normalizeAppSlug(appSlug)
    setSelectedApp({
      name_slug: normalizedSlug,
      id: undefined
    } as AppInfo)
  }

  return (
    <main className="p-5 flex flex-col gap-2 max-w-6xl mb-48">
      {externalUserId && (
        <div>
          <h1 className="text-2xl font-bold mb-8">Pipedream Connect Example App</h1>
          <div className="mb-4">
            <p>Refer to the <a href={docsConnect} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">Pipedream Connect docs</a> for a full walkthrough of how to configure Connect for your site.</p>
          </div>
          <div className="mb-4">
            <p>When your customers connect accounts with Pipedream, you'll pass their unique user ID in your system — whatever you use to identify them. In this example, we generate a random external user ID for you:
              <span className="font-mono font-bold"> {externalUserId}</span>
            </p>
          </div>
          <div className="border border-b mb-4"></div>
          
          <div className="mb-8">
            <p>In <code>server.ts</code>, the app calls <code>serverConnectTokenCreate</code> to create a short-lived token for the user. You'll use that token to initiate app connection requests from your site securely. <a href={docsTokenCreate} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">See docs</a>.</p>
          </div>
          <div className="mb-8">
            <CodePanel
              language="typescript"
              code={`import { connectTokenCreate } from "@pipedream/sdk";

const { token, expires_at } = await serverConnectTokenCreate({
  external_user_id: "${externalUserId}",
})`}
            />
          </div>

          {token && (
            <div className="mb-4 text-gray-600">
              <p><span className="font-semibold">Connect Token:</span> <span className="font-mono">{token}</span></p>
              <p><span className="font-semibold">Token expiry:</span> <span className="font-mono">{expiresAt}</span></p>
            </div>
          )}
          
          <div className="py-2">
            <label className="font-semibold text-xl" htmlFor="app-slug">Enter an app name slug:</label>
            <br />
            <br />
            <ol className="font-regular text-md list-decimal pl-4 text-gray-600">
              <li>Find the app you want to connect to here: <a target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600" href="https://pipedream.com/apps">https://pipedream.com/apps</a></li>
              <li>Copy the `name_slug` either from the Authentication section of the app's page or from the URL (e.g., `google_sheets`)</li>
            </ol>
            <br />
            <form onSubmit={handleSubmit} className="flex gap-2 mt-2 max-w-md">
              <input
                className="shadow appearance-none border rounded w-64 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="app-slug"
                type="text"
                placeholder="app_slug"
                value={appSlug}
                onChange={handleAppSlugChange}
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
              >
                Continue
              </button>
            </form>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>

          {selectedApp && (
            <>
              <div className="border border-b my-6"></div>
              
              <div className="my-8">
                <h2 className="font-semibold text-xl mb-4">Connect your account</h2>
                <div className="my-2">
                  <p className="text-lg font-medium">Option 1: Connect via SDK</p>
                  <p className="text-gray-600 mb-2">Use the SDK to open a Pipedream iFrame directly from your site (<a target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600" href={frontendSDKDocs}>see docs</a>).</p>
                  <button 
                    className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded mt-2"
                    onClick={connectAccount}
                  >
                    Connect your {selectedApp.name_slug} account
                  </button>
                </div>

                <p className="my-4">
                  You'll call <code>pd.connectAccount</code> with the token and the <code>app_slug</code> of the app you'd like to connect:
                </p>
                <div className="mb-8">
                  <CodePanel
                    language="typescript"
                    code={`import { createClient } from "@pipedream/sdk/browser";
        
const pd = createClient();
pd.connectAccount({
  app: "${selectedApp.name_slug}",
  token: "${token || '[TOKEN]'}",
  onSuccess: ({ id: accountId }) => {
    console.log('Account successfully connected: ${apn || '{accountId}'}');
  }
})`}
                  />
                </div>

                <div className="my-4">
                  <p className="text-lg font-medium">Option 2: Connect Link</p>
                  <div className="text-gray-600 mb-4">
                    <span>Provide a hosted page via URL to your users to connect their account. This is useful if you aren't able to execute JavaScript or open an iFrame from your site. </span>
                    <span className="font-semibold">Note that this URL can only be used once. </span>
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
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}