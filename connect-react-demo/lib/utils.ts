import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Local-dev-only features are gated on the hostname rather than NODE_ENV, since a
// local `pnpm build && pnpm start` still reports "production".
export function isLocalHostname(hostname: string): boolean {
  return ["localhost", "127.0.0.1"].includes(hostname)
}
