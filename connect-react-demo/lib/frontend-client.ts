import {
  createFrontendClient,
  type PipedreamEnvironment,
  type ProjectEnvironment,
} from "@pipedream/sdk/browser";
import { QueryClient } from "@tanstack/react-query";
import { fetchToken, type FetchTokenOpts } from "@/app/actions/backendClient";

export const queryClient = new QueryClient();

// Wrap the server action to defer it from React's render phase.
export const deferredTokenCallback = (opts: FetchTokenOpts) => {
  return new Promise<Awaited<ReturnType<typeof fetchToken>>>((resolve, reject) => {
    setTimeout(() => {
      fetchToken(opts).then(resolve, reject);
    }, 0);
  });
};

export function createClient(externalUserId: string) {
  const frontendHost = process.env.NEXT_PUBLIC_PIPEDREAM_FRONTEND_HOST;
  const apiHost = process.env.NEXT_PUBLIC_PIPEDREAM_API_HOST;
  const environment = process.env.NEXT_PUBLIC_PIPEDREAM_ENVIRONMENT as PipedreamEnvironment || undefined;
  const projectEnvironment = process.env.NEXT_PUBLIC_PIPEDREAM_PROJECT_ENVIRONMENT as ProjectEnvironment;

  return createFrontendClient({
    ...(frontendHost && { frontendHost }),
    ...(apiHost && { apiHost }),
    ...(environment && { environment }),
    ...(projectEnvironment && { projectEnvironment }),
    tokenCallback: deferredTokenCallback,
    externalUserId,
  });
}
