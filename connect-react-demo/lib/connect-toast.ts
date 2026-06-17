import type {
  PipedreamClient,
  StartConnectOpts,
  ConnectResult,
  ConnectError,
} from "@pipedream/sdk/browser"
import { toast } from "sonner"

/**
 * Wraps a frontend client so that every account connection fires a success or
 * failure toast, while still invoking any caller-provided callbacks. Only
 * `connectAccount` is intercepted; all other methods pass through untouched.
 */
export function withConnectToast(client: PipedreamClient): PipedreamClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop !== "connectAccount") {
        return Reflect.get(target, prop, receiver)
      }

      const original = Reflect.get(target, prop, receiver).bind(target) as PipedreamClient["connectAccount"]

      return (opts: StartConnectOpts) =>
        original({
          ...opts,
          onSuccess: (res: ConnectResult) => {
            toast.success("Account connected", {
              description: res?.id ? `Connected account ${res.id}` : undefined,
            })
            return opts.onSuccess?.(res)
          },
          onError: (err: ConnectError) => {
            toast.error("Connection failed", {
              description: err?.message,
            })
            return opts.onError?.(err)
          },
        })
    },
  })
}
