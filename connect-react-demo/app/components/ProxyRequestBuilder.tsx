import { useState, useEffect } from "react"
import { useCustomize } from "@pipedream/connect-react"
import { useAppState } from "@/lib/app-state"
import { proxyRequest } from "@/app/actions/backendClient"
import { useSDKLogger } from "@/lib/sdk-logger"
import type { Account } from "@pipedream/sdk"
import { SDKError } from "@/lib/types/pipedream"

const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const

type KeyValuePair = {
  key: string
  value: string
}

type ProxyRequestBuilderProps = {
  accounts: Account[]
  isLoadingAccounts: boolean
  onConnectNewAccount: () => void
  sdkErrors?: SDKError
}

export function ProxyRequestBuilder({
  accounts,
  isLoadingAccounts,
  onConnectNewAccount,
  sdkErrors,
}: ProxyRequestBuilderProps) {
  const {
    proxyUrl,
    setProxyUrl,
    proxyMethod,
    setProxyMethod,
    proxyBody,
    setProxyBody,
    editableExternalUserId,
    externalUserId,
    accountId,
    setAccountId,
    setEditableExternalUserId,
    selectedApp,
    setActionRunOutput,
  } = useAppState()

  const { theme } = useCustomize()
  const { addCall, updateCall } = useSDKLogger()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [headers, setHeaders] = useState<KeyValuePair[]>([{ key: "", value: "" }])

  // Auto-fill proxy URL and reset headers when app changes
  const baseProxyTargetUrl = selectedApp?.connect?.base_proxy_target_url
  useEffect(() => {
    if (baseProxyTargetUrl) {
      setProxyUrl(baseProxyTargetUrl)
    }
    // Reset local state when app changes
    setHeaders([{ key: "", value: "" }])
    setError(null)
  }, [baseProxyTargetUrl, setProxyUrl])

  const handleHeaderChange = (index: number, field: "key" | "value", newValue: string) => {
    const newHeaders = [...headers]
    newHeaders[index] = { ...newHeaders[index], [field]: newValue }
    setHeaders(newHeaders)
  }

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }])
  }

  const removeHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index)
    setHeaders(newHeaders.length > 0 ? newHeaders : [{ key: "", value: "" }])
  }

  // Convert headers array to object for API request
  const getHeadersObject = () => {
    const headersObj: Record<string, string> = {}
    headers.forEach(h => {
      if (h.key.trim()) {
        headersObj[h.key] = h.value
      }
    })
    return Object.keys(headersObj).length > 0 ? headersObj : undefined
  }

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!proxyUrl.trim()) {
      setError("URL is required")
      return
    }

    if (!isValidUrl(proxyUrl)) {
      setError("Please enter a valid URL (e.g., https://api.example.com/endpoint)")
      return
    }

    if (!editableExternalUserId?.trim()) {
      setError("External User ID is required")
      return
    }

    if (!accountId?.trim()) {
      setError("Account ID is required")
      return
    }


    setIsLoading(true)
    setError(null)
    setActionRunOutput(undefined)

    // Parse body if it's provided for POST/PUT/PATCH requests
    let parsedBody: any = undefined
    if (proxyBody.trim() && ["POST", "PUT", "PATCH"].includes(proxyMethod)) {
      try {
        parsedBody = JSON.parse(proxyBody)
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : "Unknown error"
        setError(`Invalid JSON in request body: ${errorMessage}`)
        setIsLoading(false)
        return
      }
    }

    // Prepare the proxy request object
    const headersObj = getHeadersObject()
    const requestObject = {
      externalUserId: editableExternalUserId,
      accountId: accountId,
      url: proxyUrl,
      method: proxyMethod,
      ...(parsedBody && { data: parsedBody }),
      ...(headersObj && { headers: headersObj }),
    }

    // Log to SDK debugger
    const callId = addCall({
      method: `proxy.${proxyMethod.toLowerCase()}`,
      timestamp: new Date(),
      request: requestObject,
      status: "pending"
    })

    const startTime = Date.now()

    try {
      // Make the actual proxy request using server action
      const proxyResponse = await proxyRequest(requestObject)

      // Update SDK debugger with success
      updateCall(callId, {
        response: proxyResponse.data,
        status: "success",
        duration: Date.now() - startTime
      })

      // Send response data to output
      setActionRunOutput(proxyResponse.data)
    } catch (err: any) {
      // Update SDK debugger with error
      updateCall(callId, {
        error: {
          message: err?.message || "Request failed",
          status: err?.status,
          data: err?.data,
        },
        status: "error",
        duration: Date.now() - startTime
      })

      setError(err?.message || "Request failed")

      // Show error response data in output
      setActionRunOutput({
        error: err?.message || "Request failed",
        status: err?.status,
        data: err?.data,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const showBodyField = ["POST", "PUT", "PATCH"].includes(proxyMethod)

  // Font size constants for consistency
  const fontSize = {
    sm: "0.75rem",   // 12px - labels, helper text
    base: "0.875rem", // 14px - inputs, buttons, body text
    lg: "1rem",       // 16px - headings
  }

  // Styles matching ControlHttpRequest from connect-react
  const inputStyles: React.CSSProperties = {
    color: theme.colors.neutral80,
    backgroundColor: theme.colors.neutral0,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.colors.neutral20,
    padding: 6,
    borderRadius: theme.borderRadius,
    boxShadow: theme.boxShadow.input,
    fontSize: fontSize.base,
    flex: 1,
    width: "100%",
  }

  const methodSelectStyles: React.CSSProperties = {
    ...inputStyles,
    cursor: "pointer",
    flex: "none",
    width: "85px",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  }

  const urlInputStyles: React.CSSProperties = {
    ...inputStyles,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    flex: 1,
  }

  const textareaStyles: React.CSSProperties = {
    ...inputStyles,
    resize: "vertical",
    minHeight: "80px",
    fontFamily: "monospace",
  }

  const buttonStyles: React.CSSProperties = {
    color: "#ffffff",
    backgroundColor: theme.colors.primary,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: `${theme.spacing.baseUnit * 2}px ${theme.spacing.baseUnit * 4}px`,
    borderWidth: 0,
    borderRadius: theme.borderRadius,
    cursor: "pointer",
    fontSize: fontSize.base,
    fontWeight: 500,
    boxShadow: theme.boxShadow.button,
  }

  const disabledButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    opacity: 0.5,
    cursor: "not-allowed",
  }

  const addButtonStyles: React.CSSProperties = {
    color: theme.colors.neutral80,
    backgroundColor: "transparent",
    display: "inline-flex",
    alignItems: "center",
    padding: `${theme.spacing.baseUnit}px ${theme.spacing.baseUnit * 2}px`,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.colors.neutral30,
    borderRadius: theme.borderRadius,
    cursor: "pointer",
    fontSize: fontSize.sm,
    fontWeight: 500,
    gap: theme.spacing.baseUnit * 2,
  }

  const removeButtonStyles: React.CSSProperties = {
    ...addButtonStyles,
    flex: "0 0 auto",
    padding: "6px 8px",
  }

  const itemStyles: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  }

  const labelStyles: React.CSSProperties = {
    fontSize: fontSize.sm,
    fontWeight: 500,
    color: theme.colors.neutral70,
  }

  const sectionStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: `${theme.spacing.baseUnit}px`,
  }

  const containerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  }

  const buttonSectionStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: `${theme.spacing.baseUnit}px`,
    alignItems: "flex-start",
  }

  const selectStyles: React.CSSProperties = {
    color: theme.colors.neutral80,
    backgroundColor: theme.colors.neutral0,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.colors.neutral20,
    padding: 6,
    borderRadius: theme.borderRadius,
    boxShadow: theme.boxShadow.input,
    cursor: "pointer",
    fontSize: fontSize.base,
  }

  const connectButtonStyles: React.CSSProperties = {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius,
    border: "solid 1px",
    borderColor: theme.colors.primary25,
    color: theme.colors.primary25,
    padding: "0.5rem 1rem",
    cursor: "pointer",
    fontSize: fontSize.base,
    fontWeight: 500,
  }

  const credentialsTextStyles: React.CSSProperties = {
    color: theme.colors.neutral50,
    fontWeight: 400,
    fontSize: fontSize.sm,
    lineHeight: "1.5",
    margin: 0,
  }

  const urlRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "stretch",
  }

  const isDisabled = isLoading || !proxyUrl.trim() || !editableExternalUserId?.trim() || !accountId?.trim()

  return (
    <div style={containerStyles}>
      <div style={sectionStyles}>
        <h3 style={{ fontSize: fontSize.lg, fontWeight: 600, color: theme.colors.neutral80, margin: 0 }}>
          API Request Builder
        </h3>
        <p style={{ fontSize: fontSize.base, color: theme.colors.neutral60, margin: 0 }}>
          Make direct API requests through your authenticated account.
        </p>
      </div>

      {/* Account Selector Section */}
      <div style={{ ...sectionStyles, alignItems: "flex-start" }}>
        <span style={labelStyles}>
          {!isLoadingAccounts && accounts.length === 0
            ? `Connect ${selectedApp?.name} account`
            : `Select ${selectedApp?.name} account`
          }
        </span>
        {isLoadingAccounts ? (
          <span style={{ fontSize: fontSize.base, color: theme.colors.neutral50 }}>Loading accounts...</span>
        ) : accounts.length === 0 ? (
          <>
            <button
              type="button"
              onClick={onConnectNewAccount}
              style={connectButtonStyles}
            >
              Connect {selectedApp?.name}
            </button>
            <p style={credentialsTextStyles}>Credentials are encrypted.</p>
          </>
        ) : (
          <select
            value={accountId}
            onChange={(e) => {
              const value = e.target.value
              if (value === "__connect_new__") {
                onConnectNewAccount()
              } else {
                setAccountId(value)
                setEditableExternalUserId(externalUserId)
              }
            }}
            style={selectStyles}
            aria-label="Select account"
          >
            <option value="">Select an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name || account.id}
              </option>
            ))}
            <option value="__connect_new__">+ Connect new account</option>
          </select>
        )}
        {sdkErrors && (
          <div style={{ fontSize: fontSize.base, color: theme.colors.danger }}>
            {String(sdkErrors)}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={containerStyles}>
        {/* URL + Method Section */}
        <div style={sectionStyles}>
          <span style={labelStyles}>URL</span>
          <div style={urlRowStyles}>
            <select
              value={proxyMethod}
              onChange={(e) => setProxyMethod(e.target.value)}
              style={methodSelectStyles}
              aria-label="HTTP method"
            >
              {HTTP_METHODS.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
            <input
              type="text"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              style={urlInputStyles}
              aria-label="URL"
            />
          </div>
        </div>

        {/* Headers Section */}
        <div style={sectionStyles}>
          <span style={labelStyles}>Headers</span>
          {headers.map((header, index) => (
            <div key={index} style={itemStyles}>
              <input
                type="text"
                value={header.key}
                onChange={(e) => handleHeaderChange(index, "key", e.target.value)}
                placeholder="Header name"
                style={inputStyles}
                aria-label={`Header ${index + 1} name`}
              />
              <input
                type="text"
                value={header.value}
                onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                placeholder="Header value"
                style={inputStyles}
                aria-label={`Header ${index + 1} value`}
              />
              {headers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHeader(index)}
                  style={removeButtonStyles}
                  aria-label={`Remove header ${index + 1}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <div style={buttonSectionStyles}>
            <button
              type="button"
              onClick={addHeader}
              style={addButtonStyles}
            >
              <span>+</span>
              <span>Add header</span>
            </button>
          </div>
        </div>

        {/* Body Section */}
        {showBodyField && (
          <div style={sectionStyles}>
            <span style={labelStyles}>Body</span>
            <textarea
              value={proxyBody}
              onChange={(e) => setProxyBody(e.target.value)}
              placeholder='{"key": "value"}'
              style={textareaStyles}
              rows={4}
              aria-label="Request body"
            />
          </div>
        )}

        <div style={buttonSectionStyles}>
          <button
            type="submit"
            disabled={isDisabled}
            style={isDisabled ? disabledButtonStyles : buttonStyles}
          >
            {isLoading ? "Sending Request..." : `Send ${proxyMethod} Request`}
          </button>
        </div>
      </form>

      {error && (
        <div style={{
          padding: 12,
          backgroundColor: theme.colors.dangerLight,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: theme.colors.danger,
          borderRadius: theme.borderRadius,
        }}>
          <p style={{ fontSize: fontSize.base, fontWeight: 500, color: theme.colors.danger, margin: 0 }}>Error</p>
          <p style={{ fontSize: fontSize.base, color: theme.colors.danger, margin: "4px 0 0 0" }}>{error}</p>
        </div>
      )}
    </div>
  )
}
