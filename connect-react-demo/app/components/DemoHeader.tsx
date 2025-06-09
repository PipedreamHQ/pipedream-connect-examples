import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PipedreamLogo } from "./PipedreamLogo"
import { IoHelpCircleOutline, IoMenuOutline } from "react-icons/io5"
import { SiGithub } from "react-icons/si"

const NAV_LINKS = [
  { href: "https://pipedream.com/support", label: "Contact us", icon: IoHelpCircleOutline },
  { href: "https://pipedream.com/docs/connect/components", label: "Read the docs", icon: "📖" },
  { href: "https://github.com/PipedreamHQ/pipedream-connect-examples/tree/master/connect-react-demo", label: "View on GitHub", icon: SiGithub },
]

export function DemoHeader() {
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-neutral-200">
      <div className="flex items-center">
        <PipedreamLogo className="text-neutral-600 h-[18px] w-auto" />
      </div>
      
      <div className="hidden md:flex items-center gap-x-2">
        <Button
          variant="outline"
          className="flex items-center gap-x-2 text-neutral-600 hover:text-neutral-800 border-neutral-200 hover:bg-neutral-50"
          onClick={() => window.open(NAV_LINKS[0].href, "_blank")}
        >
          {NAV_LINKS[0].label}
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-x-2 text-neutral-600 hover:text-neutral-800 border-neutral-200 hover:bg-neutral-50"
          onClick={() => window.open(NAV_LINKS[2].href, "_blank")}
        >
          <SiGithub className="h-4 w-4" />
          {NAV_LINKS[2].label}
        </Button>
        <Button variant="default" className="gap-2" asChild>
          <a href={NAV_LINKS[1].href} target="_blank" rel="noopener noreferrer">
            {NAV_LINKS[1].label}
          </a>
        </Button>
      </div>

      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="!h-11 !w-11 !p-0">
              <IoMenuOutline className="!h-7 !w-7" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {NAV_LINKS.map((link) => (
              <DropdownMenuItem 
                key={link.href}
                onClick={() => window.open(link.href, "_blank")} 
                className="justify-start"
              >
                {typeof link.icon === "string" ? (
                  <div className="h-4 w-4 mr-3 flex items-center justify-center text-sm">
                    {link.icon}
                  </div>
                ) : (
                  <link.icon className="h-4 w-4 mr-3" />
                )}
                {link.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}