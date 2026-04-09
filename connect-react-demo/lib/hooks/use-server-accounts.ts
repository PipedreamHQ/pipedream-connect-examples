"use client"

import { useState, useEffect, useCallback, useContext } from "react"
import type { Account } from "@pipedream/sdk"
import { listAccounts } from "@/app/actions/backendClient"
import { SDKLoggerContext } from "@/lib/sdk-logger"

type Opts = {
  externalUserId: string
  app?: string
  enabled?: boolean
}

export function useServerAccounts({ externalUserId, app, enabled = true }: Opts) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const logger = useContext(SDKLoggerContext) // undefined outside SDKLoggerProvider — that's fine

  const refetch = useCallback(async () => {
    if (!enabled || !externalUserId) return
    setIsLoading(true)

    const request = { externalUserId, ...(app && { app }) }
    const startTime = Date.now()
    const callId = logger?.addCall({ method: "accounts.list", timestamp: new Date(), request, status: "pending" })

    try {
      const data = await listAccounts(request)
      setAccounts(data)
      if (callId) logger?.updateCall(callId, { response: data, status: "success", duration: Date.now() - startTime })
    } catch (error) {
      setAccounts([])
      if (callId) logger?.updateCall(callId, {
        error: error instanceof Error ? { message: error.message } : error,
        status: "error",
        duration: Date.now() - startTime,
      })
    } finally {
      setIsLoading(false)
    }
  }, [externalUserId, app, enabled, logger])

  useEffect(() => { refetch() }, [refetch])

  return { accounts, isLoading, refetch }
}
