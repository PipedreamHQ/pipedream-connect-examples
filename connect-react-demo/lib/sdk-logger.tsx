"use client"

import { createContext, useContext, useCallback, ReactNode, useRef, useMemo, useSyncExternalStore } from "react"
import { FrontendClient } from "@pipedream/sdk/browser"

export interface SDKCall {
  id: string
  method: string
  timestamp: Date
  request: any
  response?: any
  error?: any
  duration?: number
  status: "pending" | "success" | "error"
}

interface SDKLoggerContextType {
  getCalls: () => SDKCall[]
  addCall: (call: Omit<SDKCall, "id">) => string
  updateCall: (id: string, updates: Partial<SDKCall>) => void
  clearCalls: () => void
  subscribe: (callback: () => void) => () => void
  getCallCount: () => number
  getPendingCallCount: () => number
}

const SDKLoggerContext = createContext<SDKLoggerContextType | undefined>(undefined)

// Limit the number of calls we keep in memory
const MAX_CALLS = 100

export function SDKLoggerProvider({ children }: { children: ReactNode }) {
  // Use refs to store data without triggering re-renders
  const callsRef = useRef<SDKCall[]>([])
  const subscribersRef = useRef<Set<() => void>>(new Set())
  const shouldLog = useRef(true) // Always log - this is a demo feature

  const notifySubscribers = useCallback(() => {
    // Queue notifications in the next microtask to avoid state updates during render
    queueMicrotask(() => {
      subscribersRef.current.forEach(callback => callback())
    })
  }, [])

  const addCall = useCallback((call: Omit<SDKCall, "id">) => {
    if (!shouldLog.current) return "" // Skip logging in production
    
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newCall = { ...call, id }
    
    callsRef.current = [newCall, ...callsRef.current].slice(0, MAX_CALLS)
    notifySubscribers()
    
    return id
  }, [notifySubscribers])

  const updateCall = useCallback((id: string, updates: Partial<SDKCall>) => {
    if (!shouldLog.current) return // Skip logging in production
    
    callsRef.current = callsRef.current.map(call => 
      call.id === id ? { ...call, ...updates } : call
    )
    notifySubscribers()
  }, [notifySubscribers])

  const clearCalls = useCallback(() => {
    callsRef.current = []
    notifySubscribers()
  }, [notifySubscribers])

  const getCalls = useCallback(() => callsRef.current, [])
  
  const getCallCount = useCallback(() => callsRef.current.length, [])
  
  const getPendingCallCount = useCallback(() => 
    callsRef.current.filter(c => c.status === "pending").length, [])

  const subscribe = useCallback((callback: () => void) => {
    subscribersRef.current.add(callback)
    return () => {
      subscribersRef.current.delete(callback)
    }
  }, [])

  const contextValue = useMemo(() => ({
    getCalls,
    addCall,
    updateCall,
    clearCalls,
    subscribe,
    getCallCount,
    getPendingCallCount
  }), [getCalls, addCall, updateCall, clearCalls, subscribe, getCallCount, getPendingCallCount])

  return (
    <SDKLoggerContext.Provider value={contextValue}>
      {children}
    </SDKLoggerContext.Provider>
  )
}

export function useSDKLogger() {
  const context = useContext(SDKLoggerContext)
  if (!context) {
    throw new Error("useSDKLogger must be used within SDKLoggerProvider")
  }
  return context
}

// Optimized hooks that only subscribe when data is actually needed
export function useSDKLoggerCalls() {
  const context = useContext(SDKLoggerContext)
  if (!context) {
    throw new Error("useSDKLoggerCalls must be used within SDKLoggerProvider")
  }
  
  return useSyncExternalStore(
    context.subscribe,
    context.getCalls,
    context.getCalls
  )
}

export function useSDKLoggerCallCount() {
  const context = useContext(SDKLoggerContext)
  if (!context) {
    throw new Error("useSDKLoggerCallCount must be used within SDKLoggerProvider")
  }
  
  return useSyncExternalStore(
    context.subscribe,
    context.getCallCount,
    context.getCallCount
  )
}

export function useSDKLoggerPendingCount() {
  const context = useContext(SDKLoggerContext)
  if (!context) {
    throw new Error("useSDKLoggerPendingCount must be used within SDKLoggerProvider")
  }
  
  return useSyncExternalStore(
    context.subscribe,
    context.getPendingCallCount,
    context.getPendingCallCount
  )
}

/**
 * PERFORMANCE OPTIMIZATIONS:
 * 
 * 1. External Store Pattern: Uses refs + useSyncExternalStore to avoid React context re-renders
 * 2. Selective Subscriptions: Components only re-render when they specifically need logger data
 * 3. Memoized Hooks: Separate hooks for different data slices (calls, count, pending count)
 * 4. Always Enabled: Logging is always enabled since this is a demo feature for developers
 * 
 * This ensures that typing in SelectApp or other components that trigger API calls
 * won't cause the entire app tree to re-render unnecessarily.
 */

// Utility to create a logged version of the frontend client
export function createLoggedFrontendClient(
  client: FrontendClient,
  logger: {
    addCall: (call: Omit<SDKCall, "id">) => string
    updateCall: (id: string, updates: Partial<SDKCall>) => void
  }
): FrontendClient {
  const methodsToLog = [
    // App methods
    "getApps",
    "getApp",
    // Component methods
    "getComponents",
    "getComponent",
    "configureComponent",
    "reloadComponentProps",
    // Account methods
    "getAccounts",
    // Action methods
    "runAction",
    // Trigger methods
    "deployTrigger",
    "deleteTrigger",
    "getTrigger",
    "getTriggers",
    "updateTrigger",
    "getTriggerEvents",
    "getTriggerWorkflows",
    "updateTriggerWorkflows",
    "getTriggerWebhooks",
    "updateTriggerWebhooks",
    // Workflow methods
    "invokeWorkflow",
    "invokeWorkflowForExternalUser",
  ]

  const handler: ProxyHandler<FrontendClient> = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      
      if (typeof value === "function" && methodsToLog.includes(String(prop))) {
        return async (...args: any[]) => {
          const startTime = Date.now()
          const callId = logger.addCall({
            method: String(prop),
            timestamp: new Date(),
            request: args[0] || {},
            status: "pending"
          })

          try {
            const result = await value.apply(target, args)
            const duration = Date.now() - startTime
            
            logger.updateCall(callId, {
              response: result,
              status: "success",
              duration
            })
            
            return result
          } catch (error) {
            const duration = Date.now() - startTime
            
            logger.updateCall(callId, {
              error: error instanceof Error ? {
                message: error.message,
                stack: error.stack
              } : error,
              status: "error",
              duration
            })
            
            throw error
          }
        }
      }
      
      return value
    }
  }

  return new Proxy(client, handler)
}