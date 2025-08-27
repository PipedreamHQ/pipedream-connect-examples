import { PipedreamClient } from "@pipedream/sdk";
import { loadAndValidateConfig } from "./config";
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

    MCP_HOST: z.string().default("https://remote.mcp.pipedream.net"),
  })
);

export const pd = new PipedreamClient();

export const pdHeaders = async (exuid: string) => {
  const accessToken = await pd.rawAccessToken;

  return {
    Authorization: `Bearer ${accessToken}`,
    "x-pd-project-id": config.PIPEDREAM_PROJECT_ID,
    "x-pd-environment": config.PIPEDREAM_PROJECT_ENVIRONMENT,
    "x-pd-external-user-id": exuid,
  };
};
