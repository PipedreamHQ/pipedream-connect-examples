"use client";

import { ExternalLink } from "./ExternalLink";

interface ConnectDocsProps {
  externalUserId: string;
  docsConnectUrl: string;
  docsTokenUrl: string;
}

export function ConnectDocs({ externalUserId, docsConnectUrl, docsTokenUrl }: ConnectDocsProps) {
  return (
    <>
      <h1 className="text-title mb-8">Pipedream Connect: Managed Auth Demo App</h1>
      <div className="mb-4 text-body">
        <p className="mb-4">
          Refer to the <ExternalLink href={docsConnectUrl}>Pipedream Connect docs</ExternalLink> for a full walkthrough of how to configure
          Connect for your app.
        </p>
        <p>
          When your customers connect accounts with Pipedream, pass their unique user ID from your system. In this example,
          we generated a random external user ID for you:
          <span className="text-code font-bold"> {externalUserId}</span>.
        </p>
      </div>
      <div className="border border-b mb-4" />
      <div className="mb-8">
        <p className="text-body">
          In <code>server.ts</code>, the app calls <code>serverConnectTokenCreate</code> to create a short-lived token for the user. You&apos;ll
          use that token to initiate app connection requests securely.{" "}
          <ExternalLink href={docsTokenUrl}>See the docs</ExternalLink> for more info.
        </p>
      </div>
    </>
  );
}

