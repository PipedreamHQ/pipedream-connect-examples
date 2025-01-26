"use client"

import { SelectApp, SelectComponent } from "@pipedream/connect-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { IoSearchOutline, IoCubeSharp, IoFlashOutline } from "react-icons/io5"
import { useState } from "react"
import { useAppState } from "@/lib/app-state"
import { searchComponentsAction } from "../actions/searchComponents"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const typeOptions = [
  {
    label: "Actions",
    value: "action",
    icon: <IoCubeSharp className="h-4 w-4 text-neutral-600" />,
    description: "Connect to APIs and perform operations",
  },
  {
    label: "Triggers",
    value: "trigger",
    icon: <IoFlashOutline className="h-4 w-4 text-neutral-600" />,
    description: "React to events and webhooks",
  },
]

export const ComponentSelector = () => {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [searchResults, setSearchResults] = useState<{
    sources: string[]
    actions: string[]
  }>({ sources: [], actions: [] })
  
  const { 
    userId, 
    selectedApp,
    setSelectedAppSlug,
    removeSelectedAppSlug,
    selectedComponentType,
    setSelectedComponentType,
    selectedComponent,
    setSelectedComponentKey,
    removeSelectedComponentKey,
  } = useAppState()

  const handleComponentClick = (componentKey: string, type: 'action' | 'trigger') => {
    const appSlug = componentKey.split('-')[0]
    setSelectedComponentType(type)
    setSelectedAppSlug(appSlug)
    setSelectedComponentKey(componentKey)
    setShowResults(false)
  }

  const searchComponents = async () => {
    if (!prompt.trim()) return
    
    setLoading(true)
    try {
      const result = await searchComponentsAction(prompt)
      setSearchResults(result)
      setShowResults(true)
    } catch (error) {
      console.error('Failed to search components:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-1">Component Selection</h2>
          <p className="text-sm text-neutral-600">Choose a component to configure and test</p>
        </div>

        <Tabs defaultValue="natural" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="natural">Natural Language</TabsTrigger>
            <TabsTrigger value="manual">Manual Selection</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {typeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedComponentType(option.value)}
                    className={cn(
                      "flex flex-col items-start p-3 rounded-lg border transition-colors text-left",
                      selectedComponentType === option.value
                        ? "border-neutral-400 bg-neutral-50"
                        : "border-neutral-200 hover:border-neutral-300"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {option.icon}
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <span className="text-xs text-neutral-600">{option.description}</span>
                  </button>
                ))}
              </div>
              
              {selectedComponentType && (
                <div className="space-y-3 pt-2">
                  <SelectApp
                    value={selectedApp}
                    onChange={(app) => {
                      if (app) {
                        setSelectedAppSlug(app.name_slug)
                        removeSelectedComponentKey()
                      } else {
                        removeSelectedAppSlug()
                        removeSelectedComponentKey()
                      }
                    }}
                  />
                  {selectedApp && (
                    <SelectComponent
                      app={selectedApp}
                      componentType={selectedComponentType as "action" | "trigger"}
                      value={selectedComponent}
                      onChange={(comp) => {
                        comp ? setSelectedComponentKey(comp.key) : removeSelectedComponentKey()
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="natural">
            <div>
              <Popover open={showResults} onOpenChange={setShowResults}>
                <PopoverTrigger asChild>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Describe what you're looking for..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchComponents()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={searchComponents}
                      disabled={loading}
                      className="gap-2"
                    >
                      <IoSearchOutline className="h-4 w-4" />
                      Search
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[var(--radix-popover-trigger-width)] p-0" 
                  align="start"
                >
                  <div className="max-h-[300px] overflow-auto p-2">
                    {loading ? (
                      <div className="text-center text-neutral-500 py-4">Searching...</div>
                    ) : (searchResults.sources.length > 0 || searchResults.actions.length > 0) ? (
                      <div className="space-y-4">
                        {searchResults.sources.length > 0 && (
                          <div>
                            <h3 className="font-medium px-2 mb-1 text-sm text-neutral-600">Sources</h3>
                            <div className="space-y-1">
                              {searchResults.sources.map((source) => (
                                <div 
                                  key={source}
                                  onClick={() => handleComponentClick(source, 'trigger')}
                                  className="px-2 py-1.5 rounded text-sm hover:bg-neutral-100 cursor-pointer"
                                >
                                  {source}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {searchResults.actions.length > 0 && (
                          <div>
                            <h3 className="font-medium px-2 mb-1 text-sm text-neutral-600">Actions</h3>
                            <div className="space-y-1">
                              {searchResults.actions.map((action) => (
                                <div 
                                  key={action}
                                  onClick={() => handleComponentClick(action, 'action')}
                                  className="px-2 py-1.5 rounded text-sm hover:bg-neutral-100 cursor-pointer"
                                >
                                  {action}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-neutral-500 py-4">
                        No components found. Try a different search.
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 