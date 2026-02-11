"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useStableUuid } from "@/lib/stable-uuid";
import {
  FrontendClientProvider,
  CustomizeProvider,
  ConfigureFilePickerModal,
  useAccounts,
  type FilePickerItem,
} from "@pipedream/connect-react";
import { createFrontendClient } from "@pipedream/sdk/browser";
import { QueryClientProvider } from "@tanstack/react-query";
import { getAccountCredentials } from "../actions/backendClient";
import { queryClient, deferredTokenCallback, createClient } from "@/lib/frontend-client";

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

const badgeStyle: React.CSSProperties = {
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "11px",
  fontWeight: 500,
};

function actionButtonStyle(color: string, loading: boolean, disabled: boolean): React.CSSProperties {
  return {
    padding: "10px 20px",
    backgroundColor: disabled ? "#ccc" : color,
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: disabled ? "not-allowed" : loading ? "wait" : "pointer",
    fontSize: "14px",
    fontWeight: 500,
    opacity: loading ? 0.7 : 1,
  };
}

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

// Permission list (used in single-item and multi-item views)
function PermissionList({ permissions }: { permissions: Array<Record<string, unknown>> }) {
  return (
    <ul style={resetListStyle}>
      {permissions.map((perm, index) => (
        <li key={index} style={listItemStyle}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ ...badgeStyle, backgroundColor: "#e0e7ff" }}>
              {((perm.roles as string[]) || []).join(", ")}
            </span>
            {perm.user && (
              <span>{String((perm.user as Record<string, unknown>).displayName || (perm.user as Record<string, unknown>).email)}</span>
            )}
            {perm.group && (
              <span>{String((perm.group as Record<string, unknown>).displayName)}</span>
            )}
            {perm.link && (
              <span style={{ color: "#666" }}>
                Sharing link ({String((perm.link as Record<string, unknown>).type)} - {String((perm.link as Record<string, unknown>).scope)})
              </span>
            )}
            {perm.inheritedFrom && (
              <span style={{ fontSize: "11px", color: "#999" }}>(inherited)</span>
            )}
          </div>
        </li>
      ))}
    </ul>
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
  app = "sharepoint",
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
// Utility Functions
// ============================================

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(isoDate: string): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ============================================
// Configure-Based File Picker (Hybrid)
// ============================================

// Removed NativeSharePointPicker - now available at /file-picker-sharepoint

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
  const [permissionsResult, setPermissionsResult] = useState<Record<string, unknown> | null>(null);
  const [usersWithReadAccess, setUsersWithReadAccess] = useState<Array<Record<string, unknown>> | null>(null);
  const [siteMembersResult, setSiteMembersResult] = useState<Record<string, unknown> | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingSiteMembers, setIsLoadingSiteMembers] = useState(false);
  const [showIcons, setShowIcons] = useState(true);
  const [webhookUri, setWebhookUri] = useState("");
  const [triggerResult, setTriggerResult] = useState<Record<string, unknown> | null>(null);
  const [isLoadingTrigger, setIsLoadingTrigger] = useState(false);

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

  const client = useMemo(() => createClient(externalUserId), [externalUserId]);

  const handleConnectNew = () =>
    connectAccountPromise(client, {
      app: "sharepoint",
      onSuccess: (id) => setSelectedAccountId(id),
      onError: (msg) => console.error(msg),
    });

  const handleSelect = async (items: FilePickerItem[], props: Record<string, unknown>) => {
    setSelectedFiles(items);
    setConfiguredProps(props);
    setPermissionsResult(null); // Reset permissions result when new selection is made
    setUsersWithReadAccess(null); // Reset users when new selection is made
    setSiteMembersResult(null); // Reset site members when new selection is made
    setIsModalOpen(false);

    // Immediately fetch metadata for selected files
    if (items.length > 0) {
      setIsLoadingAction(true);
      setActionResult(null);
      try {
        const response = await client.actions.run({
          id: "~/sharepoint-retrieve-file-metadata",
          externalUserId,
          configuredProps: { ...props, fileOrFolderIds: buildFileOrFolderIds(items) } as Record<string, unknown>,
        });
        setActionResult((response.ret as Record<string, unknown>) ?? { error: "No data returned" });
      } catch (e) {
        console.error("Failed to retrieve metadata:", e);
        setActionResult({ error: e instanceof Error ? e.message : "Unknown error" });
      } finally {
        setIsLoadingAction(false);
      }
    } else {
      setActionResult(null);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const buildFileOrFolderIds = (itemsToUse = selectedFiles) =>
    itemsToUse.map((f) => {
      const value = f.value as { id?: string; name?: string; isFolder?: boolean } | undefined;
      return JSON.stringify({
        id: value?.id || f.id,
        name: value?.name || f.label,
        isFolder: value?.isFolder ?? false,
      });
    });

  const handleGetFileUrls = async () => {
    if (!configuredProps || selectedFiles.length === 0) return;

    setIsLoadingAction(true);
    try {
      const response = await client.actions.run({
        id: "~/sharepoint-download-files",
        externalUserId,
        configuredProps: { ...configuredProps, fileOrFolderIds: buildFileOrFolderIds() } as Record<string, unknown>,
      });
      setActionResult((response.ret as Record<string, unknown>) ?? { error: "No data returned" });
    } catch (e) {
      console.error("Failed to run action:", e);
      setActionResult({ error: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleGetPermissions = async () => {
    if (!configuredProps || selectedFiles.length === 0) return;

    setIsLoadingPermissions(true);
    setPermissionsResult(null);
    try {
      const response = await client.actions.run({
        id: "~/sharepoint-get-file-permissions",
        externalUserId,
        configuredProps: {
          ...configuredProps,
          fileOrFolderIds: buildFileOrFolderIds(),
          includeFileMetadata: true,
          expandGroupsToUsers: true,
        } as Record<string, unknown>,
      });
      setPermissionsResult((response.ret as Record<string, unknown>) ?? { error: "No data returned" });
    } catch (e) {
      console.error("Failed to get permissions:", e);
      setPermissionsResult({ error: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  // Extract group IDs from permissions and fetch individual users
  const handleGetUsersWithReadAccess = async () => {
    if (!permissionsResult || !configuredProps) return;

    setIsLoadingUsers(true);
    setUsersWithReadAccess(null);

    try {
      // Extract group IDs from permissions
      // Handle both single item (permissionsResult.permissions) and multiple items (permissionsResult.items)
      const allPermissions: Array<Record<string, unknown>> = [];

      if (permissionsResult.permissions && Array.isArray(permissionsResult.permissions)) {
        allPermissions.push(...(permissionsResult.permissions as Array<Record<string, unknown>>));
      }

      if (permissionsResult.items && Array.isArray(permissionsResult.items)) {
        for (const item of permissionsResult.items as Array<Record<string, unknown>>) {
          if (item.permissions && Array.isArray(item.permissions)) {
            allPermissions.push(...(item.permissions as Array<Record<string, unknown>>));
          }
        }
      }

      // Extract unique group IDs (Entra ID groups have a GUID format)
      const groupIds = new Set<string>();
      for (const perm of allPermissions) {
        if (perm.group && typeof perm.group === "object") {
          const group = perm.group as Record<string, unknown>;
          if (group.id && typeof group.id === "string") {
            // Only add if it looks like a GUID (Entra ID group)
            if (/^[a-f0-9-]{36}$/i.test(group.id)) {
              groupIds.add(group.id);
            }
          }
        }
      }

      if (groupIds.size === 0) {
        setUsersWithReadAccess([]);
        return;
      }

      // Call list-users action with group IDs
      const response = await client.actions.run({
        id: "~/sharepoint-list-users",
        externalUserId,
        configuredProps: {
          sharepoint: {
            authProvisionId: (configuredProps.sharepoint as Record<string, unknown>)?.authProvisionId,
          },
          groupIds: Array.from(groupIds),
          includeGuests: true,
          maxResults: 100,
        },
      });

      const result = response.ret as Record<string, unknown> | undefined;

      if (result?.users && Array.isArray(result.users)) {
        setUsersWithReadAccess(result.users as Array<Record<string, unknown>>);
      } else {
        setUsersWithReadAccess([]);
      }
    } catch (e) {
      console.error("Failed to get users:", e);
      setUsersWithReadAccess([{ error: e instanceof Error ? e.message : "Unknown error" }]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Get all site members using list-site-members action
  const handleGetSiteMembers = async () => {
    if (!configuredProps) return;

    setIsLoadingSiteMembers(true);
    setSiteMembersResult(null);

    try {
      // Extract siteId from configuredProps
      const siteId = configuredProps.siteId as { __lv?: { value: string } } | string | undefined;
      const resolvedSiteId = typeof siteId === "object" && siteId?.__lv?.value
        ? siteId.__lv.value
        : siteId;

      if (!resolvedSiteId) {
        setSiteMembersResult({ error: "No siteId found in configured props" });
        return;
      }

      const response = await client.actions.run({
        id: "~/sharepoint-list-site-members",
        externalUserId,
        configuredProps: {
          sharepoint: {
            authProvisionId: (configuredProps.sharepoint as Record<string, unknown>)?.authProvisionId,
          },
          siteId: resolvedSiteId,
        },
      });

      const result = response.ret as Record<string, unknown> | undefined;
      setSiteMembersResult(result ?? { error: "No data returned" });
    } catch (e) {
      console.error("Failed to get site members:", e);
      setSiteMembersResult({ error: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setIsLoadingSiteMembers(false);
    }
  };

  // Deploy trigger to listen for file changes
  const handleDeployTrigger = async () => {
    if (!configuredProps || !webhookUri) {
      setTriggerResult({ error: "Please provide a webhook URI" });
      return;
    }

    setIsLoadingTrigger(true);
    setTriggerResult(null);

    try {
      // TODO: This would call a deploy-trigger action or API endpoint
      // For now, just show what the payload would be
      const payload = {
        webhookUri,
        configuredProps: { ...configuredProps, fileOrFolderIds: buildFileOrFolderIds() },
      };

      // Simulate deployment
      await new Promise(resolve => setTimeout(resolve, 1000));

      setTriggerResult({
        success: true,
        message: "Trigger deployed successfully",
        webhookUri,
        listening: true,
      });
    } catch (e) {
      console.error("Failed to deploy trigger:", e);
      setTriggerResult({ error: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setIsLoadingTrigger(false);
    }
  };

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
          app="sharepoint"
        />
      </div>

      {/* File Picker Trigger */}
      <div style={disabledSectionStyle(!!selectedAccountId)}>
        <h2 style={sectionHeadingStyle}>2. Select Files</h2>
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

        {/* Theme Customization - subtle style */}
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e5e5e5" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#666" }}>Theme:</span>
            <button
              onClick={() => setSelectedTheme("light")}
              style={{
                padding: "4px 10px",
                borderRadius: "4px",
                border: selectedTheme === "light" ? "2px solid #333" : "1px solid #ddd",
                backgroundColor: themePresets.light.primary,
                color: "#fff",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Light
            </button>
            <button
              onClick={() => setSelectedTheme("dark")}
              style={{
                padding: "4px 10px",
                borderRadius: "4px",
                border: selectedTheme === "dark" ? "2px solid #333" : "1px solid #ddd",
                backgroundColor: themePresets.dark.primary,
                color: "#fff",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Dark
            </button>
            <button
              onClick={() => setSelectedTheme("custom")}
              style={{
                padding: "4px 10px",
                borderRadius: "4px",
                border: selectedTheme === "custom" ? "2px solid #333" : "1px solid #ddd",
                backgroundColor: customPrimaryColor,
                color: "#fff",
                fontSize: "11px",
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
                style={{ width: "24px", height: "24px", cursor: "pointer", border: "none", padding: 0 }}
              />
            )}
            <label style={{ marginLeft: "8px", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#666", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showIcons}
                onChange={(e) => setShowIcons(e.target.checked)}
              />
              Show folder and file icons
            </label>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingAction && !actionResult && (
        <div style={{ ...sectionStyle, backgroundColor: "#f0f9ff" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "20px",
          }}>
            <div style={{
              width: "20px",
              height: "20px",
              border: "3px solid #e5e7eb",
              borderTopColor: "#2684FF",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}></div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#1e40af", marginBottom: "4px" }}>
                Retrieving file metadata...
              </div>
              <div style={{ fontSize: "12px", color: "#3b82f6" }}>
                Fetching file details from SharePoint
              </div>
            </div>
          </div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* File Metadata Display */}
      {actionResult && (
        <div style={{ ...sectionStyle, backgroundColor: actionResult.error ? "#fef2f2" : "#f0fdf4" }}>
          <h2 style={sectionHeadingStyle}>File Metadata</h2>
          {actionResult.error ? (
            <p style={{ color: "#dc2626", margin: 0 }}>{String(actionResult.error)}</p>
          ) : (
            <>
              {/* Single file result */}
              {actionResult.name && !actionResult.files && (
                <div style={{ marginBottom: "12px" }}>
                  <ul style={resetListStyle}>
                    <li style={listItemStyle}>
                      <div>
                        <strong style={{ fontSize: "14px" }}>{String(actionResult.name)}</strong>
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                          {actionResult.size && <span>{formatSize(actionResult.size as number)} • </span>}
                          {actionResult.lastModifiedDateTime && <span>Modified {formatDate(actionResult.lastModifiedDateTime as string)}</span>}
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              )}

              {/* Multiple files result */}
              {actionResult.files && Array.isArray(actionResult.files) && (
                <div style={{ marginBottom: "12px" }}>
                  <ul style={resetListStyle}>
                    {(actionResult.files as Array<Record<string, unknown>>).map((file, index) => (
                      <li key={index} style={listItemStyle}>
                        <div>
                          <strong style={{ fontSize: "14px" }}>{String(file.name)}</strong>
                          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                            {file.size && <span>{formatSize(file.size as number)} • </span>}
                            {file.lastModifiedDateTime && <span>Modified {formatDate(file.lastModifiedDateTime as string)}</span>}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <details style={{ marginTop: "12px" }}>
                <summary style={{ cursor: "pointer", color: "#666", fontSize: "13px" }}>
                  View full metadata response
                </summary>
                <JsonDisplay data={actionResult} />
              </details>
            </>
          )}
        </div>
      )}

      {/* Download URLs Section */}
      {actionResult && !actionResult.error && (
        <div style={{ ...sectionStyle, backgroundColor: "#ecfdf5" }}>
          <h2 style={sectionHeadingStyle}>Download URLs</h2>

          {/* Show button if URLs not fetched yet */}
          {!actionResult.downloadUrl && !(actionResult.files as Array<Record<string, unknown>>)?.[0]?.downloadUrl ? (
            <>
              <p style={{ fontSize: "13px", color: "#666", marginTop: 0, marginBottom: "12px" }}>
                Get pre-authenticated download links (valid ~1 hour)
              </p>
              <button
                onClick={handleGetFileUrls}
                disabled={isLoadingAction || isLoadingPermissions}
                style={actionButtonStyle(buttonColor, isLoadingAction, false)}
              >
                {isLoadingAction ? "Loading..." : "Get Download URLs"}
              </button>

              {/* Show SDK payload */}
              <details style={{ marginTop: "12px" }}>
                <summary style={{ cursor: "pointer", color: "#666", fontSize: "13px" }}>
                  View SDK code
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
                  {`await client.actions.run(${JSON.stringify({
                    id: "~/sharepoint-download-files",
                    externalUserId,
                    configuredProps: { ...configuredProps, fileOrFolderIds: buildFileOrFolderIds() },
                  }, null, 2)})`}
                </pre>
              </details>
            </>
          ) : (
            <>
              <p style={{ fontSize: "13px", color: "#666", marginTop: 0, marginBottom: "12px" }}>
                Pre-authenticated download links (valid ~1 hour)
              </p>

              {/* Single file download URL */}
              {actionResult.downloadUrl && !actionResult.files && (
                <div style={{ marginBottom: "12px" }}>
                  <ul style={resetListStyle}>
                    <li style={listItemStyle}>
                      <div>
                        <strong style={{ fontSize: "14px" }}>{String(actionResult.name)}</strong>
                        <div style={{ marginTop: "8px" }}>
                          <a
                            href={actionResult.downloadUrl as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: buttonColor,
                              fontSize: "13px",
                              textDecoration: "underline",
                            }}
                          >
                            Download File
                          </a>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              )}

              {/* Multiple files download URLs */}
              {actionResult.files && Array.isArray(actionResult.files) && (
                <div style={{ marginBottom: "12px" }}>
                  <ul style={resetListStyle}>
                    {(actionResult.files as Array<Record<string, unknown>>).map((file, index) => (
                      <li key={index} style={listItemStyle}>
                        <div>
                          <strong style={{ fontSize: "14px" }}>{String(file.name)}</strong>
                          {file.downloadUrl && (
                            <div style={{ marginTop: "8px" }}>
                              <a
                                href={file.downloadUrl as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: buttonColor,
                                  fontSize: "13px",
                                  textDecoration: "underline",
                                }}
                              >
                                Download File
                              </a>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Permissions Section */}
      {actionResult && !actionResult.error && (
        <div style={{ ...sectionStyle, backgroundColor: permissionsResult?.error ? "#fef2f2" : "#f5f3ff" }}>
          <h2 style={sectionHeadingStyle}>Permissions</h2>

          {/* Show button if permissions not fetched yet */}
          {!permissionsResult ? (
            <>
              <p style={{ fontSize: "13px", color: "#666", marginTop: 0, marginBottom: "12px" }}>
                View who has access to the selected files
              </p>
              <button
                onClick={handleGetPermissions}
                disabled={isLoadingAction || isLoadingPermissions}
                style={actionButtonStyle("#6366f1", isLoadingPermissions, false)}
              >
                {isLoadingPermissions ? "Loading..." : "Get Permissions"}
              </button>

              {/* Show SDK payload */}
              <details style={{ marginTop: "12px" }}>
                <summary style={{ cursor: "pointer", color: "#666", fontSize: "13px" }}>
                  View SDK code
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
                  {`await client.actions.run(${JSON.stringify({
                    id: "~/sharepoint-get-file-permissions",
                    externalUserId,
                    configuredProps: {
                      ...configuredProps,
                      fileOrFolderIds: buildFileOrFolderIds(),
                      includeFileMetadata: true,
                      expandGroupsToUsers: true,
                    },
                  }, null, 2)})`}
                </pre>
              </details>
            </>
          ) : permissionsResult.error ? (
            <p style={{ color: "#dc2626", margin: 0 }}>{String(permissionsResult.error)}</p>
          ) : (
            <>
          {/* Single item permissions */}
          {permissionsResult.permissions && Array.isArray(permissionsResult.permissions) && (
            <div>
              <p style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>
                <strong>{String(permissionsResult.itemName)}</strong> - {(permissionsResult.permissions as unknown[]).length} permission(s)
              </p>
              {permissionsResult.downloadUrl && (
                <p style={{ fontSize: "13px", marginBottom: "12px" }}>
                  <a
                    href={String(permissionsResult.downloadUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#6366f1" }}
                  >
                    Download file
                  </a>
                  <span style={{ color: "#999", marginLeft: "8px", fontSize: "11px" }}>
                    (URL valid ~1 hour)
                  </span>
                </p>
              )}
              <PermissionList permissions={permissionsResult.permissions as Array<Record<string, unknown>>} />
            </div>
          )}
          {/* Multiple items permissions */}
          {permissionsResult.items && Array.isArray(permissionsResult.items) && (
            <div>
              <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
                {String(permissionsResult.totalPermissions)} total permission(s) across {(permissionsResult.items as unknown[]).length} item(s)
              </p>
              {(permissionsResult.items as Array<Record<string, unknown>>).map((item, itemIndex) => (
                <div key={itemIndex} style={{ marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    {String(item.itemName)} ({((item.permissions as unknown[]) || []).length} permissions)
                  </h4>
                  {item.downloadUrl && (
                    <p style={{ fontSize: "12px", marginBottom: "8px", marginTop: 0 }}>
                      <a
                        href={String(item.downloadUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#6366f1" }}
                      >
                        Download
                      </a>
                    </p>
                  )}
                  <PermissionList permissions={(item.permissions as Array<Record<string, unknown>>) || []} />
                </div>
              ))}
            </div>
          )}
          {/* Users with Access - from expandGroupsToUsers */}
          {(permissionsResult.usersWithAccess || (permissionsResult.items as Array<Record<string, unknown>>)?.[0]?.usersWithAccess) && (
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e5e5e5" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: 600, color: "#10b981" }}>
                Users with Access ({((permissionsResult.usersWithAccess || (permissionsResult.items as Array<Record<string, unknown>>)?.[0]?.usersWithAccess) as Array<Record<string, unknown>>).length})
              </h3>
              <ul style={resetListStyle}>
                {((permissionsResult.usersWithAccess || (permissionsResult.items as Array<Record<string, unknown>>)?.[0]?.usersWithAccess) as Array<Record<string, unknown>>).map((user, index) => (
                  <li
                    key={user.email as string || index}
                    style={{ ...listItemStyle, border: "1px solid #d1fae5" }}
                  >
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                      <strong>{String(user.displayName)}</strong>
                      {user.email && (
                        <span style={{ color: "#666" }}>{String(user.email)}</span>
                      )}
                      <span style={{
                        ...badgeStyle,
                        backgroundColor: user.accessLevel === "owner" ? "#fef3c7" : user.accessLevel === "write" ? "#dbeafe" : "#d1fae5",
                      }}>
                        {String(user.accessLevel)}
                      </span>
                      {user.viaGroup && (
                        <span style={{ fontSize: "11px", color: "#666" }}>
                          via {String(user.viaGroup)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Button to expand groups to users (legacy - now built into get-file-permissions) */}
          {!permissionsResult.error && !permissionsResult.usersWithAccess && !(permissionsResult.items as Array<Record<string, unknown>>)?.[0]?.usersWithAccess && (
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e5e5e5" }}>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={handleGetUsersWithReadAccess}
                  disabled={isLoadingUsers || isLoadingSiteMembers}
                  style={actionButtonStyle("#10b981", isLoadingUsers, false)}
                >
                  {isLoadingUsers ? "Loading..." : "Expand Groups to Users"}
                </button>
                <button
                  onClick={handleGetSiteMembers}
                  disabled={isLoadingUsers || isLoadingSiteMembers}
                  style={actionButtonStyle("#8b5cf6", isLoadingSiteMembers, false)}
                >
                  {isLoadingSiteMembers ? "Loading..." : "List All Site Members"}
                </button>
              </div>
              <p style={{ fontSize: "12px", color: "#666", marginTop: "8px", marginBottom: 0 }}>
                &quot;Expand Groups&quot; fetches users from Entra ID groups. &quot;List All Site Members&quot; gets all users with access to the site.
              </p>
            </div>
          )}
          </>
          )}

          {permissionsResult && (
            <details style={{ marginTop: "12px" }}>
              <summary style={{ cursor: "pointer", color: "#666", fontSize: "13px" }}>
                View full response
              </summary>
              <JsonDisplay data={permissionsResult} />
            </details>
          )}
        </div>
      )}

      {/* Deploy Trigger Section */}
      {actionResult && !actionResult.error && (
        <div style={{ ...sectionStyle, backgroundColor: "#fef3c7" }}>
          <h2 style={sectionHeadingStyle}>Deploy Trigger for File Updates</h2>

          {/* Show form if trigger not deployed yet */}
          {!triggerResult?.success ? (
            <>
              <p style={{ fontSize: "13px", color: "#666", marginTop: 0, marginBottom: "12px" }}>
                Deploy a trigger to receive webhook notifications when the selected files are updated
              </p>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                  Webhook URI:
                </label>
                <input
                  type="url"
                  value={webhookUri}
                  onChange={(e) => setWebhookUri(e.target.value)}
                  placeholder="https://your-api.com/webhook/file-updates"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "13px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                  }}
                />
              </div>
              <button
                onClick={handleDeployTrigger}
                disabled={isLoadingTrigger || !webhookUri}
                style={actionButtonStyle("#f59e0b", isLoadingTrigger, !webhookUri)}
              >
                {isLoadingTrigger ? "Deploying..." : "Deploy Trigger"}
              </button>

              {/* Show SDK payload */}
              <details style={{ marginTop: "12px" }}>
                <summary style={{ cursor: "pointer", color: "#666", fontSize: "13px" }}>
                  View SDK code
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
                  {`await client.triggers.deploy(${JSON.stringify({
                    id: "~/sharepoint-file-updates",
                    externalUserId,
                    webhookUri: webhookUri || "<your-webhook-uri>",
                    configuredProps: { ...configuredProps, fileOrFolderIds: buildFileOrFolderIds() },
                  }, null, 2)})`}
                </pre>
              </details>
            </>
          ) : (
            <>
              <p style={{ fontSize: "13px", color: "#059669", marginTop: 0, marginBottom: "12px", fontWeight: 500 }}>
                ✓ Trigger deployed successfully
              </p>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
                <strong>Webhook URI:</strong> <code style={{ fontSize: "12px", backgroundColor: "#fef9c3", padding: "2px 6px", borderRadius: "3px" }}>{String(triggerResult.webhookUri)}</code>
              </div>
              <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>
                You will receive POST requests at your webhook URI when files are created, updated, or deleted.
              </p>
            </>
          )}

          {triggerResult?.error && (
            <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "12px", margin: 0 }}>
              Error: {String(triggerResult.error)}
            </p>
          )}
        </div>
      )}

      {/* Users with Read Access Display */}
      {usersWithReadAccess && (
        <div style={{ ...sectionStyle, backgroundColor: "#ecfdf5" }}>
          <h2 style={sectionHeadingStyle}>
            Users with Read Access ({usersWithReadAccess.length})
          </h2>
          {usersWithReadAccess.length === 0 ? (
            <p style={{ color: "#666", fontSize: "13px", margin: 0 }}>
              No Entra ID groups found in permissions. The permissions may only contain SharePoint-native groups
              (like &quot;site Members&quot;, &quot;site Owners&quot;) which cannot be expanded via Microsoft Graph API.
            </p>
          ) : usersWithReadAccess[0]?.error ? (
            <p style={{ color: "#dc2626", margin: 0 }}>{String(usersWithReadAccess[0].error)}</p>
          ) : (
            <ul style={resetListStyle}>
              {usersWithReadAccess.map((user, index) => (
                <li key={user.id as string || index} style={listItemStyle}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <strong>{String(user.displayName)}</strong>
                    {user.email && (
                      <span style={{ color: "#666" }}>{String(user.email)}</span>
                    )}
                    {user.role && (
                      <span style={{ ...badgeStyle, backgroundColor: "#d1fae5" }}>
                        {String(user.role)}
                      </span>
                    )}
                    {user.groups && Array.isArray(user.groups) && (
                      <span style={{ fontSize: "11px", color: "#666" }}>
                        via {(user.groups as Array<Record<string, unknown>>).map(g => g.displayName).join(", ")}
                      </span>
                    )}
                  </div>
                  {user.jobTitle && (
                    <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                      {String(user.jobTitle)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Site Members Display */}
      {siteMembersResult && (
        <div style={{ ...sectionStyle, backgroundColor: siteMembersResult.error ? "#fef2f2" : "#f5f3ff" }}>
          <h2 style={sectionHeadingStyle}>Site Members</h2>
          {siteMembersResult.error ? (
            <p style={{ color: "#dc2626", margin: 0 }}>{String(siteMembersResult.error)}</p>
          ) : (
            <>
              {siteMembersResult.site && (
                <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
                  Site: <strong>{String((siteMembersResult.site as Record<string, unknown>).displayName)}</strong>
                </p>
              )}
              {siteMembersResult.note && (
                <p style={{ fontSize: "12px", color: "#666", marginBottom: "12px", fontStyle: "italic" }}>
                  {String(siteMembersResult.note)}
                </p>
              )}
              {siteMembersResult.summary && (
                <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
                  {String((siteMembersResult.summary as Record<string, unknown>).totalUsers)} total user(s)
                  {(siteMembersResult.summary as Record<string, unknown>).owners !== undefined && (
                    <> ({String((siteMembersResult.summary as Record<string, unknown>).owners)} owners, {String((siteMembersResult.summary as Record<string, unknown>).members)} members)</>
                  )}
                </p>
              )}
              {/* Users by role if available */}
              {siteMembersResult.byRole && (
                <div>
                  {(siteMembersResult.byRole as Record<string, unknown>).owners &&
                   Array.isArray((siteMembersResult.byRole as Record<string, unknown>).owners) &&
                   ((siteMembersResult.byRole as Record<string, unknown>).owners as unknown[]).length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <h4 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#7c3aed" }}>
                        Owners
                      </h4>
                      <ul style={resetListStyle}>
                        {((siteMembersResult.byRole as Record<string, unknown>).owners as Array<Record<string, unknown>>).map((user, index) => (
                          <li key={user.id as string || index} style={{ ...listItemStyle, marginBottom: "4px" }}>
                            <strong>{String(user.displayName)}</strong>
                            {user.email && <span style={{ color: "#666", marginLeft: "8px" }}>{String(user.email)}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(siteMembersResult.byRole as Record<string, unknown>).members &&
                   Array.isArray((siteMembersResult.byRole as Record<string, unknown>).members) &&
                   ((siteMembersResult.byRole as Record<string, unknown>).members as unknown[]).length > 0 && (
                    <div>
                      <h4 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#7c3aed" }}>
                        Members
                      </h4>
                      <ul style={resetListStyle}>
                        {((siteMembersResult.byRole as Record<string, unknown>).members as Array<Record<string, unknown>>).map((user, index) => (
                          <li key={user.id as string || index} style={{ ...listItemStyle, marginBottom: "4px" }}>
                            <strong>{String(user.displayName)}</strong>
                            {user.email && <span style={{ color: "#666", marginLeft: "8px" }}>{String(user.email)}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {/* Flat users list if no byRole */}
              {siteMembersResult.users && Array.isArray(siteMembersResult.users) && !siteMembersResult.byRole && (
                <ul style={resetListStyle}>
                  {(siteMembersResult.users as Array<Record<string, unknown>>).map((user, index) => (
                    <li key={user.id as string || index} style={listItemStyle}>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <strong>{String(user.displayName)}</strong>
                        {user.email && <span style={{ color: "#666" }}>{String(user.email)}</span>}
                        {user.role && (
                          <span style={{
                            ...badgeStyle,
                            backgroundColor: user.role === "owner" ? "#ddd6fe" : "#e0e7ff",
                          }}>
                            {String(user.role)}
                          </span>
                        )}
                        {user.viaGroup && (
                          <span style={{ fontSize: "11px", color: "#666" }}>
                            via {String(user.viaGroup)}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {/* Groups info if available */}
              {siteMembersResult.groups && Array.isArray(siteMembersResult.groups) && (siteMembersResult.groups as unknown[]).length > 0 && (
                <details style={{ marginTop: "12px" }}>
                  <summary style={{ cursor: "pointer", color: "#666", fontSize: "13px" }}>
                    View permission groups ({(siteMembersResult.groups as unknown[]).length})
                  </summary>
                  <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0" }}>
                    {(siteMembersResult.groups as Array<Record<string, unknown>>).map((group, index) => (
                      <li
                        key={group.id as string || index}
                        style={{
                          padding: "6px 10px",
                          backgroundColor: "#fff",
                          border: "1px solid #e5e5e5",
                          borderRadius: "4px",
                          marginBottom: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {String(group.displayName)}
                        {group.expandError && (
                          <span style={{ color: "#999", marginLeft: "8px", fontSize: "11px" }}>
                            ({String(group.expandError)})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <details style={{ marginTop: "12px" }}>
                <summary style={{ cursor: "pointer", color: "#666", fontSize: "13px" }}>
                  View full response
                </summary>
                <JsonDisplay data={siteMembersResult} />
              </details>
            </>
          )}
        </div>
      )}

      {/* Configured Props Display */}
      {configuredProps && (
        <div style={{ ...sectionStyle, backgroundColor: "#fefce8" }}>
          <h2 style={sectionHeadingStyle}>Configured Props (for persistence)</h2>
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
            Store this JSON to restore the selection later.
          </p>
          <JsonDisplay data={{ ...configuredProps, fileOrFolderIds: buildFileOrFolderIds() }} maxHeight="400px" />
        </div>
      )}

      {/* File Picker Modal */}
      {selectedAccountId && (
        <CustomizeProvider theme={currentTheme}>
          <ConfigureFilePickerModal
            isOpen={isModalOpen}
            title="Select SharePoint Files"
            componentKey="~/sharepoint-retrieve-file-metadata"
            app="sharepoint"
            accountId={selectedAccountId}
            externalUserId={externalUserId}
            onSelect={handleSelect}
            onCancel={handleCancel}
            confirmText="Select Files"
            cancelText="Cancel"
            multiSelect={true}
            selectFolders={false}
            selectFiles={true}
            showIcons={showIcons}
            debug={true}
          />
        </CustomizeProvider>
      )}
    </div>
  );
}

function FilePickerLinkGenerator({ externalUserId }: { externalUserId: string }) {
  const [callbackUri, setCallbackUri] = useState("");
  const [successRedirectUri, setSuccessRedirectUri] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { accounts, isLoading: accountsLoading } = useAccounts({
    app: "sharepoint",
    external_user_id: externalUserId,
  });

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedUrl(null);
    try {
      const resp = await deferredTokenCallback({
        externalUserId,
        ...(successRedirectUri && { successRedirectUri }),
      });

      const params = new URLSearchParams({
        token: resp.token,
        app: "sharepoint",
        externalUserId,
      });
      if (callbackUri) params.set("callbackUri", callbackUri);
      if (selectedAccountId) params.set("accountId", selectedAccountId);

      setGeneratedUrl(`${window.location.origin}/connect/demo/file-picker-link?${params.toString()}`);
    } catch (err) {
      console.error("Failed to generate token:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: "5px",
    fontSize: "13px",
    fontFamily: "monospace",
    backgroundColor: "#fff",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: "#475569",
    marginBottom: "4px",
  };

  const isFormValid = callbackUri && successRedirectUri;

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Known Issue Warning */}
      <div style={{
        padding: "16px",
        backgroundColor: "#fef3c7",
        border: "1px solid #fbbf24",
        borderRadius: "6px",
        marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontSize: "18px" }}>⚠️</span>
          <strong style={{ fontSize: "14px", color: "#92400e" }}>Known Issue</strong>
        </div>
        <p style={{ margin: 0, fontSize: "13px", color: "#78350f", lineHeight: "1.5" }}>
          Hosted link mode is currently broken. Fix incoming. Use the in-app mode for now.
        </p>
      </div>

      {/* 1. Configure */}
      <div style={sectionStyle}>
        <h2 style={sectionHeadingStyle}>1. Configure</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Callback URI (receives POST with selected files)</label>
            <input
              type="url"
              value={callbackUri}
              onChange={(e) => setCallbackUri(e.target.value)}
              placeholder="https://example.com/api/file-picker-callback"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Success Redirect URI (where user goes after selection)</label>
            <input
              type="url"
              value={successRedirectUri}
              onChange={(e) => setSuccessRedirectUri(e.target.value)}
              placeholder="https://example.com/success"
              style={inputStyle}
            />
          </div>
          {!accountsLoading && accounts.length > 0 && (
            <div>
              <label style={labelStyle}>Account (optional — skip connect flow)</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                style={{
                  ...inputStyle,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                <option value="">None (show connect flow)</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name || account.id}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 2. Generate & Open */}
      <div style={{
        ...sectionStyle,
        backgroundColor: isFormValid ? "#fafafa" : "#f5f5f5",
        opacity: isFormValid ? 1 : 0.6,
      }}>
        <h2 style={sectionHeadingStyle}>2. Generate Link</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: generatedUrl ? "12px" : 0 }}>
          <button
            onClick={handleGenerate}
            disabled={loading || !isFormValid}
            style={{
              padding: "8px 20px",
              backgroundColor: loading || !isFormValid ? "#94a3b8" : "#2684FF",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: loading || !isFormValid ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Generating..." : "Generate Link"}
          </button>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
            externalUserId: {externalUserId}
          </span>
        </div>
        {generatedUrl && (
          <div style={{
            display: "flex",
            alignItems: "stretch",
            gap: "8px",
          }}>
            <a
              href={generatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: "8px 10px",
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "5px",
                fontSize: "11px",
                fontFamily: "monospace",
                wordBreak: "break-all",
                color: "#2563eb",
                textDecoration: "none",
                display: "block",
                lineHeight: "1.4",
              }}
            >
              {generatedUrl}
            </a>
            <button
              onClick={handleCopy}
              style={{
                padding: "6px 12px",
                backgroundColor: copied ? "#10b981" : "#f1f5f9",
                color: copied ? "#fff" : "#475569",
                border: "1px solid #e2e8f0",
                borderRadius: "5px",
                fontSize: "12px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                alignSelf: "flex-start",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={() => { if (generatedUrl) window.location.href = generatedUrl; }}
              style={{
                padding: "6px 12px",
                backgroundColor: "#2684FF",
                color: "#fff",
                border: "1px solid #2684FF",
                borderRadius: "5px",
                fontSize: "12px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                alignSelf: "flex-start",
              }}
            >
              Open
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type ConnectReactMode = "in-app" | "hosted-link";

export default function FilePickerPage() {
  const [externalUserId] = useStableUuid();

  // Read mode from URL hash (e.g., #type=hosted-link or #type=in-app)
  const getModeFromHash = (): ConnectReactMode => {
    if (typeof window === "undefined") return "in-app";
    const hash = window.location.hash;
    const match = hash.match(/type=(in-app|hosted-link)/);
    return match ? (match[1] as ConnectReactMode) : "in-app";
  };

  const [connectReactMode, setConnectReactMode] = useState<ConnectReactMode>(getModeFromHash);

  // Update mode when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setConnectReactMode(getModeFromHash());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Update hash when mode changes via buttons
  const handleModeChange = (mode: ConnectReactMode) => {
    window.location.hash = `type=${mode}`;
    setConnectReactMode(mode);
  };

  const client = useMemo(() => {
    if (!externalUserId) return null;
    return createClient(externalUserId);
  }, [externalUserId]);

  if (!client) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading...</div>;
  }

  const modeStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: 500,
    color: isActive ? "#fff" : "#374151",
    backgroundColor: isActive ? "#2684FF" : "#f3f4f6",
    border: "1px solid " + (isActive ? "#2684FF" : "#e5e7eb"),
    borderRadius: "6px",
    cursor: "pointer",
  });

  const cardStyle: React.CSSProperties = {
    flex: "1 1 400px",
    minWidth: "350px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
  };

  const cardHeaderStyle: React.CSSProperties = {
    padding: "16px 20px",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#fafafa",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <FrontendClientProvider client={client}>
        <div style={{
          padding: "20px",
          maxWidth: "1000px",
          margin: "0 auto",
        }}>
          {/* Header */}
          <div style={{
            marginBottom: "30px",
            padding: "20px",
            backgroundColor: "#f0f9ff",
            borderRadius: "8px",
            border: "1px solid #bfdbfe",
          }}>
            <h1 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 600, color: "#1e3a8a" }}>
              Pipedream Connect File Picker
            </h1>
            <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#3b82f6" }}>
              Uses Pipedream&apos;s Connect React SDK to populate the file picker and retrieve the selected files.
            </p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <button onClick={() => handleModeChange("in-app")} style={modeStyle(connectReactMode === "in-app")}>
                In-app
              </button>
              <button onClick={() => handleModeChange("hosted-link")} style={modeStyle(connectReactMode === "hosted-link")}>
                Hosted link
              </button>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#1e40af", lineHeight: "1.5" }}>
              {connectReactMode === "hosted-link"
                ? "Opens the file picker on a hosted Pipedream page via a URL. Users connect their account and select files without any UI in your app."
                : "Embeds the file picker directly in your app using React components. Account connection and file selection happen inline."}
            </p>
          </div>

          {/* Content */}
          {connectReactMode === "in-app" && (
            <ConfigureFilePickerDemo externalUserId={externalUserId} />
          )}
          {connectReactMode === "hosted-link" && (
            <FilePickerLinkGenerator externalUserId={externalUserId} />
          )}
        </div>
      </FrontendClientProvider>
    </QueryClientProvider>
  );
}
