"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ConfigPanel } from "./ConfigPanel"
import { DemoHeader } from "./DemoHeader"
import { DemoPanel } from "./DemoPanel"

export default function Demo() {
  return (
    <div className="flex flex-col min-h-0 h-screen">
      <DemoHeader />
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="min-h-0">
          <ResizablePanel
            defaultSize={43}
            minSize={25}
            maxSize={60}
            className="min-h-0 bg-zinc-50"
          >
            <div className="flex flex-col min-h-0 h-full">
              <ConfigPanel />
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-border" />

          <ResizablePanel defaultSize={57} className="min-h-0">
            <div className="flex flex-col min-h-0 h-full">
              <DemoPanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
