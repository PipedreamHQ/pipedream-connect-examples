import { PipedreamClient } from "@pipedream/sdk";
export declare const config: {
    OPENAI_API_KEY: string;
    PIPEDREAM_CLIENT_ID: string;
    PIPEDREAM_CLIENT_SECRET: string;
    PIPEDREAM_PROJECT_ID: string;
    PIPEDREAM_PROJECT_ENVIRONMENT: "development" | "production";
    MCP_HOST: string;
};
export declare const pd: PipedreamClient;
export declare const pdHeaders: (exuid: string) => Promise<{
    Authorization: string;
    "x-pd-project-id": string;
    "x-pd-environment": "development" | "production";
    "x-pd-external-user-id": string;
}>;
//# sourceMappingURL=pd.d.ts.map