import { z } from "zod";
/**
 * Load environment configuration for examples
 * Tries to load .env from current working directory first, then from project root
 */
export declare function loadConfig(): void;
/**
 * Load and validate environment configuration with Zod schema
 * @param schema - Zod schema to validate environment variables
 * @returns Parsed and validated environment configuration
 */
export declare function loadAndValidateConfig<T extends z.ZodRawShape>(schema: z.ZodObject<T>): z.infer<z.ZodObject<T>>;
//# sourceMappingURL=config.d.ts.map