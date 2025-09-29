import OpenAI from "openai";
import dotenv from "dotenv";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
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
  logExecutingTools,
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

// Load environment variables (especially OPENAI_API_KEY)
dotenv.config();

// Create CLI program with commander.js for handling command-line arguments
const program = createBaseProgram(
  "openai-sdk",
  "OpenAI SDK CLI tool with MCP integration"
);

program.action(async (instruction: string, options: ProgramOptions) => {
  const config = validateAndParseOptions(instruction, options);

  // Initialize OpenAI client with API key from environment
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  let mcpClient: Client | undefined;

  try {
    logProcessingStart(config, "OpenAI SDK");

    const transport = await createMCPTransport(config.options.external_user_id);

    // Initialize the MCP client using the official MCP SDK
    mcpClient = new Client({
      name: "pd-example-client",
      version: "1.0.0",
    });

    await mcpClient.connect(transport);

    console.log("✅ MCP client initialized");

    // Build conversation state for the Responses API (stateless, local state)
    // Use EasyInputMessage items as the `input` for each call
    const inputMessages: OpenAI.Responses.ResponseInputItem[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
        type: "message",
      },
      {
        role: "user",
        content: config.instruction,
        type: "message",
      },
    ];

    let ended = false;
    let steps = 0;

    // Main conversation loop - continues until AI decides to stop or max steps reached
    while (!ended && steps < config.maxSteps) {
      logStep(steps + 1, config.maxSteps);

      // Reload tools from MCP client before each generation step
      // This ensures we have the latest available tools
      logToolsLoading();
      const toolsResponse = await mcpClient.listTools();
      const mcpTools = toolsResponse.tools || [];
      const toolNames = mcpTools.map((tool) => tool.name).join(", ");
      logAvailableTools(toolNames);

      // Convert MCP tools to Responses function-calling format
      const normalizeFunctionParameters = (schema: any) => {
        if (!schema || typeof schema !== "object") {
          return undefined;
        }

        const cloned = { ...schema };

        if (cloned.type === undefined && cloned.properties) {
          cloned.type = "object";
        }

        if (cloned.type !== "object" || typeof cloned.properties !== "object") {
          return cloned;
        }

        const propertyKeys = Object.keys(cloned.properties);
        const requiredFromSchema = Array.isArray(cloned.required)
          ? [...cloned.required]
          : [];

        propertyKeys.forEach((key) => {
          if (!requiredFromSchema.includes(key)) {
            requiredFromSchema.push(key);
          }
        });

        return {
          ...cloned,
          additionalProperties:
            typeof cloned.additionalProperties === "boolean"
              ? cloned.additionalProperties
              : false,
          required: requiredFromSchema,
        };
      };

      const functionTools: any[] = mcpTools.map((tool: any) => ({
        type: "function",
        name: tool.name,
        description: tool.description,
        parameters: normalizeFunctionParameters(tool.inputSchema),
        strict: true,
      }));

      logAIResponse();

      // Create a response via the Responses API
      const response = await openai.responses.create({
        model: (config.options.model as any) || "gpt-5",
        input: inputMessages,
        tools: (functionTools.length > 0 ? functionTools : undefined) as any,
        tool_choice: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
        // Per policy: omit temperature or set to 1
        temperature: 1,
      });

      // Log assistant text output
      const outputText = (response as any).output_text ?? "";
      if (outputText) {
        logResponse(outputText);
        // Carry assistant turn in local conversation state
        inputMessages.push({ role: "assistant", content: outputText, type: "message" });
      } else {
        logResponse("(no text content)");
      }

      // Detect function tool calls from the Responses output
      type FunctionToolCall = { name: string; arguments: string; call_id: string };
      const toolCallMap = new Map<string, FunctionToolCall>();
      const recordToolCall = (call: {
        name?: string;
        arguments?: unknown;
        call_id?: string | null;
        id?: string | null;
      }) => {
        if (!call?.name) {
          return;
        }

        const callId = call.call_id ?? call.id;
        if (!callId || toolCallMap.has(callId)) {
          return;
        }

        const argsString =
          typeof call.arguments === "string"
            ? call.arguments
            : JSON.stringify(call.arguments ?? {});

        toolCallMap.set(callId, {
          name: call.name,
          arguments: argsString,
          call_id: callId,
        });
      };

      for (const item of (response as any).output ?? []) {
        if (!item) {
          continue;
        }

        // Direct function call item
        if (item.type === "function_call") {
          recordToolCall(item);
          continue;
        }

        // Assistant message wrapper with content parts
        if (item.type === "message" && item.role === "assistant" && Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part && (part.type === "function_call" || part.type === "tool_call")) {
              recordToolCall({
                name: part.name,
                arguments: part.arguments,
                call_id: part.call_id,
                id: part.id,
              });
            }
          }
        }
      }

      const toolCalls = Array.from(toolCallMap.values());

      if (toolCalls.length > 0) {
        logToolCalls();
        toolCalls.forEach((tc, index) => {
          console.log(`  ${index + 1}. ${tc.name}`);
          console.log(`     Args: ${tc.arguments}`);
        });

        logExecutingTools();

        // Persist tool calls in conversation state before sending outputs back
        toolCalls.forEach((tc) => {
          inputMessages.push({
            type: "function_call",
            call_id: tc.call_id,
            name: tc.name,
            arguments: tc.arguments,
          });
        });

        for (const tc of toolCalls) {
          try {
            const args = tc.arguments ? JSON.parse(tc.arguments) : {};
            const result = await mcpClient.callTool({ name: tc.name, arguments: args });
            console.log(`  ✅ ${tc.name}: ${JSON.stringify(result, null, 2)}`);

            // Provide function_call_output back to the model for the next turn
            inputMessages.push({
              type: "function_call_output",
              call_id: tc.call_id,
              output: JSON.stringify(result),
            });
          } catch (error) {
            console.error(`  ❌ Error executing ${tc.name}:`, error);
            inputMessages.push({
              type: "function_call_output",
              call_id: tc.call_id,
              output: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            });
          }
        }
        // Continue to next step after providing tool outputs
      } else {
        // No tool calls requested; end the conversation
        ended = true;
        logConversationComplete();
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
    handleError(error, "OpenAI SDK");
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
