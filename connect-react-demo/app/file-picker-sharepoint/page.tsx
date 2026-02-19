"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useStableUuid } from "@/lib/stable-uuid";
import {
  FrontendClientProvider,
  useAccounts,
} from "@pipedream/connect-react";
import { createFrontendClient } from "@pipedream/sdk/browser";
import { QueryClientProvider } from "@tanstack/react-query";
import { getAccountCredentials } from "../actions/backendClient";
import { queryClient, createClient } from "@/lib/frontend-client";

// ============================================
// Shared Styles
// ============================================

const sectionStyle: React.CSSProperties = {
  padding: "20px",
  border: "1px solid #e5e5e5",
  borderRadius: "8px",
  marginBottom: "20px",
  backgroundColor: "#fafafa",
};

const sectionHeadingStyle: React.CSSProperties = {
  margin: "0 0 16px 0",
  fontSize: "1rem",
  fontWeight: 600,
};

const listItemStyle: React.CSSProperties = {
  padding: "10px 12px",
  backgroundColor: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: "6px",
  marginBottom: "6px",
  fontSize: "13px",
};

const resetListStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
};

function disabledSectionStyle(enabled: boolean): React.CSSProperties {
  return {
    ...sectionStyle,
    backgroundColor: enabled ? "#fafafa" : "#f5f5f5",
    opacity: enabled ? 1 : 0.6,
  };
}

// ============================================
// Shared Utilities
// ============================================

function connectAccountPromise(
  client: ReturnType<typeof createFrontendClient>,
  opts: {
    app: string;
    oauthAppId?: string;
    hideClose?: boolean;
    onSuccess: (id: string) => void;
    onError: (message: string) => void;
  },
): Promise<void> {
  return new Promise<void>((resolve) => {
    client.connectAccount({
      app: opts.app,
      ...(opts.oauthAppId && { oauthAppId: opts.oauthAppId }),
      ...(opts.hideClose && { hideClose: true }),
      onSuccess: ({ id }) => {
        opts.onSuccess(id);
        resolve();
      },
      onError: (err) => {
        opts.onError(err instanceof Error ? err.message : "Failed to connect account");
        resolve();
      },
      onClose: ({ successful }) => {
        if (!successful) resolve();
      },
    });
  });
}

// ============================================
// Shared Components
// ============================================

// Copy button component for JSON displays
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy to clipboard"}
      style={{
        padding: "6px",
        backgroundColor: copied ? "#10b981" : "#f3f4f6",
        color: copied ? "white" : "#6b7280",
        border: "1px solid #d1d5db",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

// JSON display with copy button
function JsonDisplay({ data, maxHeight = "300px" }: { data: unknown; maxHeight?: string }) {
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: "8px", right: "8px", zIndex: 1 }}>
        <CopyButton text={jsonString} />
      </div>
      <pre style={{
        marginTop: "8px",
        padding: "12px",
        paddingTop: "36px",
        backgroundColor: "#fff",
        borderRadius: "6px",
        overflow: "auto",
        fontSize: "12px",
        border: "1px solid #e5e5e5",
        maxHeight,
      }}>
        {jsonString}
      </pre>
    </div>
  );
}

function AccountSelector({
  externalUserId,
  selectedAccountId,
  onSelectAccount,
  onConnectNew,
  app = "sharepoint_admin",
}: {
  externalUserId: string;
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string) => void;
  onConnectNew: () => Promise<void>;
  app?: string;
}) {
  const { accounts, isLoading, refetch } = useAccounts({
    app,
    external_user_id: externalUserId,
  });

  const handleConnectNew = async () => {
    await onConnectNew();
    // Refetch accounts list after connecting
    refetch();
  };

  if (isLoading) {
    return <div style={{ padding: "8px 0", color: "#666" }}>Loading accounts...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {accounts.length > 0 ? (
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
            Select Account:
          </label>
          <select
            value={selectedAccountId || ""}
            onChange={(e) => onSelectAccount(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: "#fff",
            }}
          >
            <option value="">Choose an account...</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name || account.id}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p style={{ color: "#666", margin: 0 }}>No SharePoint accounts connected yet.</p>
      )}

      <button
        onClick={handleConnectNew}
        style={{
          padding: "10px 16px",
          backgroundColor: "#f5f5f5",
          border: "1px solid #ddd",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        + Connect New SharePoint Account
      </button>
    </div>
  );
}

// ============================================
// Native SharePoint File Picker (Microsoft v8)
// ============================================

interface NativePickerFile {
  id: string;
  name: string;
  size?: number;
  webUrl?: string;
  parentReference?: {
    driveId: string;
  };
  "@sharePoint.endpoint"?: string;
  file?: { mimeType: string };
  folder?: object;
  downloadUrl?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function NativeSharePointPicker({
  externalUserId,
  client,
}: {
  externalUserId: string;
  client: ReturnType<typeof createFrontendClient>;
}) {
  const [selectedFiles, setSelectedFiles] = useState<NativePickerFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sharepointBaseUrl, setSharepointBaseUrl] = useState<string>("");
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const portRef = useRef<MessagePort | null>(null);
  const channelIdRef = useRef<string>("");
  const messageHandlerRef = useRef<((e: MessageEvent) => void) | null>(null);

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      if (messageHandlerRef.current) {
        window.removeEventListener("message", messageHandlerRef.current);
      }
    };
  }, []);

  // Fetch credentials when account is selected
  useEffect(() => {
    if (!selectedAccountId) {
      setAccessToken(null);
      return;
    }

    const fetchCredentials = async () => {
      setIsLoadingCredentials(true);
      setError(null);
      try {
        const credentials = await getAccountCredentials({
          externalUserId,
          accountId: selectedAccountId,
        });
        const creds = credentials as Record<string, unknown>;

        // Extract oauth_access_token
        const token = creds.oauth_access_token as string;
        if (token) {
          setAccessToken(token);
        } else {
          setError("No access token found in credentials");
          return;
        }

        // Extract tenant_name and construct SharePoint URL
        const tenantName = creds.tenant_name as string;
        if (tenantName) {
          setSharepointBaseUrl(`https://${tenantName}.sharepoint.com`);
        }
      } catch (e) {
        console.error("Failed to fetch credentials:", e);
        setError(e instanceof Error ? e.message : "Failed to fetch credentials");
      } finally {
        setIsLoadingCredentials(false);
      }
    };

    fetchCredentials();
  }, [selectedAccountId, externalUserId]);

  const handleConnectNew = () =>
    connectAccountPromise(client, {
      app: "microsoft_sharepoint_dev",
      oauthAppId: "oa_49i2rd",
      onSuccess: (id) => setSelectedAccountId(id),
      onError: (msg) => setError(msg),
    });

  // Fetch download URLs for picked files using SharePoint REST API
  const fetchDownloadUrls = useCallback(async (items: NativePickerFile[]): Promise<NativePickerFile[]> => {
    if (!accessToken) return items;

    const results = await Promise.all(
      items.map(async (item) => {
        try {
          // Use the SharePoint endpoint from the item, or construct it
          const endpoint = item["@sharePoint.endpoint"] || `${sharepointBaseUrl}/_api/v2.0`;
          const driveId = item.parentReference?.driveId;

          if (!driveId) {
            console.warn("[NativePicker] No driveId for item:", item.name);
            return item;
          }

          const url = `${endpoint}/drives/${driveId}/items/${item.id}`;

          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          });

          if (!response.ok) {
            console.error("[NativePicker] Failed to fetch item details:", response.status, response.statusText);
            return item;
          }

          const data = await response.json();

          // The download URL is typically in @content.downloadUrl or @microsoft.graph.downloadUrl
          const downloadUrl = data["@content.downloadUrl"] || data["@microsoft.graph.downloadUrl"];

          return {
            ...item,
            downloadUrl,
          };
        } catch (err) {
          console.error("[NativePicker] Error fetching download URL for:", item.name, err);
          return item;
        }
      })
    );

    return results;
  }, [accessToken, sharepointBaseUrl]);

  const openNativePicker = useCallback(() => {
    if (!accessToken || !sharepointBaseUrl) {
      setError("Please connect an account and enter your SharePoint tenant URL");
      return;
    }

    setError(null);
    setIsPickerOpen(true);

    // Generate unique channel ID
    channelIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // v8 Picker configuration
    const pickerConfig = {
      sdk: "8.0",
      entry: {
        sharePoint: {},
      },
      authentication: {},
      messaging: {
        origin: window.location.origin,
        channelId: channelIdRef.current,
      },
      selection: {
        mode: "multiple",
      },
      typesAndSources: {
        mode: "all",
        pivots: {
          oneDrive: true,           // My files
          recent: true,             // Recent files
          shared: true,             // Shared with me
          sharedLibraries: true,    // Quick access / shared libraries
        },
      },
    };

    // Build picker URL
    const queryParams = new URLSearchParams({
      filePicker: JSON.stringify(pickerConfig),
    });
    const pickerUrl = `${sharepointBaseUrl}/_layouts/15/FilePicker.aspx?${queryParams}`;

    // Create a form in the current document and target the popup
    // This avoids cross-origin issues with accessing popup.document
    const popup = window.open("about:blank", "SharePointPicker", "width=1080,height=680");
    if (!popup) {
      setError("Popup blocked. Please allow popups.");
      setIsPickerOpen(false);
      return;
    }
    popupRef.current = popup;

    // Create form in current document, target the popup window
    const form = document.createElement("form");
    form.action = pickerUrl;
    form.method = "POST";
    form.target = "SharePointPicker"; // Target the popup by name

    const tokenInput = document.createElement("input");
    tokenInput.type = "hidden";
    tokenInput.name = "access_token";
    tokenInput.value = accessToken;
    form.appendChild(tokenInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form); // Clean up

    // Message handler for postMessage communication
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== popup) {
        return;
      }

      const message = event.data;

      // Handle initialization
      if (message.type === "initialize" && message.channelId === channelIdRef.current) {
        const port = event.ports[0];
        portRef.current = port;

        port.addEventListener("message", (portEvent: MessageEvent) => {
          const payload = portEvent.data;

          if (payload.type === "command") {
            const command = payload.data;

            // Acknowledge command
            port.postMessage({ type: "acknowledge", id: payload.id });

            switch (command.command) {
              case "authenticate":
                port.postMessage({
                  type: "result",
                  id: payload.id,
                  data: { result: "token", token: accessToken },
                });
                break;

              case "pick":
                // Fetch download URLs for each file
                fetchDownloadUrls(command.items || []).then((filesWithUrls) => {
                  setSelectedFiles(filesWithUrls);
                });
                port.postMessage({
                  type: "result",
                  id: payload.id,
                  data: { result: "success" },
                });
                popup.close();
                setIsPickerOpen(false);
                break;

              case "close":
                popup.close();
                setIsPickerOpen(false);
                break;

              default:
                port.postMessage({
                  type: "result",
                  id: payload.id,
                  data: { result: "error", error: { code: "unsupportedCommand" } },
                });
            }
          }
        });

        port.start();
        port.postMessage({ type: "activate" });
      }
    };

    messageHandlerRef.current = handleMessage;
    window.addEventListener("message", handleMessage);

    // Poll for popup close
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        window.removeEventListener("message", handleMessage);
        setIsPickerOpen(false);
        popupRef.current = null;
        portRef.current = null;
      }
    }, 500);
  }, [accessToken, sharepointBaseUrl, fetchDownloadUrls]);

  const hasConfig = accessToken && sharepointBaseUrl;

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Account Selection */}
      <div style={sectionStyle}>
        <h2 style={sectionHeadingStyle}>1. Connect Account</h2>
        <AccountSelector
          externalUserId={externalUserId}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          onConnectNew={handleConnectNew}
          app="microsoft_sharepoint_dev"
        />
      </div>

      {/* Picker Trigger */}
      <div style={disabledSectionStyle(!!hasConfig)}>
        <h2 style={sectionHeadingStyle}>2. Select Files</h2>
        <button
          onClick={openNativePicker}
          disabled={!hasConfig || isPickerOpen}
          style={{
            padding: "12px 24px",
            backgroundColor: hasConfig && !isPickerOpen ? "#0078d4" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: hasConfig && !isPickerOpen ? "pointer" : "not-allowed",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {isPickerOpen ? "Picker Open..." : "Open Microsoft Picker"}
        </button>
        {!hasConfig && selectedAccountId && !isLoadingCredentials && (
          <p style={{ marginTop: "8px", fontSize: "13px", color: "#999" }}>
            {!accessToken ? "Waiting for credentials..." : "Please enter your SharePoint tenant URL"}
          </p>
        )}
        {error && (
          <p style={{ marginTop: "8px", fontSize: "13px", color: "red" }}>
            {error}
          </p>
        )}
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div style={{ ...sectionStyle, backgroundColor: "#f0f9ff" }}>
          <h2 style={sectionHeadingStyle}>
            Selected Files ({selectedFiles.length})
          </h2>
          <ul style={resetListStyle}>
            {selectedFiles.map((file) => (
              <li key={file.id} style={{ ...listItemStyle, marginBottom: "8px" }}>
                <strong>{file.name}</strong>
                <br />
                <small style={{ color: "#666" }}>
                  {file.size ? formatSize(file.size) : "File"}
                </small>
                {file.downloadUrl && (
                  <div style={{ marginTop: "6px" }}>
                    <a
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#0078d4",
                        fontSize: "13px",
                        textDecoration: "none",
                      }}
                    >
                      Download
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <details style={{ marginTop: "12px" }}>
            <summary style={{ cursor: "pointer", color: "#666", fontSize: "13px" }}>
              View raw data
            </summary>
            <JsonDisplay data={selectedFiles} />
          </details>
        </div>
      )}
    </div>
  );
}

export default function SharePointFilePickerPage() {
  const [externalUserId] = useStableUuid();

  const client = useMemo(() => {
    if (!externalUserId) return null;
    return createClient(externalUserId);
  }, [externalUserId]);

  if (!client) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <FrontendClientProvider client={client}>
        <div style={{
          padding: "20px",
          maxWidth: "800px",
          margin: "0 auto",
        }}>
          <div style={{
            marginBottom: "30px",
            padding: "20px",
            backgroundColor: "#f0f9ff",
            borderRadius: "8px",
            border: "1px solid #bfdbfe",
          }}>
            <h1 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 600, color: "#1e3a8a" }}>
              Native Microsoft SharePoint File Picker
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#3b82f6" }}>
              Microsoft&apos;s native file picker UI (v8) — requires passing the SharePoint OAuth access token from the client browser.
            </p>
          </div>

          <NativeSharePointPicker externalUserId={externalUserId} client={client} />
        </div>
      </FrontendClientProvider>
    </QueryClientProvider>
  );
}
