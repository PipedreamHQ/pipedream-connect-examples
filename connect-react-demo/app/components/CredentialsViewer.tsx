"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useCustomize } from "@pipedream/connect-react"
import type { AccountCredentials } from "@pipedream/sdk"
import {
  IoCheckmarkOutline,
  IoCopyOutline,
  IoEyeOffOutline,
  IoEyeOutline,
  IoRefreshOutline,
} from "react-icons/io5"
import { cn } from "@/lib/utils"
import { fetchAccountCredentials } from "@/app/actions/backendClient"
import { useSDKLogger } from "@/lib/sdk-logger"

interface CredentialsViewerProps {
  externalUserId: string
  accountId: string
  app?: string
  accountName?: string
}

// Fixed-width mask: doesn't leak value length, and keeps the value column aligned.
const MASK = "•".repeat(20)

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
  const [copied, setCopied] = useState<string | null>(null)

  // Never carry one account's credentials over to another
  useEffect(() => {
    setCredentials(null)
    setError(null)
    setRevealed({})
    setCopied(null)
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

  const copyToClipboard = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const entries = useMemo(
    () => Object.entries(credentials ?? {}).filter(([, value]) => value !== undefined && value !== null),
    [credentials]
  )
  const allRevealed = entries.length > 0 && entries.every(([key]) => revealed[key])

  const actionClasses =
    "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed"

  const iconButtonClasses =
    "inline-flex items-center justify-center h-6 w-6 rounded transition-opacity opacity-60 hover:opacity-100"

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span
          className="text-xs font-semibold uppercase tracking-wide truncate"
          style={{ color: theme.colors.neutral60 }}
          title={accountName}
        >
          Credentials{accountName ? ` · ${accountName}` : ""}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {entries.length > 0 && (
            <button
              type="button"
              className={actionClasses}
              style={{ color: theme.colors.neutral70 }}
              onClick={() =>
                setRevealed(allRevealed ? {} : Object.fromEntries(entries.map(([key]) => [key, true])))
              }
            >
              {allRevealed ? (
                <IoEyeOffOutline className="h-3.5 w-3.5" />
              ) : (
                <IoEyeOutline className="h-3.5 w-3.5" />
              )}
              {allRevealed ? "Hide all" : "Reveal all"}
            </button>
          )}
          <button
            type="button"
            className={actionClasses}
            style={{ color: credentials ? theme.colors.neutral70 : theme.colors.primary }}
            onClick={load}
            disabled={isLoading}
          >
            {credentials && <IoRefreshOutline className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />}
            {isLoading ? "Loading..." : credentials ? "Refresh" : "View credentials"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs leading-normal" style={{ color: theme.colors.danger }}>
          {error}
        </div>
      )}

      {credentials && entries.length === 0 && (
        <p className="text-xs leading-normal" style={{ color: theme.colors.neutral50 }}>
          No credential fields returned. <span className="font-mono">include_credentials</span> only
          returns values for key-based apps and for OAuth apps connected with your own OAuth client
          (BYOA).
        </p>
      )}

      {entries.length > 0 && (
        <div
          className="flex flex-col rounded overflow-hidden"
          style={{
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: theme.colors.neutral20,
            borderRadius: theme.borderRadius,
          }}
        >
          {entries.map(([key, value], index) => {
            const text = asText(value)
            const isRevealed = revealed[key]
            return (
              <div
                key={key}
                className="flex items-center gap-3 px-2.5 py-1.5"
                style={{
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopStyle: "solid",
                  borderTopColor: theme.colors.neutral20,
                }}
              >
                <span
                  className="font-mono text-xs w-32 shrink-0 truncate"
                  style={{ color: theme.colors.neutral60 }}
                  title={key}
                >
                  {key}
                </span>
                <span
                  className={cn("font-mono text-xs flex-1 min-w-0", isRevealed ? "break-all" : "truncate")}
                  style={{ color: theme.colors.neutral80 }}
                  title={isRevealed ? text : undefined}
                >
                  {isRevealed ? text : MASK}
                </span>
                <span className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    className={iconButtonClasses}
                    style={{ color: theme.colors.neutral60 }}
                    onClick={() => setRevealed((prev) => ({ ...prev, [key]: !prev[key] }))}
                    aria-label={isRevealed ? `Hide ${key}` : `Reveal ${key}`}
                    title={isRevealed ? "Hide" : "Reveal"}
                  >
                    {isRevealed ? (
                      <IoEyeOffOutline className="h-3.5 w-3.5" />
                    ) : (
                      <IoEyeOutline className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    className={iconButtonClasses}
                    style={{ color: copied === key ? theme.colors.primary : theme.colors.neutral60 }}
                    onClick={() => copyToClipboard(key, text)}
                    aria-label={`Copy ${key}`}
                    title={copied === key ? "Copied!" : "Copy"}
                  >
                    {copied === key ? (
                      <IoCheckmarkOutline className="h-3.5 w-3.5" />
                    ) : (
                      <IoCopyOutline className="h-3.5 w-3.5" />
                    )}
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      )}

      {entries.length > 0 && (
        <p className="text-xs leading-normal" style={{ color: theme.colors.neutral50 }}>
          Plaintext credentials, fetched server-side for this demo. Don&apos;t expose them in a real
          app.
        </p>
      )}
    </div>
  )
}
