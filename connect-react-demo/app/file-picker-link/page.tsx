"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FrontendClientProvider,
  useFrontendClient,
  ConfigureFilePicker,
  type FilePickerItem,
} from "@pipedream/connect-react";
import { createFrontendClient } from "@pipedream/sdk/browser";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { validateConnectToken, postToCallback } from "../actions/backendClient";

const queryClient = new QueryClient();

type FlowState = "init" | "picking" | "error";

function FilePickerLinkFlow() {
  const searchParams = useSearchParams();
  const client = useFrontendClient();

  const token = searchParams.get("token") || "";
  const app = searchParams.get("app") || "sharepoint_admin";
  const oauthAppId = searchParams.get("oauthAppId") || undefined;
  const externalUserId = searchParams.get("externalUserId") || "";
  const callbackUri = searchParams.get("callbackUri") || "";
  const initialAccountId = searchParams.get("accountId") || null;

  const [flowState, setFlowState] = useState<FlowState>("init");
  const [accountId, setAccountId] = useState<string | null>(initialAccountId);
  const [error, setError] = useState<string | null>(null);
  const successRedirectUriRef = useRef<string | null>(null);

  // Validate required params
  const missingParams: string[] = [];
  if (!externalUserId) missingParams.push("externalUserId");
  if (!callbackUri) missingParams.push("callbackUri");
  if (!app) missingParams.push("app");
  if (!token) missingParams.push("token");

  const startConnect = () => {
    client.connectAccount({
      app,
      ...(oauthAppId && { oauthAppId }),
      hideClose: true,
      onSuccess: (res) => {
        setAccountId(res.id);
        setFlowState("picking");
      },
      onError: (err) => {
        setError(err.message || "Connection failed");
        setFlowState("error");
      },
    });
  };

  // Validate token and kick off connect or file picker
  useEffect(() => {
    if (missingParams.length > 0) return;

    let mounted = true;

    // Validate to get successRedirectUri (server-side to avoid CORS)
    validateConnectToken({ token, appId: app })
      .then((result) => {
        if (!mounted) return;

        console.log("Token validation result:", result);
        if (result.successRedirectUri) {
          successRedirectUriRef.current = result.successRedirectUri;
          console.log("Success redirect URI set to:", result.successRedirectUri);
        } else {
          console.warn("No successRedirectUri in validation response");
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Token validation failed:", err);
      });

    // Proceed with connect or file picker
    if (accountId) {
      setFlowState("picking");
    } else {
      startConnect();
    }

    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = async (items: FilePickerItem[], configuredProps: Record<string, unknown>) => {
    const selectedFiles = items.map((item) => ({
      name: item.label,
      description: item.description,
      file_id: item.id,
      web_url: item.webUrl,
    }));

    // Fire-and-forget POST to callback via server action (avoids CORS, timing issues)
    postToCallback({
      callbackUri,
      resourceProvider: "sharepoint",
      selectedFiles,
      metadata: {
        skill_id: "TODO",
        agent_id: "TODO",
        external_user_id: externalUserId,
        auth_provision_id: accountId!,
      },
      configuredProps,
    }).catch((err) => {
      // Fire-and-forget - log but don't block redirect
      console.warn("Callback post failed:", err);
    });

    // Redirect immediately without waiting
    if (successRedirectUriRef.current) {
      window.location.href = successRedirectUriRef.current;
    } else {
      console.warn("No success redirect URI configured");
    }
  };

  // Missing params error
  if (missingParams.length > 0) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>!</div>
          <h2 style={styles.heading}>Missing Required Parameters</h2>
          <p style={styles.text}>
            The following URL parameters are required: {missingParams.map((p) => (
              <code key={p} style={styles.code}>{p}</code>
            ))}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (flowState === "error" && error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>!</div>
          <h2 style={styles.heading}>Error</h2>
          <p style={styles.text}>{error}</p>
          <button style={styles.button} onClick={() => { setError(null); startConnect(); }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Picking state — render file picker in a centered modal
  if (flowState === "picking" && accountId) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.modalHeader}>
            <h1 style={styles.modalTitle}>Select Files</h1>
          </div>
          <div style={styles.modalBody}>
            <ConfigureFilePicker
              componentKey={`${app}-retrieve-file-metadata`}
              app={app}
              accountId={accountId}
              externalUserId={externalUserId}
              onSelect={handleSelect}
              confirmText="Select Files"
              multiSelect={true}
              selectFolders={true}
              selectFiles={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // init — blank page while connecting or validating
  return null;
}

function FilePickerLinkWithProviders() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const externalUserId = searchParams.get("externalUserId") || "";

  const client = useMemo(() => {
    if (!externalUserId || !token) return null;
    return createFrontendClient({
      tokenCallback: async () => ({
        token,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour (dummy, token already has real expiry)
      }),
      externalUserId,
    });
  }, [externalUserId, token]);

  if (!token || !externalUserId) {
    const missing = [];
    if (!token) missing.push("token");
    if (!externalUserId) missing.push("externalUserId");
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>!</div>
          <h2 style={styles.heading}>Missing Required Parameters</h2>
          <p style={styles.text}>
            The following URL parameters are required: {missing.map((p) => (
              <code key={p} style={styles.code}>{p}</code>
            ))}
          </p>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <FrontendClientProvider client={client}>
        <FilePickerLinkFlow />
      </FrontendClientProvider>
    </QueryClientProvider>
  );
}

export default function FilePickerLinkPage() {
  return (
    <Suspense fallback={null}>
      <FilePickerLinkWithProviders />
    </Suspense>
  );
}

// ============================================
// Styles
// ============================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
    padding: "20px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "40px",
    textAlign: "center" as const,
    maxWidth: "480px",
    width: "100%",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e5e7eb",
  },
  heading: {
    margin: "16px 0 8px",
    fontSize: "18px",
    fontWeight: 600,
    color: "#111827",
  },
  text: {
    color: "#374151",
    fontSize: "14px",
    lineHeight: "1.5",
    margin: "0 0 16px",
  },
  code: {
    backgroundColor: "#f3f4f6",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "13px",
    fontFamily: "monospace",
    margin: "0 2px",
  },
  button: {
    padding: "10px 24px",
    backgroundColor: "#2684FF",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    marginTop: "16px",
  },
  errorIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: 700,
    margin: "0 auto",
  },
  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    width: "100%",
    maxWidth: "720px",
    height: "min(600px, calc(100vh - 40px))",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  modalHeader: {
    padding: "20px 24px 0",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#111827",
    margin: 0,
  },
  modalBody: {
    padding: "16px 24px 24px",
    overflow: "hidden",
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    minHeight: 0,
  },
};
