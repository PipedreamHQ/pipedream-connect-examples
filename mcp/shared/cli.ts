import { Command } from "commander";
import { config as pdConfig, pdHeaders } from "./pd.js";
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

export const SYSTEM_PROMPT = `You are an intelligent AI assistant that can use Pipedream tools to help users.

Use the available tools to fulfill the user's request effectively.

If you encounter any errors or need clarification, explain what happened and suggest next steps.`;

export function createBaseProgram(name: string, description: string) {
  const program = new Command();
  
  return program
    .name(name)
    .description(description)
    .version("1.0.0")
    .argument("<instruction>", "The instruction to process")
    .requiredOption(
      "-u, --external_user_id <extuid>",
      "External user ID (required)"
    )
    .option("-m, --model <model>", "OpenAI model to use", "gpt-5")
    .option("-s, --max-steps <steps>", "Maximum conversation steps", "10");
}

export function validateAndParseOptions(
  instruction: string,
  options: ProgramOptions
): ProcessingConfig {
  const maxSteps = parseInt(options.maxSteps.toString());
  if (isNaN(maxSteps)) {
    console.error("❌ max-steps must be a number");
    process.exit(1);
  }

  return {
    instruction,
    options,
    maxSteps,
  };
}

export async function createMCPTransport(external_user_id: string) {
  console.log("🔧 Setting up MCP transport...");
  
  const headers = await pdHeaders(external_user_id);
  const mcpUrl = new URL(pdConfig.MCP_HOST + `/v1/${external_user_id}`);

  const transport = new StreamableHTTPClientTransport(mcpUrl, {
    requestInit: {
      headers,
    },
  });

  return transport;
}

export function logProcessingStart(config: ProcessingConfig, sdkName: string) {
  console.log(`🤖 Initializing ${sdkName} with MCP client...`);
  console.log(`🎯 Processing instruction: "${config.instruction}"`);
  console.log(`📋 Configuration:
- Model: ${config.options.model}
- Max Steps: ${config.maxSteps}
- MCP URL: ${pdConfig.MCP_HOST}
`);
  console.log("📝 Starting conversation loop...\n");
}

export function logStep(currentStep: number, maxSteps: number) {
  console.log(`📍 Step ${currentStep}/${maxSteps}`);
}

export function logToolsLoading() {
  console.log("🔧 Loading tools from MCP server...");
}

export function logAvailableTools(toolNames: string) {
  console.log(`📋 Available tools: ${toolNames || "none"}`);
}

export function logAIResponse() {
  console.log("🧠 Generating AI response...");
}

export function logResponse(content: string) {
  console.log(`✨ Response: ${content}`);
}

export function logToolCalls() {
  console.log("🔨 Tool calls made:");
}

export function logToolResults() {
  console.log("📊 Tool results:");
}

export function logExecutingTools() {
  console.log("📊 Executing tool calls...");
}

export function logConversationComplete() {
  console.log("✅ Conversation completed successfully");
}

export function logMaxStepsReached(maxSteps: number) {
  console.log(`⚠️  Reached maximum steps (${maxSteps})`);
}

export function logSessionComplete() {
  console.log("\n🎉 Session complete!");
}

export function logClosingClient() {
  console.log("🧹 Closing MCP client...");
}

export function logClientClosed() {
  console.log("✅ MCP client closed");
}

export function logContinuing() {
  console.log("⏳ Continuing to next step...\n");
}

export function setupGracefulShutdown() {
  process.on("SIGINT", async () => {
    console.log("\n🛑 Received SIGINT, shutting down gracefully...");
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
    process.exit(0);
  });
}

export function handleError(error: unknown, sdkName: string) {
  console.log("Error", error);
  console.error(`💥 Error occurred in ${sdkName}:`, error);
  process.exit(1);
} 
