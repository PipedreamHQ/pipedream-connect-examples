import { Command } from "commander";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp";
export interface ProgramOptions {
    model: string;
    maxSteps: number;
    external_user_id: string;
}
export interface ProcessingConfig {
    instruction: string;
    options: ProgramOptions;
    maxSteps: number;
}
export declare const SYSTEM_PROMPT = "You are an intelligent AI assistant that can use Pipedream tools to help users.\n\nUse the available tools to fulfill the user's request effectively.\n\nIf you encounter any errors or need clarification, explain what happened and suggest next steps.";
export declare function createBaseProgram(name: string, description: string): Command;
export declare function validateAndParseOptions(instruction: string, options: ProgramOptions): ProcessingConfig;
export declare function createMCPTransport(external_user_id: string): Promise<StreamableHTTPClientTransport>;
export declare function logProcessingStart(config: ProcessingConfig, sdkName: string): void;
export declare function logStep(currentStep: number, maxSteps: number): void;
export declare function logToolsLoading(): void;
export declare function logAvailableTools(toolNames: string): void;
export declare function logAIResponse(): void;
export declare function logResponse(content: string): void;
export declare function logToolCalls(): void;
export declare function logToolResults(): void;
export declare function logExecutingTools(): void;
export declare function logConversationComplete(): void;
export declare function logMaxStepsReached(maxSteps: number): void;
export declare function logSessionComplete(): void;
export declare function logClosingClient(): void;
export declare function logClientClosed(): void;
export declare function logContinuing(): void;
export declare function setupGracefulShutdown(): void;
export declare function handleError(error: unknown, sdkName: string): void;
//# sourceMappingURL=cli.d.ts.map