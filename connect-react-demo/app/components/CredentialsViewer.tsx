"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useCustomize } from "@pipedream/connect-react"
import type { AccountCredentials } from "@pipedream/sdk"
import { fetchAccountCredentials } from "@/app/actions/backendClient"
import { useSDKLogger } from "@/lib/sdk-logger"

type CredentialsViewerProps = {
  externalUserId: string
  accountId: string
  app?: string
  accountName?: string
}

const mask = (value: string) => "•".repeat(Math.min(value.length, 24))

// Credential values are arbitrary JSON, so render non-strings as JSON rather
// than letting React stringify an object to "[object Object]".
const asText = (value: unknown) =>
  typeof value === "string" ? value : JSON.stringify(value)

export function CredentialsViewer({
  externalUserId,
  accountId,
  app,
  accountName,
}: CredentialsViewerProps) {
  const { theme } = useCustomize()
  const { addCall, updateCall } = useSDKLogger()

  const [credentials, setCredentials] = useState<AccountCredentials | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Never carry one account's credentials over to another
  useEffect(() => {
    setCredentials(null)
    setError(null)
    setRevealed({})
    setCopiedKey(null)
  }, [accountId, externalUserId])

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const request = { externalUserId, accountId, includeCredentials: true, ...(app && { app }) }
    const startTime = Date.now()
    const callId = addCall({ method: "accounts.list", timestamp: new Date(), request, status: "pending" })

    const result = await fetchAccountCredentials({ externalUserId, accountId, ...(app && { app }) })

    if (result.error) {
      setCredentials(null)
      setError(result.error.message)
      updateCall(callId, {
        error: { message: result.error.message, status: result.error.status, data: result.error.data },
        status: "error",
        duration: Date.now() - startTime,
      })
    } else {
      setCredentials(result.data)
      updateCall(callId, { response: result.data, status: "success", duration: Date.now() - startTime })
    }

    setIsLoading(false)
  }, [externalUserId, accountId, app, addCall, updateCall])

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1500)
    } catch (err) {
      console.error("Failed to copy credential value:", err)
    }
  }

  const entries = useMemo(
    () => Object.entries(credentials ?? {}).filter(([, value]) => value !== undefined && value !== null),
    [credentials]
  )
  const allRevealed = entries.length > 0 && entries.every(([key]) => revealed[key])

  const fontSize = {
    sm: "0.75rem",
    base: "0.875rem",
  }

  const sectionStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: `${theme.spacing.baseUnit}px`,
    alignItems: "flex-start",
  }

  const labelStyles: React.CSSProperties = {
    fontSize: fontSize.sm,
    fontWeight: 500,
    color: theme.colors.neutral70,
  }

  const helperTextStyles: React.CSSProperties = {
    color: theme.colors.neutral50,
    fontWeight: 400,
    fontSize: fontSize.sm,
    lineHeight: "1.5",
    margin: 0,
  }

  const smallButtonStyles: React.CSSProperties = {
    color: theme.colors.neutral80,
    backgroundColor: "transparent",
    display: "inline-flex",
    alignItems: "center",
    padding: `${theme.spacing.baseUnit}px ${theme.spacing.baseUnit * 2}px`,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.colors.neutral30,
    borderRadius: theme.borderRadius,
    cursor: isLoading ? "not-allowed" : "pointer",
    fontSize: fontSize.sm,
    fontWeight: 500,
    gap: theme.spacing.baseUnit * 2,
    opacity: isLoading ? 0.5 : 1,
  }

  const rowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "4px 0",
    borderBottom: `1px solid ${theme.colors.neutral20}`,
  }

  const keyStyles: React.CSSProperties = {
    fontFamily: "monospace",
    fontSize: fontSize.sm,
    color: theme.colors.neutral70,
    flex: "0 0 40%",
    wordBreak: "break-all",
  }

  const valueStyles: React.CSSProperties = {
    fontFamily: "monospace",
    fontSize: fontSize.sm,
    color: theme.colors.neutral80,
    flex: 1,
    wordBreak: "break-all",
  }

  return (
    <div style={sectionStyles}>
      <span style={labelStyles}>
        Credentials{accountName ? ` for ${accountName}` : ""}
      </span>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" onClick={load} disabled={isLoading} style={smallButtonStyles}>
          {isLoading ? "Loading..." : credentials ? "Refresh credentials" : "View credentials"}
        </button>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() =>
              setRevealed(
                allRevealed ? {} : Object.fromEntries(entries.map(([key]) => [key, true]))
              )
            }
            style={smallButtonStyles}
          >
            {allRevealed ? "Hide all" : "Reveal all"}
          </button>
        )}
      </div>

      {error && (
        <div style={{ fontSize: fontSize.base, color: theme.colors.danger }}>{error}</div>
      )}

      {credentials && entries.length === 0 && (
        <p style={helperTextStyles}>
          No credential fields returned. <code>include_credentials</code> only returns values for
          key-based apps and for OAuth apps connected with your own OAuth client (BYOA).
        </p>
      )}

      {entries.length > 0 && (
        <>
          <div style={{ width: "100%" }}>
            {entries.map(([key, value]) => {
              const text = asText(value)
              return (
                <div key={key} style={rowStyles}>
                  <span style={keyStyles}>{key}</span>
                  <span style={valueStyles}>{revealed[key] ? text : mask(text)}</span>
                  <button
                    type="button"
                    onClick={() => setRevealed((prev) => ({ ...prev, [key]: !prev[key] }))}
                    style={{ ...smallButtonStyles, cursor: "pointer", opacity: 1 }}
                  >
                    {revealed[key] ? "Hide" : "Reveal"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(key, text)}
                    style={{ ...smallButtonStyles, cursor: "pointer", opacity: 1 }}
                  >
                    {copiedKey === key ? "Copied" : "Copy"}
                  </button>
                </div>
              )
            })}
          </div>
          <p style={helperTextStyles}>
            These are plaintext credentials fetched server-side for this demo. Don&apos;t expose them
            in a real app.
          </p>
        </>
      )}
    </div>
  )
}
