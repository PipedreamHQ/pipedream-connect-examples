import { useState, useCallback } from "react"

interface UseCopyToClipboardReturn {
  copied: boolean
  copy: (text: string) => Promise<void>
  error: string | null
}

export const useCopyToClipboard = (timeout = 2000): UseCopyToClipboardReturn => {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copy = useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      setError("Clipboard not supported")
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setError(null)
      
      setTimeout(() => setCopied(false), timeout)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Copy failed")
      setCopied(false)
    }
  }, [timeout])

  return { copied, copy, error }
}