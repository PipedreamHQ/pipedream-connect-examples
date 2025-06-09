import type { CustomizationOption } from "@/lib/types/pipedream"

export function PageSkeleton({
  children,
  customizationOption,
}: {
  children: React.ReactNode
  customizationOption: CustomizationOption | null
}) {
  const isDark = customizationOption?.name === "dark"

  return (
    <div className="relative">
      <div className="space-y-4">
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="flex flex-col shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
              <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white'}`}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full border ${isDark ? 'border-zinc-600' : 'border-zinc-300'}`} />
                  <div className={`w-3 h-3 rounded-full border ${isDark ? 'border-zinc-600' : 'border-zinc-300'}`} />
                  <div className={`w-3 h-3 rounded-full border ${isDark ? 'border-zinc-600' : 'border-zinc-300'}`} />
                </div>

                <div className={`flex-1 flex items-center rounded border px-3 py-1.5 text-sm ${isDark ? 'bg-zinc-700/80 border-zinc-600/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.02)]' : 'bg-zinc-50/80 border-zinc-200/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'}`}>
                  <div className={`h-3 w-3 rounded-sm ${isDark ? 'bg-zinc-500' : 'bg-gray-200'}`} />
                  <div className={`ml-2 text-xs font-medium font-mono ${isDark ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    preview.myapp.com
                  </div>
                </div>
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
