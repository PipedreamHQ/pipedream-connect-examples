import { config } from "dotenv"
import { join } from "path"
import { existsSync } from "fs"
import { z } from "zod"

/**
 * Load environment configuration for examples
 * Tries to load .env from current working directory first, then from project root
 */
export function loadConfig(): void {
  const cwd = process.cwd()
  
  // Try to load .env from current working directory first, then from project root
  const localEnvPath = join(cwd, '.env')
  const rootEnvPath = join(cwd, '../../.env') // Assumes we're in examples/[example-name]
  
  const envPath = existsSync(localEnvPath) ? localEnvPath : rootEnvPath
  config({ path: envPath })
}

/**
 * Load and validate environment configuration with Zod schema
 * @param schema - Zod schema to validate environment variables
 * @returns Parsed and validated environment configuration
 */
export function loadAndValidateConfig<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): z.infer<z.ZodObject<T>> {
  // Load .env file first
  loadConfig()
  
  try {
    // Parse and validate environment variables
    return schema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment validation failed:")
      error.errors.forEach((err: z.ZodIssue) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      console.error("Please check your .env file")
    } else {
      console.error("❌ Unexpected error during environment validation:", error)
    }
    process.exit(1)
  }
}
