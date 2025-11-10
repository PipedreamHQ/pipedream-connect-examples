"use client";

import CodePanel from "./CodePanel";
import { ExternalLink } from "./ExternalLink";
import type { GetAppResponse } from "@pipedream/sdk/browser";

interface ConnectOptionsProps {
  selectedApp: GetAppResponse;
  externalUserId: string;
  connectAccount: () => Promise<void>;
  accountId: string | null;
  accountName: string | null;
  connectLinkUrl: string | null;
  frontendSDKDocs: string;
  accountsDocsUrl: string;
  projectId?: string;
}

export function ConnectOptions({
  selectedApp,
  externalUserId,
  connectAccount,
  accountId,
  accountName,
  connectLinkUrl,
  frontendSDKDocs,
  accountsDocsUrl,
  projectId,
}: ConnectOptionsProps) {
  return (
    <div className="my-8">
      <h2 className="text-title mb-4">Connect your account</h2>
      <div className="my-4">
        <p className="text-subtitle">Option 1: Connect via SDK</p>
        <p className="text-body">
          Use the frontend SDK to open a Pipedream iFrame directly from your site (
          <ExternalLink href={frontendSDKDocs}>see docs</ExternalLink>).
        </p>
        <button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded mt-2" onClick={connectAccount}>
          Connect {selectedApp.data.name}
        </button>
        {accountId && (
          <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            <div className="mb-2">
              ✅ Account connected!{" "}
              {accountName ? (
                <>
                  <strong>{accountName}</strong> <span> (ID: </span>
                  <code className="font-mono">{accountId}</code>
                  <span>)</span>
                </>
              ) : (
                <>
                  Account ID: <code className="font-mono">{accountId}</code>
                </>
              )}
            </div>
            <div className="text-sm">
              <span>You can manage users and their connected accounts in the </span>
              {projectId ? (
                <ExternalLink href={`https://pipedream.com/@pd-connect-testing/projects/${projectId}/connect/users`}>
                  Pipedream UI
                </ExternalLink>
              ) : (
                <ExternalLink href="https://pipedream.com/projects">Pipedream UI</ExternalLink>
              )}
              <span> or </span>
              <ExternalLink href={accountsDocsUrl}>via the API</ExternalLink>
            </div>
          </div>
        )}
        <p className="my-4 text-body">
          Call <code>connectAccount()</code> with the token and the app slug of the app you&apos;d like to connect:
        </p>
        <CodePanel
          language="typescript"
          code={`import { createFrontendClient } from "@pipedream/sdk/browser";

const externalUserId = "${externalUserId}";

const pd = createFrontendClient({
  externalUserId,
  tokenCallback: async () => {
    const res = await fetch("/api/pipedream/token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ externalUserId }),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch connect token");
    }

    const { token, expiresAt } = await res.json();
    return { token, expiresAt: new Date(expiresAt) };
  },
});

pd.connectAccount({
  app: "${selectedApp.data.nameSlug}",
  onSuccess: ({ id: accountId }) => {
    console.log('🎉 Connection successful!', { accountId });
  },
});`}
        />
      </div>
      <div className="mt-8">
        <p className="text-subtitle">Option 2: Connect Link</p>
        <div className="text-body">
          <span>Give your users a link to connect their account when you can&apos;t run JavaScript / iFrames. </span>
          <ExternalLink href="https://pipedream.com/docs/connect/connect-link">See the docs</ExternalLink>
          <span> or learn how </span>
          <ExternalLink href="https://pipedream.com/docs/connect/mcp/developers">Pipedream&apos;s MCP server</ExternalLink>
          <span> uses Connect Link URLs in chat interfaces.</span>
        </div>
        {connectLinkUrl && (
          <a
            href={`${connectLinkUrl}&app=${selectedApp.data.nameSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono hover:underline text-blue-600 block mt-2 break-all"
          >
            {connectLinkUrl}&app={selectedApp.data.nameSlug}
          </a>
        )}
      </div>
    </div>
  );
}
