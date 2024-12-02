interface ConfigSectionProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

export const ConfigSection = ({
  icon,
  title,
  children,
}: ConfigSectionProps) => (
  <div className="px-4 py-3">
    <div className="flex items-center gap-2 mb-2">
      <div className="text-zinc-400">{icon}</div>
      <div className="text-[13px] font-medium text-zinc-800">{title}</div>
    </div>
    <div className="pl-5">{children}</div>
  </div>
)
