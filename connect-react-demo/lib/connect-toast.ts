import type { PipedreamClient } from "@pipedream/sdk/browser"

type ToastFn = (t: {
  variant: "success" | "error"
  title: string
  description?: string
}) => void

/**
 * Wraps a frontend client so that every account connection — whether triggered
 * from the proxy flow or from within connect-react's component form — fires a
 * success or failure toast, while still invoking any caller-provided callbacks.
 */
export function withConnectToast(client: PipedreamClient, toast: ToastFn): PipedreamClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop !== "connectAccount") {
        return Reflect.get(target, prop, receiver)
      }

      const original = Reflect.get(target, prop, receiver) as (opts: any) => unknown

      return (opts: any) =>
        original({
          ...opts,
          onSuccess: async (account: { id: string }) => {
            toast({
              variant: "success",
              title: "Account connected",
              description: account?.id ? `Connected account ${account.id}` : undefined,
            })
            return opts?.onSuccess?.(account)
          },
          onError: (error: Error) => {
            toast({
              variant: "error",
              title: "Connection failed",
              description: error?.message,
            })
            return opts?.onError?.(error)
          },
        })
    },
  })
}
