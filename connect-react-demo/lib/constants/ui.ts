export const TOGGLE_STYLES = {
  active: "bg-zinc-900 text-white",
  inactive: "bg-zinc-50 text-zinc-600 hover:bg-zinc-100",
  separator: "w-px bg-zinc-200"
} as const

export const DROPDOWN_PORTAL_CONFIG = {
  menuPortalTarget: typeof document !== 'undefined' ? document.body : undefined,
  menuPlacement: 'auto' as const,
  menuShouldBlockScroll: false,
  styles: {
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  },
  components: {
    IndicatorSeparator: () => null,
  }
} as const

export const TOOLTIP_COLORS = {
  type: "#d73a49",
  property: "#6f42c1", 
  value: "#22863a",
  number: "#005cc5"
} as const