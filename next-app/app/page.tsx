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
  const [hostedLink, setHostedLink] = useState<string | null>(null)
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
      setHostedLink(null)
      setAuthProvisionId(null)
    } else {
      if (!selectedApp) return
      (async () => {
        try {
          const { token, connect_link_url, expires_at } = await serverConnectTokenCreate({
            app_slug: selectedApp.name_slug,
            oauth_app_id: selectedApp.id,
            external_user_id: externalUserId,
            // success_redirect_uri: 'https://example.com',
            // error_redirect_uri: 'https://example.com',
          })
          setToken(token)
          setHostedLink(connect_link_url)
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
    <main className="p-5 flex flex-col gap-2 max-w-5xl mb-48">
      {
        (false) &&
        <div className="flex flex-col gap-2 text-slate-800 pb-4">
          <div>
            <p>
              The <code>NEXT_PUBLIC_PIPEDREAM_APP_ID</code> variable is not set in your environment. Copy the <code>.env.example</code> file in this directory and fill in the appropriate environment variables.
            </p>
            <CodePanel
              language="plaintext"
              code={`# Config for the Next.js app
# Key based apps only require the app_slug value. OAuth apps require both.
NEXT_PUBLIC_PIPEDREAM_APP_SLUG=github
NEXT_PUBLIC_PIPEDREAM_APP_ID=oa_abc123

# Project credentials — used to authenticate with the Pipedream API.
# These are scoped to the server-side only.
PIPEDREAM_PROJECT_PUBLIC_KEY=pub_abc123
PIPEDREAM_PROJECT_SECRET_KEY=sec_abc123`}
            />
          </div>
        </div>
      }
      {
        externalUserId && apps &&
        <div>
          <h1 className="text-2xl font-bold mb-8">Pipedream Connect Example App</h1>
          <div className="mb-4">
            <p>Refer to the <a href={docsConnect} target="_blank nofollow" className="hover:underline text-blue-600">Pipedream Connect docs</a> for a full walkthrough of how to configure Connect for your site. This example app implements Connect in a Next.js (React) app.</p>
          </div>
          <div className="mb-4">
            <p>When your customers connect accounts with Pipedream, you&apos;ll pass their unique user ID in your system — whatever you use to identify them. In this example, we generate a random external user ID for you:
              <span className="font-mono font-bold"> {externalUserId}</span>
            </p>
          </div>
          <div className="border border-b mb-4"></div>
          <div className="mb-8">
            <p>In <code>server.ts</code>, the app calls <code>serverConnectTokenCreate</code> to create a short-lived token for the user. You&apos;ll use that token to initiate app connection requests from your site securely. <a href={docsTokenCreate} target="_blank nofollow" className="hover:underline text-blue-600">See docs</a>.</p>
          </div>
          <div className="mb-8">
            <CodePanel
              language="typescript"
              code={`import { connectTokenCreate } from "@pipedream/sdk";

const { token, expires_at } = await serverConnectTokenCreate({
  app_slug: ${selectedApp?.name_slug ? `"${selectedApp.name_slug}"` : '// select an app below'},${selectedApp?.id ? `
  oauth_app_id: "${selectedApp.id}",  // Only required for OAuth apps` : ''}
  external_user_id: "${externalUserId}",
})`}
            />
          </div>
          <div className="border border-b mb-6"></div>
          <div className="pb-4">
            <label className="font-semibold" htmlFor="item-select">Select an app:</label>
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
          <div className="mb-4">
            <span className="font-semibold">Connect Token:</span>
            <span className="font-mono"> {token}</span>
          </div>
          <div className="mb-4">
            <span className="font-semibold">Token expiry:</span>
            <span className="font-mono"> {expiresAt}</span>
          </div>
          <div className="mb-4" >
            <div className="font-semibold">Hosted Link:</div>
            <div>
              {
                hostedLink ?
                  <a href={`${hostedLink}&app=${selectedApp?.name_slug}&oauthAppId=${selectedApp?.id}`} className="font-mono">{hostedLink}&app={selectedApp?.name_slug}&oauthAppId={selectedApp?.id}</a>
                  : null
              }
            </div>
          </div>
          {apn ?
            <div className="mb-4">
              <p>
                <span className="font-semibold">Pipedream Account ID:</span>
                <span className="font-mono"> {apn}</span>
              </p>
            </div>
            :
            <div className="mb-2">
              <button hidden={!selectedApp} className="bg-blue-500 hover:bg-blue-400 text-white py-2 px-4 rounded" onClick={connectAccount}>Connect your {selectedApp?.name_slug} account</button>
            </div>
          }
        </div>
      }
      <div className="border border-b mb-6"></div>
      <p className="mb-8">
        When a user wants to connect an app from your frontend, you&apos;ll call <code>pd.connectAccount</code> with the token and the <code>app_slug</code> of the app you&apos;d like to connect.
      </p>
      <div className="mb-8">
        <CodePanel
          language="typescript"
          code={`import { createClient } from "@pipedream/sdk/browser";

const pd = createClient();
pd.connectAccount({
  app,
  token,
  onSuccess: () => {
    console.log("Connected!")
  }
})`}
        />
      </div>
    </main>
  );
}
