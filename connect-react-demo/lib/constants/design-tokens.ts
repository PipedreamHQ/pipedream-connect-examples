// Design tokens for consistent spacing, colors, and other design values

export const SPACING = {
  xs: "0.25rem", // 4px
  sm: "0.5rem",  // 8px
  md: "1rem",    // 16px
  lg: "1.5rem",  // 24px
  xl: "2rem",    // 32px
  xxl: "3rem",   // 48px
} as const

export const HEIGHTS = {
  tab: "3rem",        // 48px (h-12)
  button: "2.5rem",   // 40px (h-10)
  input: "2.25rem",   // 36px (h-9)
} as const

export const BORDER_RADIUS = {
  sm: "0.25rem",  // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem",   // 8px
} as const

export const COLORS = {
  primary: {
    50: "#f0f9ff",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
  },
  neutral: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
  },
  zinc: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    600: "#52525b",
    900: "#18181b",
  }
} as const

export const COMMON_CLASSES = {
  input: "px-3 py-1.5 text-sm font-mono border rounded bg-zinc-50/50",
  button: "px-3 py-1.5 text-xs font-medium font-mono transition-colors",
  toggle: "w-fit flex rounded-md border border-zinc-200 shadow-sm",
  tab: "h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary",
} as const