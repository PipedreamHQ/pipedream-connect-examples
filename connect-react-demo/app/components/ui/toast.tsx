"use client"

import { Toaster as SonnerToaster } from "sonner"

/**
 * App-wide toast renderer. Mount once near the root; fire toasts from anywhere
 * with the module-level `toast` (or `toast.success` / `toast.error`) export
 * from "sonner" — no provider or context required.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      duration={5000}
    />
  )
}
