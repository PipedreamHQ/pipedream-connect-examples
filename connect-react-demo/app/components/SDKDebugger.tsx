"use client"

import { useSDKLogger, useSDKLoggerCalls, SDKCall } from "@/lib/sdk-logger"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { IoChevronForward, IoTrashOutline, IoCopyOutline, IoCheckmarkOutline } from "react-icons/io5"
import { useState, memo, useCallback } from "react"
import { cn } from "@/lib/utils"

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  success: "bg-green-100 text-green-800", 
  error: "bg-red-100 text-red-800"
} as const

const formatDuration = (ms?: number) => {
  if (!ms) return ""
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

const formatTimestamp = (date: Date) => 
  date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3
  })

const useCopyToClipboard = () => {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  const copyToClipboard = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }, [])
  
  return { copiedField, copyToClipboard }
}

const SDKCallItem = memo(function SDKCallItem({ call }: { call: SDKCall }) {
  const [isOpen, setIsOpen] = useState(false)
  const { copiedField, copyToClipboard } = useCopyToClipboard()

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="group flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b">
          <IoChevronForward 
            className={cn(
              "h-4 w-4 transition-transform text-gray-400",
              isOpen && "rotate-90"
            )}
          />
          
          <Badge 
            variant="secondary" 
            className={cn("text-xs", STATUS_COLORS[call.status])}
          >
            {call.status}
          </Badge>
          
          <code className="text-sm font-mono text-gray-900 font-medium">
            {call.method}
          </code>
          
          <span className="text-xs text-gray-500 ml-auto">
            {formatTimestamp(call.timestamp)}
          </span>
          
          {call.duration && (
            <span className="text-xs text-gray-500">
              {formatDuration(call.duration)}
            </span>
          )}
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="p-4 bg-gray-50 border-b space-y-4">
          {/* Request */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Request</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(call.request, null, 2), "request")}
                className="h-7 px-2"
              >
                {copiedField === "request" ? (
                  <IoCheckmarkOutline className="h-3 w-3" />
                ) : (
                  <IoCopyOutline className="h-3 w-3" />
                )}
              </Button>
            </div>
            <pre className="text-xs bg-white rounded-md p-3 overflow-x-auto border">
              <code>{JSON.stringify(call.request, null, 2)}</code>
            </pre>
          </div>

          {/* Response */}
          {call.response && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Response</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(call.response, null, 2), "response")}
                  className="h-7 px-2"
                >
                  {copiedField === "response" ? (
                    <IoCheckmarkOutline className="h-3 w-3" />
                  ) : (
                    <IoCopyOutline className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="text-xs bg-white rounded-md p-3 overflow-x-auto border max-h-96 overflow-y-auto">
                <code>{JSON.stringify(call.response, null, 2)}</code>
              </pre>
            </div>
          )}

          {/* Error */}
          {call.error && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-red-700">Error</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(call.error, null, 2), "error")}
                  className="h-7 px-2"
                >
                  {copiedField === "error" ? (
                    <IoCheckmarkOutline className="h-3 w-3" />
                  ) : (
                    <IoCopyOutline className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="text-xs bg-red-50 text-red-900 rounded-md p-3 overflow-x-auto border border-red-200">
                <code>{JSON.stringify(call.error, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
})

export function SDKDebugger() {
  const calls = useSDKLoggerCalls()
  const { clearCalls } = useSDKLogger()

  return (
    <div className="flex flex-col bg-gray-50">
      <div className="px-4 md:px-6 py-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">SDK Logs</h2>
            <p className="text-sm text-gray-500 mt-1">
              {calls.length} {calls.length === 1 ? "call" : "calls"} recorded
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearCalls}
            disabled={calls.length === 0}
          >
            <IoTrashOutline className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div>
        {calls.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">No SDK calls recorded yet.</p>
            <p className="text-sm mt-2">
              Interact with the demo app to see API calls appear here.
            </p>
          </div>
        ) : (
          <div>
            {calls.map((call) => (
              <SDKCallItem key={call.id} call={call} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}