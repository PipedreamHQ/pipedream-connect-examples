import { openai } from "@ai-sdk/openai";
import {
  ModelMessage,
  experimental_createMCPClient,
  generateText,
  stepCountIs,
} from "ai";
import {
  createBaseProgram,
  validateAndParseOptions,
  createMCPTransport,
  logProcessingStart,
  logStep,
  logToolsLoading,
  logAvailableTools,
  logAIResponse,
  logResponse,
  logToolCalls,
  logToolResults,
  logConversationComplete,
  logMaxStepsReached,
  logSessionComplete,
  logClosingClient,
  logClientClosed,
  logContinuing,
  setupGracefulShutdown,
  handleError,
  SYSTEM_PROMPT,
  ProgramOptions,
} from "../shared/cli.js";

const program = createBaseProgram(
  "ai-sdk",
  "AI SDK CLI tool with MCP integration"
);

program.action(async (instruction: string, options: ProgramOptions) => {
  const config = validateAndParseOptions(instruction, options);

  let mcpClient:
    | Awaited<ReturnType<typeof experimental_createMCPClient>>
    | undefined;

  try {
    logProcessingStart(config, "AI SDK");

    const transport = await createMCPTransport(config.options.external_user_id);

    // Initialize the  MCP client from AI SDK
    mcpClient = await experimental_createMCPClient({
      transport,
    });

    console.log("✅ MCP client initialized");

    const messages: ModelMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: config.instruction,
          },
        ],
      },
    ];

    let ended = false;
    let steps = 0;

    // Main conversation loop - continues until AI decides to stop or max steps reached
    while (!ended && steps < config.maxSteps) {
      logStep(steps + 1, config.maxSteps);

      // Reload tools from MCP client before each generation step
      // This ensures we have the latest available tools (servers can add/remove tools dynamically)
      logToolsLoading();
      const tools = await mcpClient.tools();
      const toolNames = Object.keys(tools).join(", ");
      logAvailableTools(toolNames);

      logAIResponse();
      
      // Generate response with AI SDK - key configuration:
      // - tools: Makes MCP tools available to the model
      // - maxSteps: 1 ensures we handle one step at a time for better control
      const response = await generateText({
        model: openai(config.options.model as any),
        messages,
        tools,
        stopWhen: stepCountIs(1), // Handle one step at a time so we are able to reload the tools in between steps
      });

      logResponse(response.text);

      // Handle different completion reasons - this determines conversation flow
      switch (response.finishReason) {
        case "stop":
        case "content-filter":
          // Model completed its response naturally or was filtered
          ended = true;
          logConversationComplete();
          break;

        case "error":
          // An error occurred during generation
          ended = true;
          console.error("❌ An error occurred during generation");
          break;

        case "tool-calls":
          // Model wants to use tools
          // AI SDK automatically executes the tools and provides results
          logToolCalls();
          response.toolCalls.forEach((toolCall, index) => {
            console.log(`  ${index + 1}. ${toolCall.toolName}`);
            console.log(
              `     Input: ${JSON.stringify(toolCall.input, null, 2)}`
            );
          });

          logToolResults();
          response.toolResults.forEach((result, index) => {
            console.log(
              `  ${index + 1}. ${JSON.stringify(result.output, null, 2)}`
            );
          });

          // Add the tool calls and results to conversation history
          messages.push(...response.response.messages);
          break;

        case "length":
          console.log("⚠️  Response truncated due to length limit");
          ended = true;
          break;

        default:
          console.log(`🤔 Unknown finish reason: ${response.finishReason}`);
          ended = true;
      }

      steps++;

      if (!ended && steps < config.maxSteps) {
        logContinuing();
      }
    }

    if (steps >= config.maxSteps) {
      logMaxStepsReached(config.maxSteps);
    }

    logSessionComplete();
  } catch (error) {
    handleError(error, "AI SDK");
  } finally {
    if (mcpClient) {
      logClosingClient();
      await mcpClient.close();
      logClientClosed();
    }
  }
});

setupGracefulShutdown();

program.parse();
