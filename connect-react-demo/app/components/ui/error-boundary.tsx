"use client"

import React from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: (error: Error, retry: () => void) => React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.retry)
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 border border-red-200 rounded-lg bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-sm text-red-600 mb-4 text-center">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button
            onClick={this.retry}
            variant="outline"
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}