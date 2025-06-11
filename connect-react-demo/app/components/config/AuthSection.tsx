import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AuthSectionProps {
  externalUserId: string
}

export const AuthSection = ({ externalUserId }: AuthSectionProps) => (
  <div className="px-4 py-3">
    <div className="grid grid-cols-[140px,1fr] items-center gap-3">
      <div className="text-[13px] font-medium text-zinc-700">User ID</div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="px-2 py-1.5 bg-zinc-50 rounded text-[13px] font-mono text-zinc-600 border border-zinc-200 select-all truncate">
              {externalUserId}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="font-mono">
            {externalUserId}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
)
