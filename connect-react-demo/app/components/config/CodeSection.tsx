import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { IoCopyOutline, IoCheckmarkOutline, IoLogoReact } from "react-icons/io5"
import { SiTypescript } from "react-icons/si"
import SyntaxHighlighter from "react-syntax-highlighter"
import { githubGist } from "react-syntax-highlighter/dist/esm/styles/hljs"
import { useState } from "react"

const syntaxHighlighterTheme = {
  ...githubGist,
  'pre[class*="language-"]': {
    ...githubGist['pre[class*="language-"]'],
    fontSize: "13px",
    margin: 0,
    padding: "16px",
    background: "#FAFAFA",
    border: "none",
  },
  'code[class*="language-"]': {
    ...githubGist['code[class*="language-"]'],
    fontSize: "13px",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
}

interface CodeSectionProps {
  fileCode: string
  setFileCode: (code: string | undefined) => void
  code: string
  customizationOption: any
  formControls: React.ReactNode
}

export const CodeSection = ({
  fileCode,
  setFileCode,
  code,
  customizationOption,
  formControls,
}: CodeSectionProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fileCode || code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center px-2 pt-1.5 bg-zinc-50 border-b rounded-t-lg shrink-0">
        <Button
          variant="ghost"
          className={cn(
            "ide-tab flex items-center gap-1.5",
            !fileCode ? "" : "inactive"
          )}
          onClick={() => setFileCode(undefined)}
        >
          <IoLogoReact className="text-[#61DAFB] text-base" />
          <span className="text-sm text-muted-foreground font-medium">
            MyPage.tsx
          </span>
        </Button>
        {customizationOption.file && (
          <Button
            variant="ghost"
            className={cn(
              "ide-tab flex items-center gap-1.5",
              fileCode ? "" : "inactive"
            )}
            onClick={() => setFileCode(customizationOption.file)}
          >
            <SiTypescript className="text-[#3178C6] text-base" />
            <span className="text-sm text-muted-foreground font-medium">
              customizations/{customizationOption.name}.ts
            </span>
          </Button>
        )}
        <div className="flex-1 border-b -mb-px opacity-0" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 relative text-neutral-500 hover:text-neutral-600 -mt-1 -mr-1"
          onClick={handleCopy}
        >
          <div className="relative">
            <IoCopyOutline
              className={cn(
                "h-4 w-4 transition-all duration-100",
                copied ? "opacity-0 scale-50" : "opacity-100 scale-100"
              )}
            />
            <IoCheckmarkOutline
              className={cn(
                "h-4 w-4 text-emerald-500 absolute inset-0 transition-all duration-100",
                copied ? "opacity-100 scale-100" : "opacity-0 scale-150"
              )}
            />
          </div>
        </Button>
      </div>

      <div className="h-[400px] overflow-auto">
        <SyntaxHighlighter
          language="javascript"
          style={syntaxHighlighterTheme}
          showLineNumbers={true}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            height: "100%",
          }}
          lineNumberStyle={{
            minWidth: "3em",
            paddingRight: "1em",
            color: "#A0AEC0",
            textAlign: "right",
            userSelect: "none",
          }}
        >
          {fileCode || code}
        </SyntaxHighlighter>
      </div>

      <div className="shrink-0 border-t bg-zinc-50/50">{formControls}</div>
    </div>
  )
}
