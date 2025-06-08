import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  IoHelpCircleOutline,
  IoMenuOutline,
} from "react-icons/io5"
import { PipedreamLogo } from "./PipedreamLogo"
import { SiGithub } from "react-icons/si"
import { useState } from "react"

export const DemoHeader = () => {
  const [showInfoModal, setShowInfoModal] = useState(false)
  
  return (
    <>
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-neutral-200 relative">
      {/* Left side - Logo */}
      <div className="flex items-center">
        <PipedreamLogo className="text-neutral-600 h-[18px] w-auto" />
      </div>
      
      {/* Center - Title */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Desktop version with tooltip */}
        <div className="hidden sm:flex items-center gap-x-1.5">
          <h1 className="text-xl font-semibold text-neutral-800">Pipedream Connect Demo</h1>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="inline-flex items-center justify-center">
                  <IoHelpCircleOutline className="h-5 w-5 text-neutral-500 hover:text-neutral-600 cursor-help" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                className="w-[320px] sm:w-[480px] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 bg-neutral-100/95 backdrop-blur-xl border border-neutral-200/50 p-4 shadow-sm"
              >
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-800 leading-relaxed text-balance">
                    One SDK, thousands of API integrations for your app or AI agent
                  </h3>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    Pipedream Connect provides a TypeScript SDK and REST API to
                    let your users securely connect their accounts and integrate
                    with their favorite tools. Common use cases include:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex gap-x-2 text-sm">
                      <span className="text-neutral-500">▸</span>
                      <span className="text-neutral-700 leading-relaxed">
                        <strong className="font-medium text-neutral-800">
                          Managed authentication:
                        </strong>{" "}
                        Securely manage user credentials and API tokens with
                        built-in OAuth token refresh
                      </span>
                    </li>
                    <li className="flex gap-x-2 text-sm">
                      <span className="text-neutral-500">▸</span>
                      <span className="text-neutral-700 leading-relaxed">
                        <strong className="font-medium text-neutral-800">
                          Actions:
                        </strong>{" "}
                        Connect to APIs and perform operations like sending
                        messages or syncing data
                      </span>
                    </li>
                    <li className="flex gap-x-2 text-sm">
                      <span className="text-neutral-500">▸</span>
                      <span className="text-neutral-700 leading-relaxed">
                        <strong className="font-medium text-neutral-800">
                          AI agents:
                        </strong>{" "}
                        Connect your AI agent to all the tools your customers
                        use and enable it to take actions on their behalf
                      </span>
                    </li>
                    <li className="flex gap-x-2 text-sm">
                      <span className="text-neutral-500">▸</span>
                      <span className="text-neutral-700 leading-relaxed">
                        <strong className="font-medium text-neutral-800">
                          Workflow Invocation:
                        </strong>{" "}
                        Write one workflow and run it for all your users
                      </span>
                    </li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Mobile version with modal */}
        <button
          onClick={() => setShowInfoModal(true)}
          className="sm:hidden flex items-center gap-x-1.5"
        >
          <h1 className="text-xl font-semibold text-neutral-800">Connect Demo</h1>
          <IoHelpCircleOutline className="h-5 w-5 text-neutral-500" />
        </button>
      </div>

      {/* Desktop CTAs */}
      <div className="hidden md:flex items-center gap-x-2">
        <Button
          variant="outline"
          className="flex items-center gap-x-2 text-neutral-600 hover:text-neutral-800 border-neutral-200 hover:bg-neutral-50"
          onClick={() => window.open("https://pipedream.com/support", "_blank")}
        >
          Contact us
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-x-2 text-neutral-600 hover:text-neutral-800 border-neutral-200 hover:bg-neutral-50"
          onClick={() => window.open("https://pipedream.com/docs/connect/components", "_blank")}
        >
          Read the docs
        </Button>
        <Button variant="default" className="gap-2" asChild>
          <a
            href="https://github.com/PipedreamHQ/pipedream-connect-examples/tree/master/connect-react-demo"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SiGithub className="h-4 w-4" />
            View on GitHub
          </a>
        </Button>
      </div>

      {/* Mobile hamburger menu */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="!h-11 !w-11 !p-0">
              <IoMenuOutline className="!h-7 !w-7" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => window.open("https://pipedream.com/support", "_blank")} className="justify-start">
              <IoHelpCircleOutline className="h-4 w-4 mr-3" />
              Contact us
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open("https://pipedream.com/docs/connect/components", "_blank")} className="justify-start">
              <div className="h-4 w-4 mr-3 flex items-center justify-center text-sm">📖</div>
              Read the docs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open("https://github.com/PipedreamHQ/pipedream-connect-examples/tree/master/connect-react-demo", "_blank")} className="justify-start">
              <SiGithub className="h-4 w-4 mr-3" />
              View on GitHub
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    
    {/* Info Modal for Mobile */}
    <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pipedream Connect</DialogTitle>
          <DialogDescription className="sr-only">
            Learn about Pipedream Connect
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-800 leading-relaxed">
            One SDK, thousands of API integrations for your app or AI agent
          </h3>
          <p className="text-sm text-neutral-700 leading-relaxed">
            Pipedream Connect provides a TypeScript SDK and REST API to
            let your users securely connect their accounts and integrate
            with their favorite tools. Common use cases include:
          </p>
          <ul className="space-y-2">
            <li className="flex gap-x-2 text-sm">
              <span className="text-neutral-500">▸</span>
              <span className="text-neutral-700 leading-relaxed">
                <strong className="font-medium text-neutral-800">
                  Managed authentication:
                </strong>{" "}
                Securely manage user credentials and API tokens with
                built-in OAuth token refresh
              </span>
            </li>
            <li className="flex gap-x-2 text-sm">
              <span className="text-neutral-500">▸</span>
              <span className="text-neutral-700 leading-relaxed">
                <strong className="font-medium text-neutral-800">
                  Actions:
                </strong>{" "}
                Connect to APIs and perform operations like sending
                messages or syncing data
              </span>
            </li>
            <li className="flex gap-x-2 text-sm">
              <span className="text-neutral-500">▸</span>
              <span className="text-neutral-700 leading-relaxed">
                <strong className="font-medium text-neutral-800">
                  AI agents:
                </strong>{" "}
                Connect your AI agent to all the tools your customers
                use and enable it to take actions on their behalf
              </span>
            </li>
            <li className="flex gap-x-2 text-sm">
              <span className="text-neutral-500">▸</span>
              <span className="text-neutral-700 leading-relaxed">
                <strong className="font-medium text-neutral-800">
                  Workflow Invocation:
                </strong>{" "}
                Write one workflow and run it for all your users
              </span>
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
