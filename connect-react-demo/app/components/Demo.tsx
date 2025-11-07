"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfigPanel } from "./ConfigPanel";
import { LiveCodePanel } from "./LiveCodePanel";
import { DemoPanel } from "./DemoPanel";
import { SDKDebugger } from "./SDKDebugger";
import { DemoHeader } from "./DemoHeader";
import { DemoTabTrigger } from "./DemoTabTrigger";
import {
  useSDKLoggerCallCount,
  useSDKLoggerPendingCount,
} from "@/lib/sdk-logger";
import {
  IoSettingsOutline,
  IoFlashOutline,
  IoCodeSlashOutline,
  IoChevronDown,
} from "react-icons/io5";
import { cn } from "@/lib/utils";
import { useQueryParams } from "@/lib/use-query-params";

const TABS = [
  { value: "config", icon: IoSettingsOutline, label: "Config" },
  { value: "code", icon: IoCodeSlashOutline, label: "Code" },
  { value: "debug", icon: IoFlashOutline, label: "Debug" },
] as const;

function HeroSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12 border-b bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
          One SDK, thousands of API integrations
        </h1>

        <div className="space-y-6 text-neutral-700">{children}</div>
      </div>
    </div>
  );
}

function DescriptionParagraph({ className }: { className?: string }) {
  return (
    <p className={cn("leading-relaxed", className)}>
      <a
        href="https://pipedream.com/connect"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-600 transition-colors border-b border-blue-200 hover:border-blue-300"
      >
        Pipedream Connect
      </a>{" "}
      provides managed authentication for 3,000+ APIs and access to 10,000+
      prebuilt tools. Roll your own frontend with the server SDK or use{" "}
      <a
        href="https://github.com/PipedreamHQ/pipedream/tree/master/packages/connect-react"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-600 transition-colors border-b border-blue-200 hover:border-blue-300"
      >
        @pipedream/connect-react
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>{" "}
      to get started in minutes.
    </p>
  );
}

function LoadingSkeleton({
  withContainer = false,
}: {
  withContainer?: boolean;
}) {
  const content = (
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
      </div>
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="pt-4 border-t">
        <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
      </div>
    </div>
  );

  return withContainer ? (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
      {content}
    </div>
  ) : (
    content
  );
}

function TabsContainer({
  activeTab,
  onTabChange,
  callCount,
  pendingCount,
  isMobile,
  className,
  tabsListClassName,
  isLoading,
}: {
  activeTab: string;
  onTabChange: (value: string) => void;
  callCount: number;
  pendingCount: number;
  isMobile?: boolean;
  className?: string;
  tabsListClassName?: string;
  isLoading?: boolean;
}) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className={cn("flex flex-col", className)}
    >
      <div className={cn("border-b", isMobile && "flex-shrink-0")}>
        <TabsList
          className={cn(
            "h-12 w-full rounded-none bg-transparent p-0",
            tabsListClassName
          )}
        >
          {TABS.map((tab) => (
            <DemoTabTrigger
              key={tab.value}
              value={tab.value}
              icon={tab.icon}
              label={tab.label}
              callCount={callCount}
              pendingCount={pendingCount}
              isMobile={isMobile}
            />
          ))}
        </TabsList>
      </div>

      {isLoading ? (
        <>
          <TabsContent value="config" className="m-0" forceMount>
            <div style={{ display: activeTab === "config" ? "block" : "none" }}>
              {isMobile ? (
                <div className="flex flex-col">
                  <LoadingSkeleton />
                  <div className="border-t">
                    <LoadingSkeleton />
                  </div>
                </div>
              ) : (
                <LoadingSkeleton />
              )}
            </div>
          </TabsContent>

          <TabsContent value="code" className="m-0" forceMount>
            <div style={{ display: activeTab === "code" ? "block" : "none" }}>
              <LoadingSkeleton />
            </div>
          </TabsContent>

          <TabsContent value="debug" className="m-0" forceMount>
            <div style={{ display: activeTab === "debug" ? "block" : "none" }}>
              <LoadingSkeleton />
            </div>
          </TabsContent>
        </>
      ) : (
        <>
          <TabsContent value="config" className="m-0" forceMount>
            <div style={{ display: activeTab === "config" ? "block" : "none" }}>
              {isMobile ? (
                <div className="flex flex-col">
                  <ConfigPanel />
                  <div className="border-t">
                    <DemoPanel />
                  </div>
                </div>
              ) : (
                <ConfigPanel />
              )}
            </div>
          </TabsContent>

          <TabsContent value="code" className="m-0" forceMount>
            <div style={{ display: activeTab === "code" ? "block" : "none" }}>
              <LiveCodePanel />
            </div>
          </TabsContent>

          <TabsContent value="debug" className="m-0" forceMount>
            <div style={{ display: activeTab === "debug" ? "block" : "none" }}>
              <SDKDebugger />
            </div>
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}

export default function Demo({ isLoading = false }: { isLoading?: boolean }) {
  const { queryParams, setQueryParam } = useQueryParams();
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const callCount = useSDKLoggerCallCount();
  const pendingCount = useSDKLoggerPendingCount();

  const validTabs = ["config", "code", "debug"] as const;
  const tabFromQuery = queryParams.tab as string;
  const activeTab = validTabs.includes(tabFromQuery as any)
    ? tabFromQuery
    : "config";

  const setActiveTab = (tab: string) => {
    setQueryParam("tab", tab === "config" ? undefined : tab);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DemoHeader />

      <HeroSection>
        <div className="hidden sm:block space-y-6">
          <DescriptionParagraph className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto" />
        </div>

        <div className="sm:hidden">
          <Collapsible open={showMoreInfo} onOpenChange={setShowMoreInfo}>
            <CollapsibleTrigger className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <span>More info</span>
              <IoChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  showMoreInfo && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-3">
                <DescriptionParagraph className="text-sm text-gray-600" />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </HeroSection>

      <div className="md:hidden flex flex-col">
        <TabsContainer
          activeTab={activeTab}
          onTabChange={setActiveTab}
          callCount={callCount}
          pendingCount={pendingCount}
          isMobile
          tabsListClassName="justify-center"
          isLoading={isLoading}
        />
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-2 gap-6 px-6 py-6">
          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
            <TabsContainer
              activeTab={activeTab}
              onTabChange={setActiveTab}
              callCount={callCount}
              pendingCount={pendingCount}
              tabsListClassName="justify-start px-4"
              className="bg-gray-50/50"
              isLoading={isLoading}
            />
          </div>

          {isLoading ? (
            <LoadingSkeleton withContainer />
          ) : (
            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-visible">
              <DemoPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
