import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"

interface AuthSectionProps {
  externalUserId: string
  selectedComponentType: string
  editableExternalUserId?: string
  setEditableExternalUserId?: (value: string) => void
  accountId?: string
  setAccountId?: (value: string) => void
}

export const AuthSection = ({ 
  externalUserId, 
  selectedComponentType,
  editableExternalUserId,
  setEditableExternalUserId,
  accountId,
  setAccountId
}: AuthSectionProps) => (
  <div className="px-4 py-3">
    <div className="space-y-3">
      <div className="grid grid-cols-[140px,1fr] items-center gap-3">
        <div className="text-[13px] font-medium text-zinc-700">User ID</div>
        {selectedComponentType === "proxy" ? (
          <Input
            value={editableExternalUserId || ""}
            onChange={(e) => setEditableExternalUserId?.(e.target.value)}
            placeholder="Enter external user ID"
            className="text-[13px] font-mono h-8"
          />
        ) : (
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
        )}
      </div>
      
      {selectedComponentType === "proxy" && (
        <div className="grid grid-cols-[140px,1fr] items-center gap-3">
          <div className="text-[13px] font-medium text-zinc-700">Account ID</div>
          <Input
            value={accountId || ""}
            onChange={(e) => setAccountId?.(e.target.value)}
            placeholder="Enter account ID"
            className="text-[13px] font-mono h-8"
          />
        </div>
      )}
    </div>
  </div>
)
