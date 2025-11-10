/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import type { App, GetAppResponse } from "@pipedream/sdk/browser";
import { getAccountById } from "../server";
import { ErrorBoundary } from "./ErrorBoundary";
import CodePanel from "./CodePanel";
import { SearchSelect } from "./SearchSelect";
import { useConnectToken } from "../_hooks/useConnectToken";
import type { ConnectContext } from "../types";
import { ConnectOptions } from "./ConnectOptions";

interface ConnectWorkspaceProps {
  initialContext: ConnectContext;
  docs: {
    frontendSdk: string;
    accountsApi: string;
  };
  projectId?: string;
}

export function ConnectWorkspace({ initialContext, docs, projectId }: ConnectWorkspaceProps) {
  const { client, connectLinkUrl, refreshToken, token, expiresAt } = useConnectToken(initialContext);

  const [selectedApp, setSelectedApp] = useState<GetAppResponse | null>(null);
  const [appSlug, setAppSlug] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"typescript" | "python">("typescript");

  const connectSectionRef = useRef<HTMLDivElement>(null);

  const handleAppSelected = (app: App) => {
    const mockResponse: GetAppResponse = { data: app };
    setSelectedApp(mockResponse);
    setAppSlug(app.nameSlug);
    setAccountId(null);
    setAccountName(null);
    setError("");
    setTimeout(() => {
      connectSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const connectAccount = async () => {
    if (!client || !selectedApp) return;

    await client.connectAccount({
      app: selectedApp.data.nameSlug,
      onSuccess: async ({ id }) => {
        setAccountId(id);
        try {
          const account = await getAccountById(id);
          setAccountName(account.name ?? null);
        } catch (err) {
          console.error("Error fetching account name", err);
        }
        await refreshToken();
      },
      onError: (err) => {
        console.error("❌ Connection error:", err);
        setError(err.message);
      },
      onClose: (status) => {
        console.log("Connect dialog closed", status);
      },
    });
  };

  const tokenPanelCode =
    selectedLanguage === "typescript"
      ? `import { PipedreamClient } from "@pipedream/sdk";

const client = new PipedreamClient({
  projectId: "your_project_id",
  projectEnvironment: "development", // or "production"
  clientId: "your_client_id",
  clientSecret: "your_client_secret"
});

const resp = await client.tokens.create({
  externalUserId: "${initialContext.externalUserId}",
});

console.log(resp);`
      : `from pipedream import Pipedream

client = Pipedream(
  project_id="your_project_id",
  project_environment="development", # or "production"
  client_id="your_client_id",
  client_secret="your_client_secret",
)

resp = client.tokens.create(
  external_user_id="${initialContext.externalUserId}",
)

print(resp)`;

  return (
    <>
      <div className="mb-8">
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="flex items-center px-4 py-2 bg-gray-800">
            <div className="flex">
              <button
                onClick={() => setSelectedLanguage("typescript")}
                className={`flex items-center justify-center gap-2 w-32 px-3 pt-3 pb-4 text-sm transition-all duration-200 border-b-2 ${
                  selectedLanguage === "typescript"
                    ? "text-gray-100 border-gray-100"
                    : "text-gray-400 border-transparent hover:text-gray-200"
                }`}
              >
                <img src="/typescript-icon.svg" alt="TypeScript" className="w-4 h-4" />
                TypeScript
              </button>
              <button
                onClick={() => setSelectedLanguage("python")}
                className={`flex items-center justify-center gap-2 w-32 px-3 pt-3 pb-4 text-sm transition-all duration-200 border-b-2 ${
                  selectedLanguage === "python"
                    ? "text-gray-100 border-gray-100"
                    : "text-gray-400 border-transparent hover:text-gray-200"
                }`}
              >
                <img src="/python-icon.svg" alt="Python" className="w-4 h-4" />
                Python
              </button>
            </div>
          </div>
          <div className="relative">
            <CodePanel language={selectedLanguage} code={tokenPanelCode} />
          </div>
        </div>
      </div>

      {token && (
        <div className="mb-4 text-gray-600">
          <p>
            <span className="font-semibold">Connect Token:</span>
            <span className="font-code"> {token}; </span>
            <span className="font-semibold">expiry:</span>{" "}
            <span className="font-code">{expiresAt?.toISOString()}</span>
          </p>
        </div>
      )}

      <div className="py-2">
        <p className="text-subtitle pb-2">Select an app to connect</p>
        <ErrorBoundary>
          {selectedApp ? (
            <div className="shadow border rounded w-full px-3 py-2 bg-gray-50 border-gray-300 flex items-center justify-between max-w-md">
              <div className="flex items-center gap-3">
                <img src={selectedApp.data.imgSrc} alt={selectedApp.data.name} className="w-6 h-6 rounded" />
                <div>
                  <div className="font-medium text-gray-900">{selectedApp.data.name}</div>
                  <div className="text-sm text-gray-500">{selectedApp.data.nameSlug}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setAppSlug("");
                  setAccountId(null);
                  setAccountName(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Clear selection"
              >
                ✕
              </button>
            </div>
          ) : (
            <SearchSelect appSlug={appSlug} onAppSlugChange={setAppSlug} onAppSelected={handleAppSelected} client={client} />
          )}
        </ErrorBoundary>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      {selectedApp && (
        <>
          <div className="border border-b my-2" />
          <div className="my-8" ref={connectSectionRef}>
            <ConnectOptions
              selectedApp={selectedApp}
              externalUserId={initialContext.externalUserId}
              connectAccount={connectAccount}
              accountId={accountId}
              accountName={accountName}
              connectLinkUrl={connectLinkUrl}
              frontendSDKDocs={docs.frontendSdk}
              accountsDocsUrl={docs.accountsApi}
              projectId={projectId}
            />
          </div>
        </>
      )}
    </>
  );
}
