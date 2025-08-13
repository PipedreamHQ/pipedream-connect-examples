"use client"

import CodePanel from "./CodePanel";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { serverConnectTokenCreate, getAppInfo, getAccountById } from "./server"
import { type GetAppResponse, type BrowserClient, type App } from "@pipedream/sdk/browser";

const frontendHost = process.env.PIPEDREAM_FRONTEND_HOST || "pipedream.com"

export default function Home() {
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null)
  const [connectLink, setConnectLink] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [accountName, setAccountName] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<GetAppResponse | null>(null);
  const [appSlug, setAppSlug] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [pd, setPd] = useState<BrowserClient | null>(null);
  const [isOAuthConfirmed, setIsOAuthConfirmed] = useState(true);
  
  // App search dropdown state
  const [searchResults, setSearchResults] = useState<App[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreApps, setHasMoreApps] = useState(true);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Ref to track if token creation is in progress (prevents duplicate creation in StrictMode)
  const tokenCreationInProgress = useRef<boolean>(false);

  useEffect(() => {
    // This code only runs in the browser
    async function loadClient() {
      const { createFrontendClient } = await import('@pipedream/sdk/browser');
      const client = createFrontendClient({ 
        frontendHost,
        tokenCallback: async () => {
          if (!token || !expiresAt) {
            throw new Error("No token available");
          }
          return {
            token,
            expires_at: expiresAt
          };
        },
        externalUserId
      });
      setPd(client);
    }
  
    // Only create client when we have a token
    if (token && externalUserId) {
      loadClient();
    }
  }, [token, externalUserId, expiresAt]);

  const searchParams = useSearchParams()

  const docsConnect = "https://pipedream.com/docs/connect/"
  const docsTokenCreate =
    "https://pipedream.com/docs/connect/quickstart#generate-a-short-lived-token"
  const frontendSDKDocs = "https://pipedream.com/docs/connect/api-reference/sdks#browser-usage"
  // const connectOauthDocs = "https://pipedream.com/docs/connect/oauth-clients"

  interface ConnectResult {
    id: string
  }

  interface ConnectStatus {
    successful: boolean
    completed: boolean
  }

  interface ConnectConfig {
    app: string
    token: string
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
            external_user_id: externalUserId!
          });
          setToken(newTokenResponse.token);
          setExpiresAt(newTokenResponse.expires_at);
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
      return '1.7.0';
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
    await connectApp(selectedApp.data.name_slug)
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
        const { token, connect_link_url, expires_at } = await serverConnectTokenCreate({
          external_user_id: uuid,
        })
        console.log('Token created successfully');
        setToken(token)
        setConnectLink(connect_link_url)
        setExpiresAt(expires_at)
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
          setNextCursor(null); // Reset cursor for new search
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
      setNextCursor(null);
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
  
  const searchAppsClient = async (query?: string, limit: number = 10, append: boolean = false): Promise<App[]> => {
    if (!pd) {
      console.error("Pipedream client not loaded");
      return [];
    }

    console.log('Searching apps with SDK client', { query, limit, append, cursor: append ? nextCursor : null });

    try {
      const requestParams: any = {
        q: query,
        limit: limit * 2, // Request more to account for filtering
        sortKey: "featured_weight", 
        sortDirection: "desc"
      };

      // Add cursor for pagination when appending
      if (append && nextCursor) {
        requestParams.after = nextCursor;
      }

      const response = await pd.getApps(requestParams);
      
      // Filter out apps with null auth_type
      const filteredApps = (response.data || [])
        .filter((app: App) => app.auth_type !== null);
      
      // Update pagination state from API response
      const pageInfo = response.page_info;
      if (pageInfo) {
        setHasMoreApps(!!pageInfo.end_cursor && pageInfo.count === response.data.length);
        setNextCursor(pageInfo.end_cursor || null);
      } else {
        // Fallback if no page_info
        setHasMoreApps(response.data.length >= limit);
        setNextCursor(null);
      }
      
      // Limit to requested amount
      const limitedApps = filteredApps.slice(0, limit);
      
      if (append) {
        // Append to existing results, avoiding duplicates
        setSearchResults(prevResults => {
          const existingIds = new Set(prevResults.map(app => app.name_slug));
          const newApps = limitedApps.filter(app => !existingIds.has(app.name_slug));
          return [...prevResults, ...newApps];
        });
        return limitedApps;
      } else {
        // Replace existing results and reset cursor
        if (!append) {
          setNextCursor(pageInfo?.end_cursor || null);
        }
        setSearchResults(limitedApps);
        return limitedApps;
      }
    } catch (error) {
      console.error("Error fetching apps:", error);
      return [];
    }
  };

  const loadMoreApps = async () => {
    if (isLoadingMore || !hasMoreApps) return;
    
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
      setNextCursor(null);
      
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
    setAppSlug(app.name_slug);
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
    } catch (err) {
      console.error("Error:", err);
      setError(`Couldn't load the app ${app.name_slug}`);
    }
  }

  const normalizeAppSlug = (slug: string): string => {
    return slug.trim().replace(/-/g, '_')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appSlug.trim()) {
      setError("Please enter an app slug");
      return;
    }
    if (!token) {
      setError("No token available");
      return;
    }
    
    const normalizedSlug = normalizeAppSlug(appSlug);
    try {
      const response = await getAppInfo(normalizedSlug);
      // console.log('App Info:', response);
      setSelectedApp(response); // This is the key change - access the data property
    } catch (err) {
      console.error("Error:", err);
      setError(`Couldn't find the app slug, ${normalizedSlug}`);
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
  
  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);
  
  return (
    <main className="p-5 flex flex-col gap-2 max-w-6xl mb-48">
      {externalUserId && (
        <div>
          <h1 className="text-title mb-8">Pipedream Connect: Managed Auth Demo App</h1>
          <div className="mb-4 text-body">
            <p className="mb-4">Refer to the <a href={docsConnect} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">Pipedream Connect docs</a> for a full walkthrough of how to configure Connect for your app.</p>
            <p>When your customers connect accounts with Pipedream, you&apos;ll pass their unique user ID in your system — whatever you use to identify them. In this example, we&apos;ll generate a random external user ID for you:
              <span className="text-code font-bold"> {externalUserId}.</span>
            </p>
          </div>
          <div className="border border-b mb-4"></div>
          
          <div className="mb-8">
            <p className="text-body">In <code>server.ts</code>, the app calls <code>serverConnectTokenCreate</code> to create a short-lived token for the user. You&apos;ll use that token to initiate app connection requests from your site securely. <a href={docsTokenCreate} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">See docs</a>.</p>
          </div>
          <div className="mb-8">
            <CodePanel
              language="typescript"
              code={`import { serverConnectTokenCreate } from "@pipedream/sdk";

const resp = await serverConnectTokenCreate({
  external_user_id: "${externalUserId}", // The end user's ID in your system, this is an example
})`}
            />
          </div>

          {token && (
            <div className="mb-4 text-gray-600">
              <p>
                <span className="font-semibold">Connect Token:</span>
                <span className="font-code"> {token}; </span>
                <span className="font-semibold"> expiry: </span>
                <span className="font-code">{expiresAt}</span>
              </p>
            </div>
          )}
          
          <div className="py-2">
            <p className="text-subtitle pb-2">Select an app to connect</p>
            <div className="app-search-container relative max-w-md py-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  {selectedApp ? (
                    <div className="shadow border rounded w-full px-3 py-2 bg-gray-50 border-gray-300 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={selectedApp.data.img_src} 
                          alt={selectedApp.data.name}
                          className="w-6 h-6 rounded"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{selectedApp.data.name}</div>
                          <div className="text-sm text-gray-500">{selectedApp.data.name_slug}</div>
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
                    <input
                      className="shadow appearance-none border rounded w-full px-3 py-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                      id="app-slug"
                      type="text"
                      placeholder="Search apps (e.g., slack, google sheets)"
                      value={appSlug}
                      onChange={handleAppSlugChange}
                      onFocus={handleAppSlugFocus}
                      onKeyDown={handleKeyDown}
                      autoComplete="off"
                    />
                  )}
                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto">
                      {isSearching ? (
                        <div className="px-4 py-2 text-gray-500">
                          Searching...
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((app, index) => (
                          <div
                            key={app.name_slug}
                            className={`flex items-center px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              index === selectedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                            onClick={() => handleAppSelect(app)}
                          >
                            <img
                              src={app.img_src}
                              alt={app.name}
                              className="w-8 h-8 rounded mr-3 object-contain"
                              onError={(e) => {
                                // Fallback for broken images
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{app.name}</div>
                              <div className="text-sm text-gray-500 truncate">{app.name_slug}</div>
                            </div>
                            <div className="text-xs text-gray-400 ml-2">
                              {app.auth_type === 'oauth' ? 'OAuth' : 
                               app.auth_type === 'keys' ? 'API Keys' : 
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
          </div>


        {selectedApp && (
          (selectedApp as GetAppResponse).data.auth_type !== 'oauth' || isOAuthConfirmed
        ) && (
          <>
            <div className="border border-b my-2"></div>
              
              <div className="my-8">
                <h2 className="text-title mb-4">Connect your account</h2>
                <div className="my-4">
                  <p className="text-subtitle">Option 1: Connect Link</p>
                  <div className="text-body">
                    <span>Give your users a link to connect their account. This is useful if you aren&apos;t able to execute JavaScript or open an iFrame from your app. </span>
                    <span><a target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600" href="https://pipedream.com/docs/connect/connect-link">See the docs</a> for more info.</span>
                  </div>
                  {connectLink && (
                    <a 
                      href={`${connectLink}&app=${selectedApp.data.name_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono hover:underline text-blue-600 block mt-2"
                    >
                      {connectLink}&app={selectedApp.data.name_slug}
                    </a>
                  )}
                </div>
                <div className="mt-8">
                  <p className="text-subtitle">Option 2: Connect via SDK</p>
                  <p className="text-body">Use the client SDK to open a Pipedream iFrame directly from your site (<a target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600" href={frontendSDKDocs}>see docs</a>).</p>
                  <button 
                    className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded mt-2"
                    onClick={connectAccount}
                  >
                    Connect {selectedApp.data.name}
                  </button>
                  {accountId && (
                    <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                      <div className="mb-2">
                        ✅ Account connected successfully! {accountName ? (
                          <><strong>{accountName}</strong> <span> (ID: </span><code className="font-mono">{accountId}</code><span>)</span></>
                        ) : (
                          <>Account ID: <code className="font-mono">{accountId}</code></>
                        )}
                      </div>
                      <div className="text-sm">
                        <span>You can manage your users and their connected accounts in the </span>
                        <a 
                          href={`https://pipedream.com/@pd-connect-testing/projects/${process.env.NEXT_PUBLIC_PIPEDREAM_PROJECT_ID}/connect/users`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 underline font-bold"
                        >
                          Pipedream UI
                        </a>
                        <span>{' '}or{' '}</span>
                        <a 
                          href={`https://pipedream.com/docs/connect/api-reference/list-accounts`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 underline font-bold"
                        >
                          via the API
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <p className="my-4 text-body">
                  You&apos;ll call <code>pd.connectAccount</code> with the token and the <code>app_slug</code> of the app you&apos;d like to connect:
                </p>
                <div className="mb-8">
                  <CodePanel
                    language="typescript"
                    code={`import { createFrontendClient } from "@pipedream/sdk/browser"
        
const pd = createFrontendClient();
pd.connectAccount({
  app: "${selectedApp.data.name_slug}", // The app slug to connect to
  token: "${token || '[TOKEN]'}",
  onSuccess: ({ id: accountId }) => {
    console.log('🎉 Connection successful!', { accountId });
  },
  onError: (error) => {
    console.error('❌ Connection error:', error);
  },
  onClose: (status) => {
    console.log('🚪 Connection dialog closed:', {
      successful: status.successful,
      completed: status.completed
    });
  }
})`}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}