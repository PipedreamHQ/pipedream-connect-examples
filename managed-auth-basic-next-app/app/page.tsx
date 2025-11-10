import { randomUUID } from "crypto";
import { ConnectDocs } from "./_components/ConnectDocs";
import { ConnectWorkspace } from "./_components/ConnectWorkspace";
import { serverConnectTokenCreate } from "./server";
import type { ConnectContext } from "./types";

const docsConnect = "https://pipedream.com/docs/connect/";
const docsTokenCreate = "https://pipedream.com/docs/connect/managed-auth/tokens";
const frontendSDKDocs = "https://pipedream.com/docs/connect/api-reference/sdks#browser-usage";
const accountsDocsUrl = "https://pipedream.com/docs/connect/api-reference/list-accounts";

export default async function Home() {
  const envExternalUserId = process.env.NEXT_PUBLIC_PIPEDREAM_EXTERNAL_USER_ID;
  const externalUserId = envExternalUserId || randomUUID();
  const tokenResponse = await serverConnectTokenCreate({ externalUserId });

  const initialContext: ConnectContext = {
    externalUserId,
    token: tokenResponse.token,
    connectLinkUrl: tokenResponse.connectLinkUrl ?? null,
    expiresAt: tokenResponse.expiresAt,
  };

  return (
    <main className="p-4 md:p-8 flex flex-col gap-2 max-w-6xl mb-48 mx-auto w-full">
      <ConnectDocs externalUserId={externalUserId} docsConnectUrl={docsConnect} docsTokenUrl={docsTokenCreate} />
      <ConnectWorkspace
        initialContext={initialContext}
        docs={{ frontendSdk: frontendSDKDocs, accountsApi: accountsDocsUrl }}
        projectId={process.env.NEXT_PUBLIC_PIPEDREAM_PROJECT_ID}
      />
    </main>
  );
}
