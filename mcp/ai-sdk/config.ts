import { loadAndValidateConfig } from "../shared/config.js";
import { z } from "zod";

export const config = loadAndValidateConfig(
  z.object({
    OPENAI_API_KEY: z.string(),
    PIPEDREAM_CLIENT_ID: z.string(),
    PIPEDREAM_CLIENT_SECRET: z.string(),
    PIPEDREAM_PROJECT_ID: z.string(),
    PIPEDREAM_PROJECT_ENVIRONMENT: z
      .enum(["development", "production"])
      .default("development"),
  })
);
