/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import type { App, PipedreamClient as FrontendClient } from "@pipedream/sdk/browser";
import { useAppsSearch } from "../_hooks/useAppsSearch";

interface SearchSelectProps {
  appSlug: string;
  onAppSlugChange: (value: string) => void;
  onAppSelected: (app: App) => void;
  client: FrontendClient | null;
}

export function SearchSelect({ appSlug, onAppSlugChange, onAppSelected, client }: SearchSelectProps) {
  const {
    results,
    hasMore,
    isLoadingMore,
    isSearching,
    searchApps,
    loadMore,
    reset,
  } = useAppsSearch(client);

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!containerRef.current?.contains(target)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAppSelect = (app: App) => {
    onAppSelected(app);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleChange = (value: string) => {
    onAppSlugChange(value);
    setSelectedIndex(-1);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!value) {
      reset();
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);

    searchTimeout.current = setTimeout(() => {
      searchApps(value);
    }, 300);
  };

  const handleFocus = () => {
    setShowDropdown(true);
    if (!results.length) {
      searchApps(undefined);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || !results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleAppSelect(results[selectedIndex]);
      }
    } else if (event.key === "Escape") {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className="app-search-container relative max-w-md py-2" ref={containerRef}>
      <input
        id="app-slug"
        className="shadow appearance-none border rounded w-full px-3 py-2 pr-8 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
        placeholder="Search apps (e.g., slack, google sheets)"
        type="text"
        value={appSlug}
        disabled={!client}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        aria-expanded={showDropdown}
        aria-controls="app-dropdown"
        role="combobox"
        aria-autocomplete="list"
      />
      {!client && <p className="text-small mt-1 text-gray-500">Loading Pipedream SDK...</p>}
      {showDropdown && (
        <div
          id="app-dropdown"
          role="listbox"
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto"
        >
          {isSearching ? (
            <div className="px-4 py-2 text-gray-500">Searching...</div>
          ) : results.length ? (
            results.map((app, index) => (
              <div
                key={app.nameSlug}
                id={`app-option-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                  index === selectedIndex ? "bg-blue-100" : "hover:bg-gray-100"
                }`}
                onClick={() => handleAppSelect(app)}
              >
                <img
                  src={app.imgSrc}
                  alt={app.name}
                  className="w-8 h-8 rounded mr-3 object-contain"
                  onError={(event) => {
                    (event.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    <span>{app.name}</span>
                    <code className="text-sm font-normal text-gray-500 truncate">{` (${app.nameSlug})`}</code>
                  </div>
                  {app.description && <div className="text-sm text-gray-400 mt-1 line-clamp-2">{app.description}</div>}
                </div>
                <div className="text-xs text-gray-400 ml-2">
                  {app.authType === "oauth" ? "OAuth" : app.authType === "keys" ? "API Keys" : "No Auth"}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">No apps found</div>
          )}
          {!isSearching && results.length > 0 && hasMore && (
            <div className="border-t border-gray-100">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 focus:outline-none focus:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
