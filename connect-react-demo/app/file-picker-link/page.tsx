"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FrontendClientProvider,
  useFrontendClient,
  ConfigureFilePicker,
  type FilePickerItem,
} from "@pipedream/connect-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { validateConnectToken } from "../actions/backendClient";
import { queryClient, createClient } from "@/lib/frontend-client";

type FlowState = "init" | "picking" | "error";

function FilePickerLinkFlow() {
  const searchParams = useSearchParams();
  const client = useFrontendClient();

  const token = searchParams.get("token") || "";
  const app = searchParams.get("app") || "sharepoint";
  const externalUserId = searchParams.get("externalUserId") || "";
  const callbackUri = searchParams.get("callbackUri") || "";
  const initialAccountId = searchParams.get("accountId") || null;

  const [flowState, setFlowState] = useState<FlowState>("init");
  const [accountId, setAccountId] = useState<string | null>(initialAccountId);
  const successRedirectUriRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate required params
  const missingParams: string[] = [];
  if (!externalUserId) missingParams.push("externalUserId");
  if (!callbackUri) missingParams.push("callbackUri");
  if (!app) missingParams.push("app");
  if (!token) missingParams.push("token");

  const startConnect = () => {
    client.connectAccount({
      app,
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

    // If we already have an accountId, go straight to picking
    if (accountId) {
      setFlowState("picking");
    }

    validateConnectToken({ token, appId: app })
      .then((res) => {
        if (res.error || !res.success) {
          setError(res.error || "Token validation failed");
          setFlowState("error");
          return;
        }
        if (res.successRedirectUri) {
          successRedirectUriRef.current = res.successRedirectUri;
        }
        // If no accountId, show connect overlay
        if (!accountId) {
          startConnect();
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Token validation failed");
        setFlowState("error");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = async (items: FilePickerItem[], configuredProps: Record<string, unknown>) => {
    const selectedFiles = items.map((item) => ({
      id: item.id,
      label: item.label,
      value: item.value,
      isFolder: item.isFolder,
      size: item.size,
    }));

    try {
      const resp = await fetch(callbackUri, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedFiles,
          configuredProps,
          accountId,
          app,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Callback failed with status ${resp.status}`);
      }

      if (successRedirectUriRef.current) {
        window.location.href = successRedirectUriRef.current;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit selection");
      setFlowState("error");
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
              componentKey={`${app}-select-files`}
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
  const externalUserId = searchParams.get("externalUserId") || "";

  const client = useMemo(() => {
    if (!externalUserId) return null;
    return createClient(externalUserId);
  }, [externalUserId]);

  if (!client) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>!</div>
          <h2 style={styles.heading}>Missing externalUserId</h2>
          <p style={styles.text}>The <code style={styles.code}>externalUserId</code> URL parameter is required.</p>
        </div>
      </div>
    );
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
    maxWidth: "600px",
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
