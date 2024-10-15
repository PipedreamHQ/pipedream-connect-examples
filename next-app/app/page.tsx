"use client"

import CodePanel from "./CodePanel";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { serverConnectTokenCreate, serverConnectGetApps } from "./server"
import { createClient } from "@pipedream/sdk/browser"
import { AppInfo } from "@pipedream/sdk";

const frontendHost = process.env.NEXT_PUBLIC_PIPEDREAM_FRONTEND_HOST || "pipedream.com"

export default function Home() {
  const pd = createClient({ frontendHost })
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null)
  const [connectLink, setConnectLink] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [app, setApp] = useState<string | null>(null)
  const [apn, setAuthProvisionId] = useState<string | null>(null)
  const [apps, setApps] = useState<object[] | null>(null)
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<string | null>("")

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
    setApp(app)
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
    //setExternalUserId(crypto.randomUUID());
    const uuid = searchParams.get("uuid") ? searchParams.get("uuid") : crypto.randomUUID()
    setExternalUserId(uuid);

    (async () => {
      try {
        const linkedApps = await serverConnectGetApps()
        setApps(linkedApps.apps)
      } catch (error) {
        console.error("Error fetching data:", error)
        // Handle error appropriately
      }
    })()

  }, []);

  useEffect(() => {
    if (!externalUserId) {
      setToken(null)
      setConnectLink(null)
      setAuthProvisionId(null)
    } else {
      if (!selectedApp) return
      (async () => {
        try {
          const { token, connect_link_url, expires_at } = await serverConnectTokenCreate({
            external_user_id: externalUserId,
            // success_redirect_uri: 'https://example.com/success',
            // error_redirect_uri: 'https://example.com/error',
          })
          setToken(token)
          setConnectLink(connect_link_url)
          setExpiresAt(expires_at)
        } catch (error) {
          console.error("Error fetching data:", error)
          // Handle error appropriately
        }
      })()
    }
  }, [externalUserId, selectedApp])

  const onSelectApp = (event) => {
    //debugger
    const idx = event.target.value
    const app = apps[idx]
    setSelectedIdx(idx)
    setSelectedApp(apps[idx])
  }


  return (
    <main className="p-5 flex flex-col gap-2 max-w-6xl mb-48">
      {externalUserId && apps && (
        <div>
          <h1 className="text-2xl font-bold mb-8">Pipedream Connect Example App</h1>
          <div className="mb-4">
            <p>Refer to the <a href={docsConnect} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">Pipedream Connect docs</a> for a full walkthrough of how to configure Connect for your site. This example app implements Connect in a Next.js (React) app.</p>
          </div>
          <div className="mb-4">
            <p>When your customers connect accounts with Pipedream, you&apos;ll pass their unique user ID in your system — whatever you use to identify them. In this example, we generate a random external user ID for you:
              <span className="font-mono font-bold"> {externalUserId}</span>
            </p>
          </div>
          <div className="border border-b mb-4"></div>
          
          <div className="mb-8">
            <p>In <code>server.ts</code>, the app calls <code>serverConnectTokenCreate</code> to create a short-lived token for the user. You&apos;ll use that token to initiate app connection requests from your site securely. <a href={docsTokenCreate} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">See docs</a>.</p>
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
          <div className="border border-b mb-6"></div>
          
          {apn ? (
            <div className="my-4">
              <p>Successfully connected your account! Refresh the page to connect another one.</p>
              <p className="my-2">
                <span className="font-semibold text-lg">External User ID:</span>
                <span className="font-mono"> {externalUserId}</span>
              </p>
              <p className="my-2">
                <span className="font-semibold text-lg">Pipedream Account ID:</span>
                <span className="font-mono"> {apn}</span>
              </p>
            </div>
          ) : (
            <>
              <div className="pb-2">
                <label className="font-semibold text-xl" htmlFor="app-select">First, select an app:</label>
                <select
                  id="app-select"
                  value={selectedIdx}
                  onChange={onSelectApp}
                  className="ml-4 border border-gray-600 rounded-md p-2"
                >
                  <option value="">-- select an app --</option>
                  {apps.map((app, index) => (
                    <option key={index} value={index}>
                      {app.id ? `${app.name_slug} (${app.id})` : app.name_slug}
                    </option>
                  ))}
                </select>
                <p className="text-gray-600 mt-1">This list of apps comes from the apps linked to your project in the Pipedream UI.</p>
              </div>
              {selectedApp && (
                <>
                  <div className="mb-2 text-gray-600">
                    <span className="font-semibold">Connect Token</span>
                    <span> (can only be used once):</span>
                    <span className="font-mono"> {token}</span>
                  </div>
                  <div className="mb-2 text-gray-600">
                    <span className="font-semibold">Token expiry:</span>
                    <span className="font-mono"> {expiresAt}</span>
                  </div>
                  <div className="border border-b my-6"></div>
                  <div className="my-8">
                    <span className="font-semibold text-xl">Next, connect your account</span>
                    <div className="my-2">
                      <p className="text-lg font-medium">Option 1: Directly from your frontend</p>
                      <p className="text-gray-600 mb-2">Use the SDK to open a Pipedream iFrame directly from your site (<a target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600" href={frontendSDKDocs}>see docs</a>).</p>
                      <button className="bg-blue-500 hover:bg-blue-400 text-white py-2 px-4 rounded" onClick={connectAccount}>Connect your {selectedApp.name_slug} account</button>
                    </div>
                    <p className="my-4">
                      You&apos;ll call <code>pd.connectAccount</code> with the token and the <code>app_slug</code> of the app you&apos;d like to connect:
                    </p>
                    <div className="mb-8">
                      <CodePanel
                        language="typescript"
                        code={`import { createClient } from "@pipedream/sdk/browser";
        
const pd = createClient();
pd.connectAccount({
  app: ${selectedApp?.name_slug ? `"${selectedApp.name_slug}"` : '// select an app above'},
  token: ${token ? `"${token}"` : '// select an app above to create your token'},
  onSuccess: ({ id: accountId }) => {
    console.log('Account successfully connected: ${apn ? `"${apn}"` : '{accountId}'}');
})`}
                      />
                    </div>
                  </div>
                  <div className="my-4">
                      <p className="text-lg font-medium">Option 2: Connect Link</p>
                      <div className="text-gray-600 mb-4">
                        <span>Provide a hosted page via URL to your users to connect their account. This is useful if you aren't able to execute JavaScript or open an iFrame from your site. </span>
                        <span className="font-semibold">Note that this URL can only be used once. </span>
                        <span><a target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600" href="https://pipedream.com/docs/connect/quickstart#use-connect-link">See the docs</a> for more info.</span>
                      </div>
                    <div>
                      {connectLink && (
                        <a target="_blank" rel="noopener noreferrer" className="font-mono hover:underline text-blue-600" href={`${connectLink}&app=${selectedApp.name_slug}&oauthAppId=${selectedApp.id}`}>
                          {connectLink}&app={selectedApp.name_slug}
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
