"use client";

import { useCallback, useRef, useState } from "react";
import type { App, PipedreamClient as FrontendClient } from "@pipedream/sdk/browser";

interface UseAppsSearchResult {
  results: App[];
  isSearching: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  currentQuery?: string;
  searchApps: (query?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export function useAppsSearch(client: FrontendClient | null): UseAppsSearchResult {
  const [results, setResults] = useState<App[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentQuery, setCurrentQuery] = useState<string | undefined>(undefined);

  const pageRef = useRef<Awaited<ReturnType<FrontendClient["apps"]["list"]>> | null>(null);

  const runSearch = useCallback(
    async (query?: string, append = false) => {
      if (!client) {
        return;
      }

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsSearching(true);
        pageRef.current = null;
      }

      try {
        if (!append) {
          const page = await client.apps.list({
            q: query,
            limit: 20,
            sortKey: "featured_weight",
            sortDirection: "desc",
          });
          pageRef.current = page;
        } else {
          const page = pageRef.current;
          if (!page) return;
          if (!page.hasNextPage()) {
            setHasMore(false);
            return;
          }
          await page.getNextPage();
        }

        const page = pageRef.current;
        if (!page) return;

        const filtered = page.data.filter((app) => app.authType !== null);

        setResults((prev) => {
          if (append) {
            const existingIds = new Set(prev.map((app) => app.nameSlug));
            const merged = [...prev, ...filtered.filter((app) => !existingIds.has(app.nameSlug))];
            return merged;
          }
          return filtered;
        });

        setHasMore(page.hasNextPage());
        setCurrentQuery(query);
      } finally {
        if (append) {
          setIsLoadingMore(false);
        } else {
          setIsSearching(false);
        }
      }
    },
    [client],
  );

  const reset = useCallback(() => {
    pageRef.current = null;
    setResults([]);
    setHasMore(true);
    setCurrentQuery(undefined);
  }, []);

  const loadMore = useCallback(async () => {
    await runSearch(currentQuery, true);
  }, [currentQuery, runSearch]);

  return {
    results,
    isSearching,
    isLoadingMore,
    hasMore,
    currentQuery,
    searchApps: runSearch,
    loadMore,
    reset,
  };
}

