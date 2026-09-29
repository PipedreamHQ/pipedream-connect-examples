"use client"

import React, { useCallback, useEffect, useState } from "react"
import type { AppOverride, OauthApp } from "@pipedream/sdk"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  getAppOverridesContext,
  createAppOverride,
  updateAppOverride,
  deleteAppOverride,
  createOauthApp,
  updateOauthApp,
  type AppOverridesContext as Context,
} from "@/app/actions/backendClient"
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard"

type FormState = {
  name: string
  oauthAppId: string
  cfmap: Record<string, string>
}

const emptyForm: FormState = { name: "", oauthAppId: "", cfmap: {} }

const inputClass =
  "w-full px-3 py-1.5 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
const monoInputClass = `${inputClass} font-mono`

function formFromOverride(o: AppOverride): FormState {
  return {
    name: o.name,
    oauthAppId: o.oauthAppId ?? "",
    cfmap: Object.fromEntries(Object.entries(o.cfmap ?? {}).map(([k, v]) => [k, String(v ?? "")])),
  }
}

// Local-dev-only picker + manager for Connect app overrides on the selected app.
// See https://pipedream.com/docs/connect/managed-auth/app-overrides
export function AppOverrideSelect({
  appSlug,
  value,
  onChange,
}: {
  appSlug: string
  value?: string
  onChange: (id: string | undefined) => void
}) {
  const [ctx, setCtx] = useState<Context>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    const res = await getAppOverridesContext(appSlug)
    if (res.error) setError(res.error.message)
    else setCtx(res.data)
    setLoading(false)
  }, [appSlug])

  useEffect(() => {
    setCtx(undefined)
    load()
  }, [load])

  // Drop a selection that no longer exists (deleted, or left over in the URL)
  useEffect(() => {
    if (ctx?.app.nameSlug === appSlug && value && !ctx.overrides.some((o) => o.id === value)) {
      onChange(undefined)
    }
  }, [ctx, appSlug, value, onChange])

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <select
          className={monoInputClass}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          disabled={!ctx}
        >
          <option value="">{ctx ? "None" : loading ? "Loading…" : "Unavailable"}</option>
          {ctx?.overrides.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} — {o.id}
            </option>
          ))}
        </select>
        <AppOverridesDialog
          key={appSlug}
          appSlug={appSlug}
          ctx={ctx}
          loading={loading}
          reload={load}
          onCreated={onChange}
        />
      </div>
      {error && <div className="text-xs text-red-700 break-words">{error}</div>}
    </div>
  )
}

function AppOverridesDialog({
  appSlug,
  ctx,
  loading,
  reload,
  onCreated,
}: {
  appSlug: string
  ctx?: Context
  loading: boolean
  reload: () => Promise<void>
  onCreated: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  // undefined = list view, null = creating, AppOverride = editing
  const [editing, setEditing] = useState<AppOverride | null | undefined>(undefined)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const openForm = (o?: AppOverride) => {
    setForm(o ? formFromOverride(o) : emptyForm)
    setEditing(o ?? null)
    setError(undefined)
  }

  const save = async () => {
    if (!ctx) return
    setSaving(true)
    setError(undefined)
    // Send only non-empty custom field values
    const cfmap = Object.fromEntries(Object.entries(form.cfmap).filter(([, v]) => v !== ""))
    const res = editing
      ? await updateAppOverride(editing.id, {
          name: form.name,
          // null clears the attached OAuth client (the SDK type only says string)
          oauthAppId: (form.oauthAppId || null) as string | undefined,
          cfmap,
        })
      : await createAppOverride({
          app: ctx.app.nameSlug,
          name: form.name,
          ...(form.oauthAppId && { oauthAppId: form.oauthAppId }),
          ...(Object.keys(cfmap).length && { cfmap }),
        })
    setSaving(false)
    if (res.error) {
      setError(res.error.message)
      return
    }
    setEditing(undefined)
    await reload()
    // Select a newly created override in the config panel
    if (!editing) onCreated(res.data.id)
  }

  const remove = async (o: AppOverride) => {
    if (!confirm(`Delete override "${o.name}" (${o.id})? Accounts already connected with it stay connected.`)) return
    const res = await deleteAppOverride(o.id)
    if (res.error) setError(res.error.message)
    else await reload()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-auto">Manage</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>App overrides — {ctx?.app.name ?? appSlug}</DialogTitle>
          <DialogDescription>
            Pre-configure custom fields and a custom OAuth client for this app. Local dev only.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 break-words">
            {error}
          </div>
        )}

        {loading && !ctx && <div className="text-sm text-gray-500">Loading…</div>}

        {ctx && editing === undefined && (
          <OverrideList
            ctx={ctx}
            loading={loading}
            onCreate={() => openForm()}
            onEdit={openForm}
            onDelete={remove}
          />
        )}

        {ctx && editing !== undefined && (
          <OverrideForm
            ctx={ctx}
            form={form}
            setForm={setForm}
            isEdit={!!editing}
            saving={saving}
            onSave={save}
            onCancel={() => setEditing(undefined)}
            onOauthAppsChanged={reload}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function OverrideList({
  ctx,
  loading,
  onCreate,
  onEdit,
  onDelete,
}: {
  ctx: Context
  loading: boolean
  onCreate: () => void
  onEdit: (o: AppOverride) => void
  onDelete: (o: AppOverride) => void
}) {
  const oauthAppName = (id?: string) => {
    if (!id) return undefined
    const oa = ctx.oauthApps.find((a) => a.id === id)
    return oa ? `${oa.name} (${id})` : id
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {ctx.overrides.length} override{ctx.overrides.length === 1 ? "" : "s"}
          {loading && " · refreshing…"}
        </span>
        <Button size="sm" onClick={onCreate}>New override</Button>
      </div>

      {ctx.overrides.length === 0 && (
        <div className="text-sm text-gray-500 border border-dashed rounded p-4 text-center">
          No overrides for this app yet.
        </div>
      )}

      {ctx.overrides.map((o) => (
        <div key={o.id} className="border rounded p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium text-sm">{o.name}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <code className="font-mono">{o.id}</code>
                <CopyButton text={o.id} />
                <span className="px-1.5 py-0.5 rounded bg-gray-100">
                  {o.ownerId.startsWith("o_") ? "workspace" : "project"}
                </span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="outline" onClick={() => onEdit(o)}>Edit</Button>
              <Button size="sm" variant="outline" onClick={() => onDelete(o)}>Delete</Button>
            </div>
          </div>
          <dl className="text-xs grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
            <dt className="text-gray-500">OAuth client</dt>
            <dd className="font-mono break-all">{oauthAppName(o.oauthAppId) ?? "Pipedream default"}</dd>
            {Object.entries(o.cfmap ?? {}).map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-gray-500">{k}</dt>
                <dd className="font-mono break-all">{String(v)}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}

function OverrideForm({
  ctx,
  form,
  setForm,
  isEdit,
  saving,
  onSave,
  onCancel,
  onOauthAppsChanged,
}: {
  ctx: Context
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  isEdit: boolean
  saving: boolean
  onSave: () => void
  onCancel: () => void
  onOauthAppsChanged: () => Promise<void>
}) {
  const isOauth = ctx.app.authType === "oauth"
  // Password-type fields can't be pre-defined — the API rejects them in cfmap
  const fields = ctx.app.customFields.filter((f) => f.type !== "password")
  const passwordFields = ctx.app.customFields.filter((f) => f.type === "password")

  return (
    <div className="space-y-4">
      <Field label="Name" hint="Unique per owner">
        <input
          className={inputClass}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Acme ServiceNow"
        />
      </Field>

      {isOauth && (
        <OauthClientPicker
          app={ctx.app.nameSlug}
          oauthApps={ctx.oauthApps}
          value={form.oauthAppId}
          onChange={(oauthAppId) => setForm((f) => ({ ...f, oauthAppId }))}
          onChanged={onOauthAppsChanged}
        />
      )}

      <div className="space-y-3">
        <div className="text-sm font-medium">Custom fields</div>
        {fields.length === 0 && (
          <div className="text-xs text-gray-500">This app has no custom fields you can pre-define.</div>
        )}
        {fields.map((f) => (
          <Field key={f.name} label={f.label || f.name} hint={f.name} description={f.description}>
            <input
              className={monoInputClass}
              value={form.cfmap[f.name] ?? ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, cfmap: { ...s.cfmap, [f.name]: e.target.value } }))
              }
              placeholder="Leave blank to ask the end user"
            />
          </Field>
        ))}
        {passwordFields.length > 0 && (
          <div className="text-xs text-gray-500">
            Not pre-definable (password fields): {passwordFields.map((f) => f.name).join(", ")}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={onSave} disabled={saving || !form.name.trim()}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create override"}
        </Button>
      </div>
    </div>
  )
}

function OauthClientPicker({
  app,
  oauthApps,
  value,
  onChange,
  onChanged,
}: {
  app: string
  oauthApps: OauthApp[]
  value: string
  onChange: (id: string) => void
  onChanged: () => Promise<void>
}) {
  const selected = oauthApps.find((oa) => oa.id === value)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const createClient = async () => {
    setBusy(true)
    setError(undefined)
    const res = await createOauthApp({ app, name: `${app} (dev ${new Date().toISOString().slice(0, 10)})` })
    if (res.error) {
      setError(res.error.message)
    } else if (res.data.id) {
      await onChanged()
      onChange(res.data.id)
    }
    setBusy(false)
  }

  return (
    <div className="space-y-2">
      <Field label="OAuth client" hint="oauthAppId">
        <div className="flex gap-2">
          <select
            className={inputClass}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Pipedream default</option>
            {oauthApps.map((oa) => (
              <option key={oa.id} value={oa.id}>
                {oa.name} — {oa.id}{oa.clientId ? "" : " (no credentials)"}
              </option>
            ))}
            {/* Keep an unknown selected ID visible (e.g. a workspace client not in the list) */}
            {value && !selected && <option value={value}>{value}</option>}
          </select>
          <Button size="sm" variant="outline" onClick={createClient} disabled={busy}>
            New client
          </Button>
        </div>
      </Field>

      {error && <div className="text-xs text-red-700 break-words">{error}</div>}

      {selected?.id && (
        // Keyed so the draft resets when the selection or its saved credentials change
        <OauthClientCredentials
          key={`${selected.id}:${selected.clientId ?? ""}`}
          oauthApp={selected}
          onSaved={onChanged}
        />
      )}
    </div>
  )
}

function OauthClientCredentials({
  oauthApp,
  onSaved,
}: {
  oauthApp: OauthApp
  onSaved: () => Promise<void>
}) {
  // Clients created here start without credentials; prompt for them until set
  const needsCreds = !oauthApp.clientId
  const [editing, setEditing] = useState(needsCreds)
  const [draft, setDraft] = useState({
    clientId: oauthApp.clientId ?? "",
    clientSecret: "",
    scopes: (oauthApp.scopes ?? []).join(" "),
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const save = async () => {
    setBusy(true)
    setError(undefined)
    const res = await updateOauthApp(oauthApp.id!, {
      clientId: draft.clientId,
      // Blank secret keeps the existing one
      ...(draft.clientSecret && { clientSecret: draft.clientSecret }),
      scopes: draft.scopes.split(/[\s,]+/).filter(Boolean),
    })
    setBusy(false)
    if (res.error) setError(res.error.message)
    else await onSaved()
  }

  return (
    <div className="border rounded p-3 space-y-2 bg-gray-50 text-xs">
      <div className="space-y-1">
        <div className="text-gray-600">Redirect URI — register this with the provider:</div>
        <div className="flex items-center gap-2">
          <code className="font-mono break-all">{oauthApp.redirectUri}</code>
          {oauthApp.redirectUri && <CopyButton text={oauthApp.redirectUri} />}
        </div>
      </div>

      {!editing && (
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Client ID:</span>
          <code className="font-mono break-all">{oauthApp.clientId}</code>
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => setEditing(true)}
          >
            edit credentials
          </button>
        </div>
      )}

      {editing && (
        <div className="space-y-2 pt-1">
          {error && <div className="text-red-700 break-words">{error}</div>}
          <input
            className={monoInputClass}
            placeholder="Client ID"
            value={draft.clientId}
            onChange={(e) => setDraft((d) => ({ ...d, clientId: e.target.value }))}
          />
          <input
            className={monoInputClass}
            type="password"
            placeholder={needsCreds ? "Client secret" : "Client secret (blank keeps current)"}
            value={draft.clientSecret}
            onChange={(e) => setDraft((d) => ({ ...d, clientSecret: e.target.value }))}
          />
          <input
            className={monoInputClass}
            placeholder="Scopes, space or comma separated (optional)"
            value={draft.scopes}
            onChange={(e) => setDraft((d) => ({ ...d, scopes: e.target.value }))}
          />
          <div className="flex justify-end gap-2">
            {!needsCreds && (
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={busy}>
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={save}
              disabled={busy || !draft.clientId || (needsCreds && !draft.clientSecret)}
            >
              {busy ? "Saving…" : "Save credentials"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useCopyToClipboard()
  return (
    <button type="button" className="text-blue-600 hover:underline shrink-0" onClick={() => copy(text)}>
      {copied ? "copied" : "copy"}
    </button>
  )
}

function Field({
  label,
  hint,
  description,
  children,
}: {
  label: string
  hint?: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium">{label}</span>
        {hint && <code className="text-xs text-gray-400 font-mono">{hint}</code>}
      </div>
      {description && <div className="text-xs text-gray-500">{description}</div>}
      {children}
    </label>
  )
}
