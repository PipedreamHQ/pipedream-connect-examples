import { TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DemoTabTriggerProps {
  value: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  callCount?: number
  pendingCount?: number
  className?: string
  isMobile?: boolean
}

export function DemoTabTrigger({ 
  value, 
  icon: Icon, 
  label, 
  callCount = 0, 
  pendingCount = 0, 
  className,
  isMobile = false 
}: DemoTabTriggerProps) {
  const baseClasses = "h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
  const mobileClasses = "px-4 flex-1"
  const desktopClasses = "px-6"
  
  return (
    <TabsTrigger 
      value={value}
      className={cn(
        baseClasses,
        isMobile ? mobileClasses : desktopClasses,
        value === "debug" && "relative",
        className
      )}
    >
      <Icon className={cn("h-4 w-4", !isMobile && "mr-2")} />
      <span className={cn(isMobile && "ml-2")}>{label}</span>
      {value === "debug" && callCount > 0 && (
        <Badge 
          variant={pendingCount > 0 ? "default" : "secondary"} 
          className={cn(
            "text-xs",
            isMobile ? "ml-1 h-4 px-1" : "ml-2 h-5 px-1.5"
          )}
        >
          {callCount}
        </Badge>
      )}
    </TabsTrigger>
  )
}