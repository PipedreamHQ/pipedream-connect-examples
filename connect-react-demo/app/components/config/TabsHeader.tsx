import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export const TabsHeader = () => (
  <Tabs defaultValue="actions" className="mb-4 relative">
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="actions">Actions</TabsTrigger>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <TabsTrigger value="triggers" disabled className="w-full">
                Triggers
              </TabsTrigger>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Coming soon</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TabsList>
  </Tabs>
)
