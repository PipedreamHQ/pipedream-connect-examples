"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PipedreamClient as FrontendClient } from "@pipedream/sdk/browser";
import type { ConnectContext } from "../types";

const frontendHost = process.env.NEXT_PUBLIC_PIPEDREAM_FRONTEND_HOST || "pipedream.com";
const apiHost = process.env.NEXT_PUBLIC_PIPEDREAM_API_HOST || "api.pipedream.com";

interface RefreshResult {
  token: string;
  expiresAt: Date;
  connectLinkUrl: string | null;
}

export function useConnectToken(initialContext: ConnectContext) {
  const [token, setToken] = useState(initialContext.token);
  const [connectLinkUrl, setConnectLinkUrl] = useState<string | null>(initialContext.connectLinkUrl);
  const [expiresAt, setExpiresAt] = useState<Date>(new Date(initialContext.expiresAt));
  const [client, setClient] = useState<FrontendClient | null>(null);

  const tokenRef = useRef(token);
  const expiresAtRef = useRef(expiresAt);

  useEffect(() => {
    tokenRef.current = token;
    expiresAtRef.current = expiresAt;
  }, [token, expiresAt]);

  const refreshToken = useCallback(async (): Promise<RefreshResult> => {
    const res = await fetch("/api/pipedream/token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ externalUserId: initialContext.externalUserId }),
    });

    if (!res.ok) {
      throw new Error("Failed to refresh connect token");
    }

    const response = await res.json();
    const nextExpiresAt = new Date(response.expiresAt);

    setToken(response.token);
    setConnectLinkUrl(response.connectLinkUrl ?? null);
    setExpiresAt(nextExpiresAt);

    return {
      token: response.token,
      expiresAt: nextExpiresAt,
      connectLinkUrl: response.connectLinkUrl ?? null,
    };
  }, [initialContext.externalUserId]);

  useEffect(() => {
    if (!initialContext.externalUserId || !token || client) {
      return;
    }

    let isMounted = true;

    const loadClient = async () => {
      const { createFrontendClient } = await import("@pipedream/sdk/browser");
      if (!isMounted) return;

      const sdkClient = createFrontendClient({
        frontendHost,
        apiHost,
        externalUserId: initialContext.externalUserId,
        token,
        tokenCallback: async () => {
          const currentToken = tokenRef.current;
          const currentExpiresAt = expiresAtRef.current;

          if (currentToken && currentExpiresAt && currentExpiresAt > new Date()) {
            return { token: currentToken, expiresAt: currentExpiresAt };
          }

          const refreshed = await refreshToken();
          return { token: refreshed.token, expiresAt: refreshed.expiresAt };
        },
      });

      setClient(sdkClient);
    };

    loadClient();

    return () => {
      isMounted = false;
    };
  }, [initialContext.externalUserId, token, client, refreshToken]);

  return {
    client,
    connectLinkUrl,
    refreshToken,
    token,
    expiresAt,
  };
}

