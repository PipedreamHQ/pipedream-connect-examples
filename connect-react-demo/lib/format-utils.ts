/**
 * Custom formatter that displays objects without quotes for cleaner readability in SDK debugger
 */
export const formatPayload = (obj: any, indent = 0): string => {
  if (obj === null) return 'null'
  if (obj === undefined) return 'undefined'
  
  const spaces = ' '.repeat(indent * 2)
  const innerSpaces = ' '.repeat((indent + 1) * 2)
  
  if (typeof obj === 'string') {
    // Return string with quotes
    return `"${obj}"`
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj)
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    const items = obj.map(item => 
      innerSpaces + formatPayload(item, indent + 1)
    ).join(',\n')
    return `[\n${items}\n${spaces}]`
  }
  
  if (typeof obj === 'object') {
    const entries = Object.entries(obj)
    if (entries.length === 0) return '{}'
    
    const items = entries.map(([key, value]) => {
      const formattedValue = formatPayload(value, indent + 1)
      // Remove quotes from keys for cleaner display
      return `${innerSpaces}${key}: ${formattedValue}`
    }).join(',\n')
    
    return `{\n${items}\n${spaces}}`
  }
  
  return String(obj)
}