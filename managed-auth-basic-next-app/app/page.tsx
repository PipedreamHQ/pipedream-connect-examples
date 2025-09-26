/* eslint-disable @next/next/no-img-element */
"use client"

import CodePanel from "./CodePanel";
import { ErrorBoundary } from "./ErrorBoundary";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { serverConnectTokenCreate, getAccountById } from "./server"
import type { GetAppResponse, App, PipedreamClient as FrontendClient } from "@pipedream/sdk/browser";

const frontendHost = process.env.PIPEDREAM_FRONTEND_HOST || "pipedream.com"

export default function Home() {
  // Core Pipedream Connect state
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null)
  const [connectLink, setConnectLink] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [pd, setPd] = useState<FrontendClient | null>(null);
  
  // Selected app and connection state
  const [selectedApp, setSelectedApp] = useState<GetAppResponse | null>(null);
  const [appSlug, setAppSlug] = useState<string>("");
  const [accountId, setAccountId] = useState<string | null>(null)
  const [accountName, setAccountName] = useState<string | null>(null)
  const [isOAuthConfirmed, setIsOAuthConfirmed] = useState(true);
  
  // UI state
  const [error, setError] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<'typescript' | 'python'>('typescript');
  
  // App search dropdown state (grouped for better organization)
  const [searchResults, setSearchResults] = useState<App[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreApps, setHasMoreApps] = useState(true);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Ref to track if token creation is in progress (prevents duplicate creation in StrictMode)
  const tokenCreationInProgress = useRef<boolean>(false);
  const tokenRef = useRef<string | null>(null);
  const expiresAtRef = useRef<Date | null>(null);
  const appsPageRef = useRef<Awaited<ReturnType<FrontendClient["apps"]["list"]>> | null>(null);
  // Ref for Connect section to enable auto-scroll
  const connectSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tokenRef.current = token;
    expiresAtRef.current = expiresAt;
  }, [token, expiresAt]);

  useEffect(() => {
    // Only create client when we have a token for the first time
    if (!externalUserId || !token || pd) {
      return;
    }

    async function loadClient() {
      const { createFrontendClient } = await import('@pipedream/sdk/browser');
      const client = createFrontendClient({
        frontendHost,
        externalUserId,
        token,
        tokenCallback: async () => {
          if (!externalUserId) {
            throw new Error("No external user ID provided");
          }

          const currentToken = tokenRef.current;
          const currentExpiresAt = expiresAtRef.current;
          if (currentToken && currentExpiresAt && currentExpiresAt > new Date()) {
            return {
              token: currentToken,
              expiresAt: currentExpiresAt,
            };
          }

          const res = await fetch("/api/pipedream/token", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ externalUserId }),
          });

          if (!res.ok) {
            throw new Error("Failed to refresh connect token");
          }

          const response = await res.json();
          const nextExpiresAt = ensureDate(response.expiresAt);
          setToken(response.token);
          setConnectLink(response.connectLinkUrl);
          setExpiresAt(nextExpiresAt);

          return {
            token: response.token,
            expiresAt: nextExpiresAt,
          };
        },
      });
      setPd(client);
    }

    loadClient();
  }, [externalUserId, token, pd]);

  const searchParams = useSearchParams()

  const docsConnect = "https://pipedream.com/docs/connect/"
  const docsTokenCreate =
    "https://pipedream.com/docs/connect/managed-auth/tokens"
  const frontendSDKDocs = "https://pipedream.com/docs/connect/api-reference/sdks#browser-usage"

  // Reusable link component
  const ExternalLink = ({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`hover:underline text-blue-600 font-semibold ${className}`}
    >
      {children}
    </a>
  )

  const ensureDate = (value: Date | string): Date =>
    value instanceof Date ? value : new Date(value);

  interface ConnectResult {
    id: string
  }

  interface ConnectStatus {
    successful: boolean
    completed: boolean
  }

  interface ConnectConfig {
    app: string
    token?: string
    onSuccess: (result: ConnectResult) => void
    onError?: (error: Error) => void
    onClose?: (status: ConnectStatus) => void
  }

  const connectApp = async (appSlug: string) => {
    if (!externalUserId) {
      throw new Error("External user ID is required.");
    }
    if (!token) {
      throw new Error("Token is required.");
    }
    setAppSlug(appSlug)
    
    const connectConfig: ConnectConfig = {
      app: appSlug,
      token,
      onSuccess: async ({ id }: ConnectResult) => {
        console.log('🎉 Connection successful!', { accountId: id });
        setAccountId(id);
        
        // Fetch account details to get the name
        try {
          const account = await getAccountById(id);
          setAccountName(account.name);
        } catch (error) {
          console.error('Error fetching account details:', error);
        }

        // Create a new connect token since the current one is now revoked
        try {
          console.log('🔄 Creating new connect token after successful connection...');
          const newTokenResponse = await serverConnectTokenCreate({
            externalUserId: externalUserId!
          });
          setToken(newTokenResponse.token);
          setConnectLink(newTokenResponse.connectLinkUrl);
          setExpiresAt(ensureDate(newTokenResponse.expiresAt));
          console.log('✅ New connect token created successfully');
        } catch (error) {
          console.error('❌ Error creating new connect token:', error);
        }
      },
      onError: (error: Error) => {
        console.error('❌ Connection error:', error);
      },
      onClose: (status: ConnectStatus) => {
        console.log('🚪 Connection dialog closed:', {
          successful: status.successful,
          completed: status.completed
        });
      }
    }

    if (!pd) {
      console.error("Pipedream SDK not loaded")
      return
    }
    
    // Log SDK version and connection start
    const getSDKVersion = () => {
      // Return known SDK version
      return '2.0.7';
    };
    
    const version = getSDKVersion();
    console.log('🚀 Starting Pipedream Connect flow', {
      app: appSlug,
      sdkVersion: version,
      timestamp: new Date().toISOString()
    });
    
    pd.connectAccount(connectConfig)
  }

  const connectAccount = async () => {
    if (!selectedApp) return
    await connectApp(selectedApp.data.nameSlug)
  }

  useEffect(() => {
    // Prevent duplicate token creation (especially in React StrictMode)
    if (token || tokenCreationInProgress.current) return;
    
    tokenCreationInProgress.current = true;
    
    const uuid = searchParams.get("uuid") || sessionStorage.getItem('pipedream-external-user-id') || crypto.randomUUID();
    
    // Store the UUID to ensure stability across re-renders
    sessionStorage.setItem('pipedream-external-user-id', uuid);
    
    if (!uuid) {
      console.error("No external user ID provided")
      tokenCreationInProgress.current = false;
      return
    }
    setExternalUserId(uuid);

    // Create token immediately after setting external user ID
    (async () => {
      try {
        console.log('Creating token for external user:', uuid);
        const { token, connectLinkUrl, expiresAt: expiresAtValue } = await serverConnectTokenCreate({
          externalUserId: uuid,
        })
        console.log('Token created successfully');
        setToken(token)
        setConnectLink(connectLinkUrl)
        setExpiresAt(ensureDate(expiresAtValue))
      } catch (error) {
        console.error("Error creating token:", error)
      } finally {
        tokenCreationInProgress.current = false;
      }
    })()
  }, [searchParams, token]);

  const handleAppSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAppSlug(value);
    setError("");
    setSelectedIndex(-1); // Reset selection
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (value.length > 0) {
      setShowDropdown(true);
      setIsSearching(true);
      
      // Debounce search to avoid too many API calls
      const timeout = setTimeout(async () => {
        try {
          setCurrentQuery(value);
          appsPageRef.current = null; // Reset pagination for new search
          await searchAppsClient(value, 10);
        } catch (err) {
          console.error("Search error:", err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300); // 300ms debounce
      
      setSearchTimeout(timeout);
    } else {
      setShowDropdown(false);
      setSearchResults([]);
      setIsSearching(false);
      setCurrentQuery("");
      setHasMoreApps(true);
      appsPageRef.current = null;
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || searchResults.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < searchResults.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : searchResults.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleAppSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  }
  
  const searchAppsClient = useCallback(async (query?: string, limit: number = 10, append: boolean = false): Promise<App[]> => {
    if (!pd) {
      console.error("Pipedream client not loaded");
      return [];
    }

    console.log('Searching apps with SDK client', { query, limit, append });

    try {
      const pageLimit = limit * 2; // Request more to account for filtering

      if (!append) {
        appsPageRef.current = await pd.apps.list({
          q: query,
          limit: pageLimit,
          sortKey: "featured_weight",
          sortDirection: "desc",
        });
      } else {
        const page = appsPageRef.current;
        if (!page) {
          return [];
        }
        if (!page.hasNextPage()) {
          setHasMoreApps(false);
          return [];
        }
        await page.getNextPage();
      }

      const page = appsPageRef.current;
      if (!page) {
        return [];
      }

      const filteredApps = page.data.filter((app) => app.authType !== null);
      const limitedApps = filteredApps.slice(0, limit);

      setHasMoreApps(page.hasNextPage());

      if (append) {
        setSearchResults(prevResults => {
          const existingIds = new Set(prevResults.map(app => app.nameSlug));
          const newApps = limitedApps.filter(app => !existingIds.has(app.nameSlug));
          return [...prevResults, ...newApps];
        });
      } else {
        setSearchResults(limitedApps);
      }

      return limitedApps;
    } catch (error) {
      console.error("Error fetching apps:", error);
      if (!append) {
        setSearchResults([]);
        setHasMoreApps(false);
      }
      return [];
    }
  }, [pd]);

  const loadMoreApps = async () => {
    if (isLoadingMore || !hasMoreApps || !appsPageRef.current) return;
    
    setIsLoadingMore(true);
    try {
      // Load more apps with the current query
      await searchAppsClient(currentQuery, 10, true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleAppSlugFocus = async () => {
    // Load popular apps when user clicks into the input
    if (searchResults.length === 0) {
      setShowDropdown(true);
      setIsSearching(true);
      setCurrentQuery("");
      appsPageRef.current = null;
      
      try {
        await searchAppsClient(undefined, 10); // No query = popular apps
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setShowDropdown(true);
    }
  }
  
  const handleAppSelect = (app: App) => {
    setAppSlug(app.nameSlug);
    setShowDropdown(false);
    setError("");
    // Automatically submit the form when an app is selected
    handleSubmitWithApp(app);
  }
  
  const handleSubmitWithApp = async (app: App) => {
    try {
      // Create a mock GetAppResponse from the App data
      const mockResponse: GetAppResponse = {
        data: app
      };
      setSelectedApp(mockResponse);
      
      // Auto-scroll to Connect section after a brief delay
      setTimeout(() => {
        connectSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    } catch (err) {
      console.error("Error:", err);
      setError(`Couldn't load the app ${app.nameSlug}`);
    }
  }

  // Set OAuth confirmed state when app changes
  useEffect(() => {
    setIsOAuthConfirmed(true);
    // Reset account info when switching apps
    setAccountId(null);
    setAccountName(null);
  }, [selectedApp]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.app-search-container')) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Cleanup search timeout on unmount or timeout change
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);
  
  return (
    <main className="p-8 flex flex-col gap-2 max-w-6xl mb-48 mx-auto">
      {externalUserId && (
        <div>
          <h1 className="text-title mb-8">Pipedream Connect: Managed Auth Demo App</h1>
          <div className="mb-4 text-body">
            <p className="mb-4">Refer to the <ExternalLink href={docsConnect}>Pipedream Connect docs</ExternalLink> for a full walkthrough of how to configure Connect for your app.</p>
            <p>When your customers connect accounts with Pipedream, you&apos;ll pass their unique user ID in your system — whatever you use to identify them. In this example, we&apos;ll generate a random external user ID for you:
              <span className="text-code font-bold"> {externalUserId}.</span>
            </p>
          </div>
          <div className="border border-b mb-4"></div>
          
          <div className="mb-8">
            <p className="text-body">In <code>server.ts</code>, the app calls <code>serverConnectTokenCreate</code> to create a short-lived token for the user. You&apos;ll use that token to initiate app connection requests from your app securely. <ExternalLink href={docsTokenCreate}>See the docs</ExternalLink> for more info.</p>
          </div>
          <div className="mb-8">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="flex items-center px-4 py-2 bg-gray-800">
                <div className="flex">
                  <button
                    onClick={() => setSelectedLanguage('typescript')}
                    className={`flex items-center justify-center gap-2 w-32 px-3 pt-3 pb-4 text-sm transition-all duration-200 border-b-2 ${
                      selectedLanguage === 'typescript'
                        ? 'text-gray-100 border-gray-100'
                        : 'text-gray-400 border-transparent hover:text-gray-200'
                    }`}
                  >
                    <img 
                      src="/typescript-icon.svg" 
                      alt="TypeScript" 
                      className="w-4 h-4"
                    />
                    TypeScript
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('python')}
                    className={`flex items-center justify-center gap-2 w-32 px-3 pt-3 pb-4 text-sm transition-all duration-200 border-b-2 ${
                      selectedLanguage === 'python'
                        ? 'text-gray-100 border-gray-100'
                        : 'text-gray-400 border-transparent hover:text-gray-200'
                    }`}
                  >
                    <img 
                      src="/python-icon.svg" 
                      alt="Python" 
                      className="w-4 h-4"
                    />
                    Python
                  </button>
                </div>
              </div>
              <div className="relative">
                <CodePanel
                  language={selectedLanguage === 'typescript' ? 'typescript' : 'python'}
                  code={selectedLanguage === 'typescript' 
                    ? `import { PipedreamClient } from "@pipedream/sdk";

const client = new PipedreamClient({
  projectId: "your_project_id",
  projectEnvironment: "development", // or "production"
  clientId: "your_client_id",
  clientSecret: "your_client_secret"
});

const resp = await client.tokens.create({
  externalUserId: "${externalUserId}", // The end user's ID in your system, this is an example
});

console.log(resp);`
                    : `from pipedream import Pipedream

client = Pipedream(
  project_id="your_project_id",
  project_environment="development", # or "production"
  client_id="your_client_id",
  client_secret="your_client_secret",
)

resp = client.tokens.create(
  external_user_id="${externalUserId}",
)

print(resp);`}
                />
              </div>
            </div>
          </div>

          {token && (
            <div className="mb-4 text-gray-600">
              <p>
                <span className="font-semibold">Connect Token:</span>
                <span className="font-code"> {token}; </span>
                <span className="font-semibold"> expiry: </span>
                <span className="font-code">{expiresAt?.toISOString()}</span>
              </p>
            </div>
          )}
          
          <div className="py-2">
            <p className="text-subtitle pb-2">Select an app to connect</p>
            <ErrorBoundary>
              <div className="app-search-container relative max-w-md py-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  {selectedApp ? (
                    <div className="shadow border rounded w-full px-3 py-2 bg-gray-50 border-gray-300 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={selectedApp.data.imgSrc} 
                          alt={selectedApp.data.name}
                          className="w-6 h-6 rounded"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{selectedApp.data.name}</div>
                          <div className="text-sm text-gray-500">{selectedApp.data.nameSlug}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedApp(null);
                          setAppSlug("");
                          setAccountId(null);
                          setAccountName(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Clear selection"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        className="shadow appearance-none border rounded w-full px-3 py-2 pr-8 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                        id="app-slug"
                        type="text"
                        placeholder="Search apps (e.g., slack, google sheets)"
                        value={appSlug}
                        onChange={handleAppSlugChange}
                        onFocus={handleAppSlugFocus}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={showDropdown}
                        aria-haspopup="listbox"
                        aria-controls="app-dropdown"
                        aria-activedescendant={selectedIndex >= 0 ? `app-option-${selectedIndex}` : undefined}
                        aria-label="Search for apps to connect"
                      />
                      {appSlug && (
                        <button
                          onClick={() => {
                            setAppSlug("");
                            setSearchResults([]);
                            setShowDropdown(false);
                            setCurrentQuery("");
                            setHasMoreApps(true);
                            appsPageRef.current = null;
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                          title="Clear search"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}
                  {showDropdown && (
                    <div 
                      id="app-dropdown"
                      role="listbox"
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto">
                      {isSearching ? (
                        <div className="px-4 py-2 text-gray-500">
                          Searching...
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((app, index) => (
                          <div
                            key={app.nameSlug}
                            id={`app-option-${index}`}
                            role="option"
                            aria-selected={index === selectedIndex}
                            className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              index === selectedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                            onClick={() => handleAppSelect(app)}
                          >
                            <img
                              src={app.imgSrc}
                              alt={app.name}
                              className="w-8 h-8 rounded mr-3 object-contain"
                              onError={(e) => {
                                // Fallback for broken images
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                <span>{app.name}</span>
                                <code className="text-sm font-normal text-gray-500 truncate">{' ('}{app.nameSlug}{')'}</code>
                              </div>
                              {app.description && (
                                <div className="text-sm text-gray-400 mt-1 line-clamp-2">{app.description}</div>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 ml-2">
                              {app.authType === 'oauth' ? 'OAuth' : 
                               app.authType === 'keys' ? 'API Keys' : 
                               'No Auth'}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">
                          No apps found
                        </div>
                      )}
                      {!isSearching && searchResults.length > 0 && hasMoreApps && (
                        <div className="border-t border-gray-100">
                          <button
                            onClick={loadMoreApps}
                            disabled={isLoadingMore}
                            className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 focus:outline-none focus:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoadingMore ? 'Loading...' : 'Load more'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {error && <p className="text-red-600 mt-2">{error}</p>}
            </ErrorBoundary>
          </div>


        {selectedApp && (
          (selectedApp as GetAppResponse).data.authType !== 'oauth' || isOAuthConfirmed
        ) && (
          <>
            <div className="border border-b my-2"></div>
              
              <div className="my-8" ref={connectSectionRef}>
                <h2 className="text-title mb-4">Connect your account</h2>
                <div className="my-4">
                  <p className="text-subtitle">Option 1: Connect via SDK</p>
                  <p className="text-body">Use the frontend SDK to open a Pipedream iFrame directly from your site (<ExternalLink href={frontendSDKDocs} className="">see docs</ExternalLink>).</p>
                  <button 
                    className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded mt-2"
                    onClick={connectAccount}
                  >
                    Connect {selectedApp.data.name}
                  </button>
                  {accountId && (
                    <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                      <div className="mb-2">
                        ✅ Account connected! {accountName ? (
                          <><strong>{accountName}</strong> <span> (ID: </span><code className="font-mono">{accountId}</code><span>)</span></>
                        ) : (
                          <>Account ID: <code className="font-mono">{accountId}</code></>
                        )}
                      </div>
                      <div className="text-sm">
                        <span>You can manage your users and their connected accounts in the </span>
                        <ExternalLink 
                          href={`https://pipedream.com/@pd-connect-testing/projects/${process.env.NEXT_PUBLIC_PIPEDREAM_PROJECT_ID}/connect/users`}
                          className="text-blue-800 hover:text-blue-900 underline font-bold"
                        >
                          Pipedream UI
                        </ExternalLink>
                        <span>{' '}or{' '}</span>
                        <ExternalLink 
                          href="https://pipedream.com/docs/connect/api-reference/list-accounts"
                          className="text-blue-800 hover:text-blue-900 underline font-bold"
                        >
                          via the API
                        </ExternalLink>
                      </div>
                    </div>
                  )}
                  <p className="my-4 text-body">
                    You&apos;ll call <code>connectAccount()</code> with the token and the app slug of the app you&apos;d like to connect:
                  </p>
                  <CodePanel
                    language="typescript"
                    code={`import { createFrontendClient } from "@pipedream/sdk/browser";

const externalUserId = "${externalUserId || '[EXTERNAL_USER_ID]'}";

const pd = createFrontendClient({
  externalUserId,
  tokenCallback: async () => {
    const res = await fetch("/api/pipedream/token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ externalUserId }),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch connect token");
    }

    const { token, expiresAt } = await res.json();
    return { token, expiresAt: new Date(expiresAt) };
  },
});

pd.connectAccount({
  app: "${selectedApp.data.nameSlug}",
  onSuccess: ({ id: accountId }) => {
    console.log('🎉 Connection successful!', { accountId });
  },
});`}
                  />
                </div>
                <div className="mt-8">
                  <p className="text-subtitle">Option 2: Connect Link</p>
                  <div className="text-body">
                    <span>Give your users a link to connect their account. This is useful if you aren&apos;t able to execute JavaScript or open an iFrame from your app. </span>
                    <span><ExternalLink href="https://pipedream.com/docs/connect/connect-link" className="">See the docs</ExternalLink> for more info.{' '}</span>
                    <span><ExternalLink href="https://pipedream.com/docs/connect/mcp/developers" className="">Pipedream&apos;s MCP server</ExternalLink> {' '}</span>
                    <span>also uses Connect Link URLs let users dynamically connect accounts within the context of a chat conversation.</span>
                  </div>
                  {connectLink && (
                    <a 
                      href={`${connectLink}&app=${selectedApp.data.nameSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono hover:underline text-blue-600 block mt-2"
                    >
                      {connectLink}&app={selectedApp.data.nameSlug}
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
