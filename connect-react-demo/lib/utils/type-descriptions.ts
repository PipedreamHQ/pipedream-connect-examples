import type { ConfigurableProp } from "@/lib/types/pipedream"

export interface TypeDescriptionResult {
  syntax: string
  isArray: boolean
  isOptional: boolean
}

export function getTypeDescription(prop: ConfigurableProp): TypeDescriptionResult {
  let syntax = ""

  switch (prop.type) {
    case "string":
      syntax = `<span class="text-[#569cd6]">string</span>`
      break
    case "integer":
      syntax = `<span class="text-[#569cd6]">number</span>`
      break
    case "boolean":
      syntax = `<span class="text-[#569cd6]">boolean</span>`
      break
    case "app":
      syntax = `<span class="text-[#4ec9b0]">AppConnection</span>`
      break
    case "any":
      syntax = `<span class="text-[#569cd6]">any</span>`
      break
    case "sql":
      syntax = `<span class="text-[#4ec9b0]">SQL</span>`
      break
    default:
      if (prop.type.endsWith("[]")) {
        const baseType = prop.type.slice(0, -2)
        syntax = `<span class="text-[#4ec9b0]">Array</span>&lt;<span class="text-[#569cd6]">${baseType}</span>&gt;`
      } else {
        syntax = `<span class="text-[#569cd6]">${prop.type}</span>`
      }
  }

  if (prop.optional) {
    syntax = `${syntax} <span class="text-[#d4d4d4]">|</span> <span class="text-[#569cd6]">undefined</span>`
  }

  return {
    syntax,
    isArray: prop.type.endsWith("[]"),
    isOptional: !!prop.optional,
  }
}