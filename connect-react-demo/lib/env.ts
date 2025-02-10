import { z } from "zod";

const envSchema = z.object({
  PIPEDREAM_CLIENT_ID: z.string().min(1, "CLIENT_ID is required"),
  PIPEDREAM_CLIENT_SECRET: z.string().min(1, "CLIENT_SECRET is required"),
  PIPEDREAM_PROJECT_ID: z.string().min(1, "PROJECT_ID is required"),
  PIPEDREAM_PROJECT_ENVIRONMENT: z.enum(["development", "production"]),
  PIPEDREAM_ALLOWED_ORIGINS: z.preprocess(
    (val) => {
      if (typeof val !== "string") {
        return val; // Pass through for validation as non-string inputs will fail later
      }
      try {
        return JSON.parse(val);
      } catch {
        return val // Return raw value, which will fail later
      }
    },
    z
      .array(z.string())
      .nonempty("ALLOWED_ORIGINS must be a non-empty array of strings")
      .refine(
        (origins) => origins.every((origin) => typeof origin === "string"),
        "ALLOWED_ORIGINS must contain only strings"
      )
  ),

  // Optional environment variables, useful for different environments (e.g.
  // local development, production, etc.).
  PIPEDREAM_API_HOST: z.optional(z.string().default("api.pipedream.com")),
  PIPEDREAM_WORKFLOW_DOMAIN: z.optional(z.string().default("m.pipedream.net")),

  // Datadog
  DD_APPLICATION_ID: z.optional(z.string()),
  DD_CLIENT_TOKEN: z.optional(z.string()),
  DD_SERVICE: z.optional(z.string()),
  NEXT_PUBLIC_GIT_COMMIT_SHA: z.optional(z.string()),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Environment variable validation failed:", parsedEnv.error.format());
  process.exit(1); // Exit the process if validation fails
}

export const env = parsedEnv.data;
