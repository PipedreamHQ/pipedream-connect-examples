export interface ConfigurableProp {
  name: string
  type: string
  description: string
  optional?: boolean
  default?: any
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
  customization?: Record<string, any>
  file?: string
  containerStyle?: React.CSSProperties
}

export interface SDKError {
  message: string
  code?: string
  details?: Record<string, any>
}

export type ComponentType = "action" | "trigger"