export interface TerminalOutput {
  error?: boolean
  message?: string
  data?: Record<string, unknown>
  [key: string]: unknown
}

interface TerminalProps {
  shouldAnimate?: boolean
  output?: TerminalOutput | null
}

export const Terminal = ({ shouldAnimate, output }: TerminalProps) => {
  return (
    <div className="font-mono text-xs px-6 py-4 text-zinc-300">
      {shouldAnimate ? (
        <div className="h-4 flex items-center">
          <div className="w-2 h-4 bg-zinc-400 animate-pulse" />
        </div>
      ) : output ? (
        <pre className="whitespace-pre-wrap overflow-auto">
          {JSON.stringify(output, null, 2)}
        </pre>
      ) : null}
    </div>
  )
}
