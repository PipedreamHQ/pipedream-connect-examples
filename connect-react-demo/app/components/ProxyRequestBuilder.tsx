import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAppState } from "@/lib/app-state"
import { proxyRequest } from "@/app/actions/backendClient"

const HTTP_METHODS = [
  "GET",
  "POST", 
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS"
] as const

export function ProxyRequestBuilder() {
  const {
    proxyUrl,
    setProxyUrl,
    proxyMethod,
    setProxyMethod,
    proxyBody,
    setProxyBody,
    editableExternalUserId,
    accountId,
    selectedApp
  } = useAppState()

  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Auto-fill proxy URL when app is selected
  useEffect(() => {
    if (selectedApp?.connect?.base_proxy_target_url && !proxyUrl) {
      setProxyUrl(selectedApp.connect.base_proxy_target_url)
    }
  }, [selectedApp, proxyUrl, setProxyUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!proxyUrl.trim()) {
      setError("URL is required")
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
    setResponse(null)

    try {
      // Parse body if it's provided for POST/PUT/PATCH requests
      let parsedBody: any = undefined
      if (proxyBody.trim() && ["POST", "PUT", "PATCH"].includes(proxyMethod)) {
        try {
          parsedBody = JSON.parse(proxyBody)
        } catch (parseError) {
          setError("Invalid JSON in request body")
          setIsLoading(false)
          return
        }
      }

      // Prepare the proxy request object
      const requestObject = {
        externalUserId: editableExternalUserId,
        accountId: accountId,
        url: proxyUrl,
        method: proxyMethod,
        ...(parsedBody && { data: parsedBody })
      }

      // Log the request object to console
      console.log('🔄 Sending proxy request:', requestObject)

      // Make the actual proxy request using server action
      const proxyResponse = await proxyRequest(requestObject)
      
      setResponse({
        status: proxyResponse.status || 200,
        data: proxyResponse.data,
        headers: proxyResponse.headers || {},
        request: {
          url: proxyUrl,
          method: proxyMethod,
          body: parsedBody,
          externalUserId: editableExternalUserId,
          accountId
        }
      })
    } catch (err: any) {
      setError(err?.message || "Request failed")
      
      // If there's response data in the error, show it
      if (err?.status || err?.data) {
        setResponse({
          status: err.status || 500,
          error: true,
          data: err.data,
          headers: err.headers,
          request: {
            url: proxyUrl,
            method: proxyMethod,
            body: parsedBody,
            externalUserId: editableExternalUserId,
            accountId
          }
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const showBodyField = ["POST", "PUT", "PATCH"].includes(proxyMethod)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Request Builder</h3>
          <p className="text-sm text-gray-600 mb-4">
            Make direct API requests through your authenticated account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proxy-url" className="text-sm font-medium">
              Request URL or Path
            </Label>
            <Input
              id="proxy-url"
              type="text"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint or /api/v1/users"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Enter a full URL or a path (e.g., /api/v1/users)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proxy-method" className="text-sm font-medium">
              HTTP Method
            </Label>
            <Select value={proxyMethod} onValueChange={setProxyMethod}>
              <SelectTrigger id="proxy-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showBodyField && (
            <div className="space-y-2">
              <Label htmlFor="proxy-body" className="text-sm font-medium">
                Request Body
              </Label>
              <textarea
                id="proxy-body"
                value={proxyBody}
                onChange={(e) => setProxyBody(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full h-32 px-3 py-2 text-sm font-mono border border-gray-300 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500">
                Enter JSON data for the request body
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading || !proxyUrl.trim() || !editableExternalUserId?.trim() || !accountId?.trim()}
            className="w-full"
          >
            {isLoading ? "Sending Request..." : `Send ${proxyMethod} Request`}
          </Button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">Error</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {response && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Response</h4>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              response.error 
                ? 'bg-red-100 text-red-700' 
                : response.status >= 200 && response.status < 300
                ? 'bg-green-100 text-green-700'
                : response.status >= 400
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              Status: {response.status}
            </div>
          </div>
          
          {/* Always show headers section, even if empty, for debugging */}
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-2">
              Response Headers 
              {response.headers && Object.keys(response.headers).length === 0 && (
                <span className="text-xs text-gray-500 font-normal ml-2">(No headers captured)</span>
              )}
            </h5>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm font-mono max-h-40 overflow-y-auto">
              <pre className="text-blue-800 whitespace-pre-wrap">
                {response.headers && Object.keys(response.headers).length > 0 
                  ? JSON.stringify(response.headers, null, 2)
                  : "No headers available in response"
                }
              </pre>
            </div>
          </div>
          
          <div>
            <h5 className="text-xs font-medium text-gray-700 mb-2">Response Data</h5>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs font-mono max-h-64 overflow-y-auto">
              <pre className="text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          </div>
          
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700 font-medium">
              Request Details
            </summary>
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded font-mono">
              <pre className="text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(response.request, null, 2)}
              </pre>
            </div>
          </details>

          {/* Debug section to see raw response structure */}
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700 font-medium">
              Debug: Raw Response Structure
            </summary>
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded font-mono">
              <pre className="text-yellow-800 whitespace-pre-wrap">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}