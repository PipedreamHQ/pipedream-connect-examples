"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  FrontendClientProvider,
  CustomizeProvider,
  ConfigureFilePickerModal,
  useAccounts,
  type FilePickerItem,
} from "@pipedream/connect-react";
import {
  createFrontendClient,
  type PipedreamEnvironment,
  type ProjectEnvironment,
} from "@pipedream/sdk/browser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fetchToken, type FetchTokenOpts } from "../actions/backendClient";

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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
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

// Theme presets for demonstration
const themePresets = {
  light: {
    primary: "#2684FF",
    primary25: "#DEEBFF",
    neutral0: "#ffffff",
    neutral5: "#f2f2f2",
    neutral10: "#e6e6e6",
    neutral80: "#333333",
  },
  dark: {
    primary: "#60a5fa",
    primary25: "#1e3a5f",
    neutral0: "#1f2937",
    neutral5: "#374151",
    neutral10: "#4b5563",
    neutral20: "#6b7280",
    neutral30: "#9ca3af",
    neutral40: "#d1d5db",
    neutral50: "#e5e7eb",
    neutral60: "#f3f4f6",
    neutral80: "#f9fafb",
  },
};

function ConfigureFilePickerDemo({ externalUserId }: { externalUserId: string }) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FilePickerItem[]>([]);
  const [configuredProps, setConfiguredProps] = useState<Record<string, unknown> | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof themePresets | "custom">("light");
  const [customPrimaryColor, setCustomPrimaryColor] = useState("#2684FF");
  const [actionResult, setActionResult] = useState<Record<string, unknown> | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const currentTheme = useMemo(() => {
    if (selectedTheme === "custom") {
      return {
        colors: {
          ...themePresets.light,
          primary: customPrimaryColor,
        },
      };
    }
    return { colors: themePresets[selectedTheme] };
  }, [selectedTheme, customPrimaryColor]);

  const buttonColor = selectedTheme === "custom" ? customPrimaryColor : themePresets[selectedTheme].primary;

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
    setActionResult(null); // Reset action result when new selection is made
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleGetFileUrls = async () => {
    if (!configuredProps || selectedFiles.length === 0) return;

    setIsLoadingAction(true);
    try {
      // Build array of file/folder IDs for the action
      const fileOrFolderIds = selectedFiles.map((selectedFile) =>
        JSON.stringify({
          id: selectedFile.value?.id || selectedFile.id,
          name: selectedFile.value?.name || selectedFile.label,
          isFolder: selectedFile.value?.isFolder ?? false,
        })
      );

      const propsWithFiles = {
        ...configuredProps,
        fileOrFolderIds,
      };

      console.log("Running action with props:", propsWithFiles);

      // Single action call handles all files
      const response = await client.actions.run({
        id: "~/sharepoint-select-files",
        externalUserId,
        configuredProps: propsWithFiles as Record<string, unknown>,
      });

      console.log("Action response:", response);
      const result = response.ret as Record<string, unknown> | undefined;
      setActionResult(result ?? { error: "No data returned" });
    } catch (e) {
      console.error("Failed to run action:", e);
      setActionResult({ error: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setIsLoadingAction(false);
    }
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

      {/* Theme Customization */}
      <div style={{
        padding: "20px",
        border: "1px solid #e5e5e5",
        borderRadius: "8px",
        marginBottom: "20px",
        backgroundColor: "#fafafa",
      }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
          Customize Theme
        </h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => setSelectedTheme("light")}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: selectedTheme === "light" ? "2px solid #333" : "1px solid #ddd",
              backgroundColor: themePresets.light.primary,
              color: "#fff",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Light
          </button>
          <button
            onClick={() => setSelectedTheme("dark")}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: selectedTheme === "dark" ? "2px solid #333" : "1px solid #ddd",
              backgroundColor: themePresets.dark.primary,
              color: "#fff",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Dark
          </button>
          <button
            onClick={() => setSelectedTheme("custom")}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: selectedTheme === "custom" ? "2px solid #333" : "1px solid #ddd",
              backgroundColor: customPrimaryColor,
              color: "#fff",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Custom
          </button>
          {selectedTheme === "custom" && (
            <input
              type="color"
              value={customPrimaryColor}
              onChange={(e) => setCustomPrimaryColor(e.target.value)}
              style={{ width: "32px", height: "32px", cursor: "pointer", border: "none", padding: 0 }}
            />
          )}
        </div>
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
          Select Files
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedAccountId}
          style={{
            padding: "12px 24px",
            backgroundColor: selectedAccountId ? buttonColor : "#ccc",
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

          {/* Get File URLs Button */}
          <button
            onClick={handleGetFileUrls}
            disabled={isLoadingAction}
            style={{
              marginTop: "16px",
              padding: "10px 20px",
              backgroundColor: buttonColor,
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isLoadingAction ? "wait" : "pointer",
              fontSize: "14px",
              fontWeight: 500,
              opacity: isLoadingAction ? 0.7 : 1,
            }}
          >
            {isLoadingAction ? "Loading..." : "Get File URLs"}
          </button>

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

      {/* Action Result Display */}
      {actionResult && (
        <div style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          backgroundColor: actionResult.error ? "#fef2f2" : "#f0fdf4",
          marginBottom: "20px",
        }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600 }}>
            Action Result
          </h2>
          {/* Single file result */}
          {actionResult.downloadUrl && (
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                Download URL (valid ~1 hour):
              </label>
              <a
                href={actionResult.downloadUrl as string}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: buttonColor,
                  wordBreak: "break-all",
                  fontSize: "13px",
                }}
              >
                {(actionResult.downloadUrl as string).substring(0, 80)}...
              </a>
            </div>
          )}
          {/* Multiple files result */}
          {actionResult.files && Array.isArray(actionResult.files) && (
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "#666", marginBottom: "8px" }}>
                Download URLs (valid ~1 hour):
              </label>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {(actionResult.files as Array<Record<string, unknown>>).map((file, index) => (
                  <li
                    key={index}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#fff",
                      border: "1px solid #e5e5e5",
                      borderRadius: "6px",
                      marginBottom: "6px",
                    }}
                  >
                    <strong style={{ fontSize: "13px" }}>{file.name as string}</strong>
                    {file.downloadUrl && (
                      <div style={{ marginTop: "4px" }}>
                        <a
                          href={file.downloadUrl as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: buttonColor,
                            wordBreak: "break-all",
                            fontSize: "12px",
                          }}
                        >
                          Download
                        </a>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <details>
            <summary style={{ cursor: "pointer", color: "#666", fontSize: "13px" }}>
              View full response
            </summary>
            <pre style={{
              marginTop: "8px",
              padding: "12px",
              backgroundColor: "#fff",
              borderRadius: "6px",
              overflow: "auto",
              fontSize: "12px",
              border: "1px solid #e5e5e5",
              maxHeight: "300px",
            }}>
              {JSON.stringify(actionResult, null, 2)}
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

      {/* File Picker Modal */}
      {selectedAccountId && (
        <CustomizeProvider theme={currentTheme}>
          <ConfigureFilePickerModal
            isOpen={isModalOpen}
            title="Select SharePoint Files"
            componentKey="~/sharepoint-select-files"
            app="sharepoint"
            accountId={selectedAccountId}
            externalUserId={externalUserId}
            onSelect={handleSelect}
            onCancel={handleCancel}
            confirmText="Select Files"
            cancelText="Cancel"
            multiSelect={true}
            selectFolders={true}
            selectFiles={true}
          />
        </CustomizeProvider>
      )}
    </div>
  );
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
          maxWidth: "1400px",
          margin: "0 auto",
          flexWrap: "wrap",
        }}>
          {/* Left: Configure-Based Picker (Hybrid) */}
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
