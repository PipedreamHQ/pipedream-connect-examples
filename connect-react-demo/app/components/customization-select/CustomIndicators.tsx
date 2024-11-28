import { components as ReactSelectComponents } from "react-select"
import type { DropdownIndicatorProps } from "react-select"

export function CustomDropdownIndicator(props: DropdownIndicatorProps) {
  return <ReactSelectComponents.DropdownIndicator {...props}>▼</ReactSelectComponents.DropdownIndicator>
}
