"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  FrontendClientProvider,
  CustomizeProvider,
  FilePickerModal,
  ConfigureFilePicker,
  FilePickerIframe,
  useAccounts,
  type FileItem,
  type FilePickerItem,
  type ProxyRequestOptions,
} from "@pipedream/connect-react";
import {
  createFrontendClient,
  type PipedreamEnvironment,
  type ProjectEnvironment,
} from "@pipedream/sdk/browser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fetchToken, proxyRequest, type FetchTokenOpts } from "../actions/backendClient";

const queryClient = new QueryClient();

// Wrap the server action to defer it from React's render phase.
const deferredTokenCallback = (opts: FetchTokenOpts) => {
  return new Promise<Awaited<ReturnType<typeof fetchToken>>>((resolve, reject) => {
    setTimeout(() => {
      fetchToken(opts).then(resolve, reject);
    }, 0);
  });
};

function AccountSelector({
  externalUserId,
  selectedAccountId,
  onSelectAccount,
  onConnectNew,
}: {
  externalUserId: string;
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string) => void;
  onConnectNew: () => void;
}) {
  const { accounts, isLoading } = useAccounts({
    app: "sharepoint",
    external_user_id: externalUserId,
  });

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
        onClick={onConnectNew}
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
}

function NativeSharePointPicker() {
  const [selectedFiles, setSelectedFiles] = useState<NativePickerFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const portRef = useRef<MessagePort | null>(null);
  const channelIdRef = useRef<string>("");
  const messageHandlerRef = useRef<((e: MessageEvent) => void) | null>(null);

  // Get config from env vars
  const accessToken = process.env.NEXT_PUBLIC_SHAREPOINT_ACCESS_TOKEN;
  // Base URL: https://tenant.sharepoint.com (not a specific site)
  const sharepointBaseUrl = process.env.NEXT_PUBLIC_SHAREPOINT_BASE_URL;

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

  const openNativePicker = useCallback(() => {
    if (!accessToken || !sharepointBaseUrl) {
      setError("Missing NEXT_PUBLIC_SHAREPOINT_ACCESS_TOKEN or NEXT_PUBLIC_SHAREPOINT_BASE_URL");
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
      // Log ALL messages for debugging
      console.log("[NativePicker] Raw message event:", {
        origin: event.origin,
        data: event.data,
        source: event.source === popup ? "popup" : "other",
        ports: event.ports?.length || 0,
      });

      if (event.source !== popup) {
        console.log("[NativePicker] Ignoring message from non-popup source");
        return;
      }

      const message = event.data;
      console.log("[NativePicker] Message received:", message);

      // Handle initialization
      if (message.type === "initialize" && message.channelId === channelIdRef.current) {
        console.log("[NativePicker] Initializing port communication");
        const port = event.ports[0];
        portRef.current = port;

        port.addEventListener("message", (portEvent: MessageEvent) => {
          const payload = portEvent.data;
          console.log("[NativePicker] Port message:", payload);

          if (payload.type === "command") {
            const command = payload.data;

            // Acknowledge command
            port.postMessage({ type: "acknowledge", id: payload.id });

            switch (command.command) {
              case "authenticate":
                console.log("[NativePicker] Auth requested for:", command.resource);
                port.postMessage({
                  type: "result",
                  id: payload.id,
                  data: { result: "token", token: accessToken },
                });
                break;

              case "pick":
                console.log("[NativePicker] Files picked:", command.items);
                setSelectedFiles(command.items || []);
                port.postMessage({
                  type: "result",
                  id: payload.id,
                  data: { result: "success" },
                });
                popup.close();
                setIsPickerOpen(false);
                break;

              case "close":
                console.log("[NativePicker] Closed");
                popup.close();
                setIsPickerOpen(false);
                break;

              default:
                console.log("[NativePicker] Unknown command:", command.command);
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
  }, [accessToken, sharepointBaseUrl]);

  const hasConfig = accessToken && sharepointBaseUrl;

  return (
    <div style={{ padding: "24px", maxWidth: "600px" }}>
      <h1 style={{ marginBottom: "8px", fontSize: "1.5rem" }}>
        Native SharePoint Picker
      </h1>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        Microsoft&apos;s native file picker UI (v8) - requires a <strong>SharePoint-audience</strong> token.
      </p>
      <div style={{
        padding: "12px 16px",
        backgroundColor: "#fef3c7",
        border: "1px solid #f59e0b",
        borderRadius: "6px",
        marginBottom: "20px",
        fontSize: "13px",
      }}>
        <strong>Note:</strong> The token must have <code>aud: &quot;https://tenant.sharepoint.com&quot;</code>,
        not Graph (<code>00000003-0000-0000-c000-000000000000</code>).
        Request token with scope <code>https://tenant.sharepoint.com/.default</code>.
      </div>

      {/* Config Status */}
      <div style={{
        padding: "20px",
        border: "1px solid #e5e5e5",
        borderRadius: "8px",
        marginBottom: "20px",
        backgroundColor: hasConfig ? "#f0fff4" : "#fff5f5",
      }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
          Configuration
        </h2>
        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px" }}>
          <li style={{ color: accessToken ? "green" : "red" }}>
            NEXT_PUBLIC_SHAREPOINT_ACCESS_TOKEN: {accessToken ? "Set" : "Missing"}
          </li>
          <li style={{ color: sharepointBaseUrl ? "green" : "red" }}>
            NEXT_PUBLIC_SHAREPOINT_BASE_URL: {sharepointBaseUrl || "Missing"}
          </li>
        </ul>
        {!hasConfig && (
          <p style={{ marginTop: "12px", fontSize: "13px", color: "#666" }}>
            Add these to your .env.local file to test the native picker.
          </p>
        )}
      </div>

      {/* Picker Trigger */}
      <div style={{
        padding: "20px",
        border: "1px solid #e5e5e5",
        borderRadius: "8px",
        marginBottom: "20px",
        backgroundColor: hasConfig ? "#fafafa" : "#f5f5f5",
        opacity: hasConfig ? 1 : 0.6,
      }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
          Open Native Picker
        </h2>
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
        {error && (
          <p style={{ marginTop: "8px", fontSize: "13px", color: "red" }}>
            {error}
          </p>
        )}
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          backgroundColor: "#f0f9ff",
        }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
            Selected Files ({selectedFiles.length})
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {selectedFiles.map((file) => (
              <li
                key={file.id}
                style={{
                  padding: "10px 12px",
                  backgroundColor: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  marginBottom: "8px",
                }}
              >
                <strong>{file.name}</strong>
                <br />
                <small style={{ color: "#666" }}>
                  {file.size ? formatSize(file.size) : "File"}
                </small>
              </li>
            ))}
          </ul>

          <details style={{ marginTop: "12px" }}>
            <summary style={{ cursor: "pointer", color: "#666", fontSize: "13px" }}>
              View raw data
            </summary>
            <pre style={{
              marginTop: "8px",
              padding: "12px",
              backgroundColor: "#fff",
              borderRadius: "6px",
              overflow: "auto",
              fontSize: "12px",
              border: "1px solid #e5e5e5",
            }}>
              {JSON.stringify(selectedFiles, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

// ============================================
// Configure-Based File Picker (Hybrid)
// ============================================

function ConfigureFilePickerDemo({ externalUserId }: { externalUserId: string }) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FilePickerItem[]>([]);
  const [configuredProps, setConfiguredProps] = useState<Record<string, unknown> | null>(null);
  const client = useMemo(() => {
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
  }, [externalUserId]);

  const handleConnectNew = async () => {
    try {
      const result = await client.connectAccount({
        app: "sharepoint",
      });
      if (result?.id) {
        setSelectedAccountId(result.id);
      }
    } catch (e) {
      console.error("Failed to connect account:", e);
    }
  };

  const handleSelect = (items: FilePickerItem[], props: Record<string, unknown>) => {
    console.log("Selected items:", items);
    console.log("Configured props:", props);
    setSelectedFiles(items);
    setConfiguredProps(props);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "600px" }}>
      <h1 style={{ marginBottom: "8px", fontSize: "1.5rem" }}>Configure-Based Picker</h1>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        Uses SDK&apos;s <code>/configure</code> endpoint to fetch options. Reuses existing component prop definitions.
      </p>

      {/* Account Selection */}
      <div style={{
        padding: "20px",
        border: "1px solid #e5e5e5",
        borderRadius: "8px",
        marginBottom: "20px",
        backgroundColor: "#fafafa",
      }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
          1. Connect Account
        </h2>
        <AccountSelector
          externalUserId={externalUserId}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          onConnectNew={handleConnectNew}
        />
      </div>

      {/* File Picker */}
      {selectedAccountId && (
        <div style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          marginBottom: "20px",
          backgroundColor: "#fafafa",
        }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
            2. Browse & Select Files
          </h2>
          <CustomizeProvider>
            <ConfigureFilePicker
              componentKey="~/sharepoint-select-file"
              app="sharepoint"
              accountId={selectedAccountId}
              externalUserId={externalUserId}
              onSelect={handleSelect}
              confirmText="Select Files"
              cancelText="Clear"
              multiSelect={true}
              selectFolders={true}
              selectFiles={true}
            />
          </CustomizeProvider>
        </div>
      )}

      {!selectedAccountId && (
        <div style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          marginBottom: "20px",
          backgroundColor: "#f5f5f5",
          opacity: 0.6,
        }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
            2. Browse & Select Files
          </h2>
          <p style={{ color: "#999", margin: 0, fontSize: "13px" }}>
            Connect an account first to browse files.
          </p>
        </div>
      )}

      {/* Selected Files Display */}
      {selectedFiles.length > 0 && (
        <div style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          backgroundColor: "#f0f9ff",
          marginBottom: "20px",
        }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
            Selected Files ({selectedFiles.length})
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {selectedFiles.map((file) => (
              <li
                key={file.id}
                style={{
                  padding: "10px 12px",
                  backgroundColor: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  marginBottom: "8px",
                }}
              >
                <strong>{file.label}</strong>
              </li>
            ))}
          </ul>

          <details style={{ marginTop: "12px" }}>
            <summary style={{ cursor: "pointer", color: "#666", fontSize: "13px" }}>
              View selected items
            </summary>
            <pre style={{
              marginTop: "8px",
              padding: "12px",
              backgroundColor: "#fff",
              borderRadius: "6px",
              overflow: "auto",
              fontSize: "12px",
              border: "1px solid #e5e5e5",
            }}>
              {JSON.stringify(selectedFiles, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Configured Props Display */}
      {configuredProps && (
        <div style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          backgroundColor: "#fefce8",
        }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
            Configured Props (for persistence)
          </h2>
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
            Store this JSON to restore the selection later.
          </p>
          <pre style={{
            padding: "12px",
            backgroundColor: "#fff",
            borderRadius: "6px",
            overflow: "auto",
            fontSize: "12px",
            border: "1px solid #e5e5e5",
          }}>
            {JSON.stringify(configuredProps, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ============================================
// Pipedream Custom File Picker
// ============================================

function PipedreamFilePickerDemo({ externalUserId }: { externalUserId: string }) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const client = useMemo(() => {
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
  }, [externalUserId]);

  // Create a proxy request function that uses the server action
  const handleProxyRequest = useCallback(
    async (opts: ProxyRequestOptions) => {
      if (!selectedAccountId) {
        throw new Error("No account selected");
      }
      const result = await proxyRequest({
        externalUserId,
        accountId: selectedAccountId,
        url: opts.url,
        method: opts.method || "GET",
        data: opts.body,
        headers: opts.headers,
      });
      return result.data;
    },
    [externalUserId, selectedAccountId]
  );

  const handleConnectNew = async () => {
    try {
      const result = await client.connectAccount({
        app: "sharepoint",
      });
      // result is undefined if user closes the modal without connecting
      if (result?.id) {
        setSelectedAccountId(result.id);
      }
    } catch (e) {
      console.error("Failed to connect account:", e);
    }
  };

  const handleSelect = (items: FileItem[]) => {
    console.log("Selected items:", items);
    setSelectedFiles(items);
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "600px" }}>
      <h1 style={{ marginBottom: "8px", fontSize: "1.5rem" }}>Pipedream File Picker</h1>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        Custom file picker UI with Pipedream Connect for account management.
      </p>

      {/* Account Selection */}
      <div style={{
        padding: "20px",
        border: "1px solid #e5e5e5",
        borderRadius: "8px",
        marginBottom: "20px",
        backgroundColor: "#fafafa",
      }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
          1. Connect Account
        </h2>
        <AccountSelector
          externalUserId={externalUserId}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          onConnectNew={handleConnectNew}
        />
      </div>

      {/* File Picker Trigger */}
      <div style={{
        padding: "20px",
        border: "1px solid #e5e5e5",
        borderRadius: "8px",
        marginBottom: "20px",
        backgroundColor: selectedAccountId ? "#fafafa" : "#f5f5f5",
        opacity: selectedAccountId ? 1 : 0.6,
      }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
          2. Select Files
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedAccountId}
          style={{
            padding: "12px 24px",
            backgroundColor: selectedAccountId ? "#0066cc" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: selectedAccountId ? "pointer" : "not-allowed",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Browse Files
        </button>
        {!selectedAccountId && (
          <p style={{ marginTop: "8px", fontSize: "13px", color: "#999" }}>
            Please connect an account first
          </p>
        )}
      </div>

      {/* Selected Files Display */}
      {selectedFiles.length > 0 && (
        <div style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          backgroundColor: "#f0f9ff",
        }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
            Selected Files ({selectedFiles.length})
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {selectedFiles.map((file) => (
              <li
                key={file.id}
                style={{
                  padding: "10px 12px",
                  backgroundColor: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div>
                  <strong style={{ display: "block" }}>{file.name}</strong>
                  <small style={{ color: "#666" }}>
                    {file.type} {file.size ? `• ${formatSize(file.size)}` : ""}
                  </small>
                </div>
              </li>
            ))}
          </ul>

          <details style={{ marginTop: "12px" }}>
            <summary style={{ cursor: "pointer", color: "#666", fontSize: "13px" }}>
              View raw data
            </summary>
            <pre style={{
              marginTop: "8px",
              padding: "12px",
              backgroundColor: "#fff",
              borderRadius: "6px",
              overflow: "auto",
              fontSize: "12px",
              border: "1px solid #e5e5e5",
            }}>
              {JSON.stringify(selectedFiles, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* File Picker Modal */}
      {selectedAccountId && (
        <CustomizeProvider>
          <FilePickerModal
            isOpen={isModalOpen}
            title="Select SharePoint Files"
            app="sharepoint"
            accountId={selectedAccountId}
            externalUserId={externalUserId}
            proxyRequest={handleProxyRequest}
            onSelect={handleSelect}
            onCancel={handleCancel}
            multiSelect={true}
            selectFiles={true}
            selectFolders={true}
            rootLabel="SharePoint"
            confirmText="Select Files"
            cancelText="Cancel"
          />
        </CustomizeProvider>
      )}
    </div>
  );
}

// ============================================
// Iframe-Based File Picker
// ============================================

function IframeFilePickerDemo({ externalUserId }: { externalUserId: string }) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FilePickerItem[]>([]);
  const [configuredProps, setConfiguredProps] = useState<Record<string, unknown> | null>(null);

  const frontendHost = process.env.NEXT_PUBLIC_PIPEDREAM_FRONTEND_HOST || "pipedream.com";
  const apiHost = process.env.NEXT_PUBLIC_PIPEDREAM_API_HOST;
  const environment = process.env.NEXT_PUBLIC_PIPEDREAM_ENVIRONMENT as PipedreamEnvironment || undefined;
  const projectEnvironment = process.env.NEXT_PUBLIC_PIPEDREAM_PROJECT_ENVIRONMENT as ProjectEnvironment || "development";
  const projectId = process.env.NEXT_PUBLIC_PIPEDREAM_PROJECT_ID || "";

  const client = useMemo(() => {
    return createFrontendClient({
      ...(frontendHost && { frontendHost }),
      ...(apiHost && { apiHost }),
      ...(environment && { environment }),
      ...(projectEnvironment && { projectEnvironment }),
      tokenCallback: deferredTokenCallback,
      externalUserId,
    });
  }, [externalUserId, frontendHost, apiHost, environment, projectEnvironment]);

  // Fetch a connect token when we need to open the picker
  const fetchConnectToken = useCallback(async () => {
    try {
      const tokenResponse = await deferredTokenCallback({ externalUserId });
      setConnectToken(tokenResponse.token);
      return tokenResponse.token;
    } catch (e) {
      console.error("Failed to fetch token:", e);
      return null;
    }
  }, [externalUserId]);

  const handleConnectNew = async () => {
    try {
      const result = await client.connectAccount({
        app: "sharepoint",
      });
      if (result?.id) {
        setSelectedAccountId(result.id);
      }
    } catch (e) {
      console.error("Failed to connect account:", e);
    }
  };

  const handleOpenPicker = async () => {
    // Fetch a fresh token before opening the picker
    const token = await fetchConnectToken();
    if (token) {
      setIsPickerOpen(true);
    }
  };

  const handleSelect = (items: FilePickerItem[], props: Record<string, unknown>) => {
    console.log("[IframePicker] Selected items:", items);
    console.log("[IframePicker] Configured props:", props);
    setSelectedFiles(items);
    setConfiguredProps(props);
    setIsPickerOpen(false);
  };

  const handleCancel = () => {
    console.log("[IframePicker] Cancelled");
    setIsPickerOpen(false);
  };

  const handleError = (message: string) => {
    console.error("[IframePicker] Error:", message);
    setIsPickerOpen(false);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "600px" }}>
      <h1 style={{ marginBottom: "8px", fontSize: "1.5rem" }}>Iframe File Picker</h1>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        File picker rendered in an iframe from <code>frontend-next</code>. Framework-agnostic.
      </p>

      {/* Account Selection */}
      <div style={{
        padding: "20px",
        border: "1px solid #e5e5e5",
        borderRadius: "8px",
        marginBottom: "20px",
        backgroundColor: "#fafafa",
      }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
          1. Connect Account
        </h2>
        <AccountSelector
          externalUserId={externalUserId}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          onConnectNew={handleConnectNew}
        />
      </div>

      {/* File Picker Trigger */}
      <div style={{
        padding: "20px",
        border: "1px solid #e5e5e5",
        borderRadius: "8px",
        marginBottom: "20px",
        backgroundColor: selectedAccountId ? "#fafafa" : "#f5f5f5",
        opacity: selectedAccountId ? 1 : 0.6,
      }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
          2. Select Files
        </h2>
        <button
          onClick={handleOpenPicker}
          disabled={!selectedAccountId}
          style={{
            padding: "12px 24px",
            backgroundColor: selectedAccountId ? "#7c3aed" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: selectedAccountId ? "pointer" : "not-allowed",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Open Iframe Picker
        </button>
        {!selectedAccountId && (
          <p style={{ marginTop: "8px", fontSize: "13px", color: "#999" }}>
            Please connect an account first
          </p>
        )}
      </div>

      {/* Iframe Modal */}
      {isPickerOpen && connectToken && selectedAccountId && projectId && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
        }}>
          <FilePickerIframe
            token={connectToken}
            app="sharepoint"
            accountId={selectedAccountId}
            externalUserId={externalUserId}
            componentKey="~/sharepoint-select-file"
            projectId={projectId}
            projectEnvironment={projectEnvironment}
            onSelect={handleSelect}
            onCancel={handleCancel}
            onError={handleError}
            multiSelect={true}
            selectFolders={true}
            selectFiles={true}
            frontendHost={frontendHost}
          />
        </div>
      )}

      {/* Selected Files Display */}
      {selectedFiles.length > 0 && (
        <div style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          backgroundColor: "#f0f9ff",
          marginBottom: "20px",
        }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
            Selected Files ({selectedFiles.length})
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {selectedFiles.map((file) => (
              <li
                key={file.id}
                style={{
                  padding: "10px 12px",
                  backgroundColor: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  marginBottom: "8px",
                }}
              >
                <strong>{file.label}</strong>
              </li>
            ))}
          </ul>

          <details style={{ marginTop: "12px" }}>
            <summary style={{ cursor: "pointer", color: "#666", fontSize: "13px" }}>
              View selected items
            </summary>
            <pre style={{
              marginTop: "8px",
              padding: "12px",
              backgroundColor: "#fff",
              borderRadius: "6px",
              overflow: "auto",
              fontSize: "12px",
              border: "1px solid #e5e5e5",
            }}>
              {JSON.stringify(selectedFiles, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Configured Props Display */}
      {configuredProps && (
        <div style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          backgroundColor: "#fefce8",
        }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
            Configured Props (for persistence)
          </h2>
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
            Store this JSON to restore the selection later.
          </p>
          <pre style={{
            padding: "12px",
            backgroundColor: "#fff",
            borderRadius: "6px",
            overflow: "auto",
            fontSize: "12px",
            border: "1px solid #e5e5e5",
          }}>
            {JSON.stringify(configuredProps, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function FilePickerPage() {
  const externalUserId = process.env.NEXT_PUBLIC_EXTERNAL_USER_ID || "file-picker-test-user";
  const frontendHost = process.env.NEXT_PUBLIC_PIPEDREAM_FRONTEND_HOST;
  const apiHost = process.env.NEXT_PUBLIC_PIPEDREAM_API_HOST;
  const environment = process.env.NEXT_PUBLIC_PIPEDREAM_ENVIRONMENT as PipedreamEnvironment || undefined;
  const projectEnvironment = process.env.NEXT_PUBLIC_PIPEDREAM_PROJECT_ENVIRONMENT as ProjectEnvironment;

  const client = useMemo(() => {
    return createFrontendClient({
      ...(frontendHost && { frontendHost }),
      ...(apiHost && { apiHost }),
      ...(environment && { environment }),
      ...(projectEnvironment && { projectEnvironment }),
      tokenCallback: deferredTokenCallback,
      externalUserId,
    });
  }, [externalUserId, frontendHost, apiHost, environment, projectEnvironment]);

  return (
    <QueryClientProvider client={queryClient}>
      <FrontendClientProvider client={client}>
        <div style={{
          display: "flex",
          gap: "20px",
          padding: "20px",
          maxWidth: "2100px",
          margin: "0 auto",
          flexWrap: "wrap",
        }}>
          {/* Left: Pipedream Custom Picker (Proxy-based) */}
          <div style={{
            flex: "1 1 400px",
            borderRight: "1px solid #e5e5e5",
            paddingRight: "20px",
            minWidth: "350px",
          }}>
            <div style={{
              display: "inline-block",
              padding: "4px 12px",
              backgroundColor: "#e0f2fe",
              color: "#0369a1",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 500,
              marginBottom: "8px",
            }}>
              Custom UI (Proxy)
            </div>
            <PipedreamFilePickerDemo externalUserId={externalUserId} />
          </div>

          {/* Middle: Configure-Based Picker (Hybrid) */}
          <div style={{
            flex: "1 1 400px",
            borderRight: "1px solid #e5e5e5",
            paddingRight: "20px",
            minWidth: "350px",
          }}>
            <div style={{
              display: "inline-block",
              padding: "4px 12px",
              backgroundColor: "#dcfce7",
              color: "#166534",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 500,
              marginBottom: "8px",
            }}>
              Hybrid (Configure API)
            </div>
            <ConfigureFilePickerDemo externalUserId={externalUserId} />
          </div>

          {/* Iframe File Picker */}
          <div style={{
            flex: "1 1 400px",
            borderRight: "1px solid #e5e5e5",
            paddingRight: "20px",
            minWidth: "350px",
          }}>
            <div style={{
              display: "inline-block",
              padding: "4px 12px",
              backgroundColor: "#f3e8ff",
              color: "#7c3aed",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 500,
              marginBottom: "8px",
            }}>
              Iframe (frontend-next)
            </div>
            <IframeFilePickerDemo externalUserId={externalUserId} />
          </div>

          {/* Right: Native Microsoft Picker */}
          <div style={{
            flex: "1 1 400px",
            minWidth: "350px",
          }}>
            <div style={{
              display: "inline-block",
              padding: "4px 12px",
              backgroundColor: "#fef3c7",
              color: "#92400e",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 500,
              marginBottom: "8px",
            }}>
              Native Microsoft UI
            </div>
            <NativeSharePointPicker />
          </div>
        </div>
      </FrontendClientProvider>
    </QueryClientProvider>
  );
}
