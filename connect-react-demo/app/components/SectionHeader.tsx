"use client"

import { cn } from "@/lib/utils"
import { FC, ReactNode } from "react"

interface SectionHeaderProps {
  title: string
  icon?: ReactNode
  children?: ReactNode
  variant?: "default" | "terminal"
}

export const SectionHeader: FC<SectionHeaderProps> = ({
  title,
  icon,
  children,
  variant = "default",
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2 border-b",
        variant === "default"
          ? "bg-white"
          : "relative bg-gradient-to-b from-zinc-900/95 to-zinc-900/90 backdrop-blur-[2px] border-zinc-800/50 rounded-t-lg text-zinc-300 shadow-[0_-1px_8px_-4px_rgba(0,0,0,0.3)]"
      )}
    >
      <div className="flex items-center gap-1.5 text-neutral-600">
        {icon}
        <span className="text-xs font-semibold uppercase">{title}</span>
      </div>
      {children}
    </div>
  )
}
