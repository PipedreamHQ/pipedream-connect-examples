import { IoTerminalOutline } from "react-icons/io5"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Terminal } from "./Terminal"
import type { TerminalOutput } from "./Terminal"
import { SectionHeader } from "./SectionHeader"
import { cn } from "@/lib/utils"

interface TerminalCollapsibleProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  hasOutput: boolean
  output?: TerminalOutput | null
}

export const TerminalCollapsible = ({
  isOpen,
  onOpenChange,
  hasOutput,
  output,
}: TerminalCollapsibleProps) => {
  const getStatusMessage = () => {
    if (!hasOutput) return "Waiting for submission..."
    return "Response received"
  }

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange} className="relative">
      <CollapsibleTrigger asChild>
        <SectionHeader
          title="Output"
          icon={<IoTerminalOutline className="h-4 w-4 text-zinc-400" />}
          variant="terminal"
        >
          <div className="flex items-center space-x-2">
            <StatusIndicator
              active={!hasOutput}
              success={hasOutput && !output?.error}
            />
            <span
              className={cn(
                "text-xs",
                !hasOutput
                  ? "text-zinc-400"
                  : output?.error
                  ? "text-red-400"
                  : "text-emerald-400"
              )}
            >
              {getStatusMessage()}
            </span>
          </div>
        </SectionHeader>
      </CollapsibleTrigger>
      <CollapsibleContent className="relative">
        <div className="absolute inset-0 rounded-b-lg bg-gradient-to-b from-zinc-900/95 to-zinc-900/90 backdrop-blur-[2px] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.3)] border border-zinc-800/50" />
        <div className="absolute inset-[1px] rounded-b-lg bg-gradient-to-b from-zinc-900/95 to-zinc-900/90 border border-white/[0.02]" />
        <div className="relative">
          <Terminal shouldAnimate={!hasOutput} output={output} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

const StatusIndicator = ({
  active,
  success = false,
}: {
  active: boolean
  success?: boolean
}) => (
  <div className="relative">
    <div
      className={cn(
        "w-2 h-2 rounded-full ring-2",
        active
          ? "bg-zinc-400 ring-zinc-400/20"
          : success
          ? "bg-emerald-300 ring-emerald-400/20"
          : "bg-red-400 ring-red-400/20"
      )}
    />
    {active && (
      <div
        className="absolute top-0 left-0 w-2 h-2 rounded-full bg-zinc-400/30 animate-ping"
        style={{
          animationDuration: "2s",
          animationIterationCount: "infinite",
        }}
      />
    )}
  </div>
)
