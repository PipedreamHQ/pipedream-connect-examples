"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { getAllowedEmailDomains, setAllowedEmailDomains } from "@/app/actions/backendClient"

const parseDomains = (input: string) =>
  input.split(/[\s,]+/).map((d) => d.trim().toLowerCase()).filter(Boolean)

// Local-dev-only editor for the project's allowed email domains. When set, new
// Connect accounts whose OAuth email domain isn't on the list are rejected.
export function AllowedEmailDomains() {
  const [current, setCurrent] = useState<string[] | null>()
  const [apiHost, setApiHost] = useState<string>()
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const apply = (res: Awaited<ReturnType<typeof getAllowedEmailDomains>>) => {
    if (res.error) {
      setError(res.error.message)
      return
    }
    setError(undefined)
    setApiHost(res.data.apiHost)
    setCurrent(res.data.allowedEmailDomains)
    setInput((res.data.allowedEmailDomains ?? []).join(", "))
  }

  const load = useCallback(async () => {
    setBusy(true)
    apply(await getAllowedEmailDomains())
    setBusy(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (domains: string[] | null) => {
    setBusy(true)
    apply(await setAllowedEmailDomains(domains))
    setBusy(false)
  }

  const parsed = parseDomains(input)
  const dirty = parsed.join(",") !== (current ?? []).join(",")

  return (
    <div className="space-y-2">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && dirty && parsed.length) save(parsed)
        }}
        placeholder="example.com, workday.com"
        disabled={busy}
        className="w-full px-3 py-1.5 text-sm font-mono border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={busy || !dirty || !parsed.length} onClick={() => save(parsed)}>
          Save
        </Button>
        <Button size="sm" variant="outline" disabled={busy || current == null} onClick={() => save(null)}>
          Clear
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={load}>
          Refresh
        </Button>
      </div>
      <div className="text-xs text-gray-500">
        {current === undefined
          ? "Loading…"
          : current === null
          ? "Not set: accounts from any email domain can connect."
          : `Enforced: ${current.join(", ")}`}
        {apiHost && <span className="block font-mono">{apiHost}</span>}
      </div>
      {error && <div className="text-xs text-red-600 break-all">{error}</div>}
    </div>
  )
}
