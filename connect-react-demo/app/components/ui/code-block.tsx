"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IoCopyOutline, IoCheckmarkOutline } from "react-icons/io5"
import { cn } from "@/lib/utils"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeBlockProps {
  children: string
  className?: string
  language?: string
  variant?: 'default' | 'terminal'
}

export function CodeBlock({ children, className, language = "tsx", variant = "default" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={copyToClipboard}
        className="absolute top-3 right-3 h-8 w-8 p-0 bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm z-10"
        aria-label="Copy code to clipboard"
        title={copied ? "Copied!" : "Copy code"}
      >
        {copied ? (
          <IoCheckmarkOutline className="h-4 w-4 text-green-400" />
        ) : (
          <IoCopyOutline className="h-4 w-4 text-gray-300" />
        )}
      </Button>
      <div>
        <SyntaxHighlighter
          language={language === "tsx" ? "typescript" : language}
          style={tomorrow}
          customStyle={{
            margin: 0,
            padding: variant === 'terminal' ? '12px 16px' : '16px 20px',
            background: variant === 'terminal' ? '#0f0f0f' : '#1a1a1a',
            fontSize: '13px',
            lineHeight: '1.5',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
            }
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}