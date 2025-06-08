export interface ConfigurableProp {
  name: string
  type: string
  description: string
  optional?: boolean
  default?: string | number | boolean | null
  min?: number
  max?: number
  secret?: boolean
}

export interface Component {
  key: string
  configurable_props: ConfigurableProp[]
  // Add other component properties as needed
}

export interface AppResponse {
  name_slug: string
  // Add other app properties as needed
}

export interface CustomizationOption {
  name: string
  label: string
  customization?: Record<string, unknown>
  file?: string
  containerStyle?: React.CSSProperties
}

export interface SDKError {
  message: string
  code?: string
  details?: Record<string, unknown>
}

export type ComponentType = "action" | "trigger"