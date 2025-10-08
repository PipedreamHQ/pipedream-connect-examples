import { config } from "dotenv";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { z } from "zod";
/**
 * Load environment configuration for examples
 * Tries to load .env from current working directory first, then from project root
 */
export function loadConfig() {
    let dir = process.cwd();
    let envLoaded = false;
    while (true) {
        const envPath = join(dir, '.env');
        if (existsSync(envPath)) {
            config({ path: envPath });
            envLoaded = true;
            break;
        }
        const parent = dirname(dir);
        if (parent === dir) {
            break;
        }
        dir = parent;
    }
    if (!envLoaded) {
        config();
    }
}
/**
 * Load and validate environment configuration with Zod schema
 * @param schema - Zod schema to validate environment variables
 * @returns Parsed and validated environment configuration
 */
export function loadAndValidateConfig(schema) {
    // Load .env file first
    loadConfig();
    try {
        // Parse and validate environment variables
        return schema.parse(process.env);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            console.error("❌ Environment validation failed:");
            error.errors.forEach((err) => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
            console.error("Please check your .env file");
        }
        else {
            console.error("❌ Unexpected error during environment validation:", error);
        }
        process.exit(1);
    }
}
//# sourceMappingURL=config.js.map