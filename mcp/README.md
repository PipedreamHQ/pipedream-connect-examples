# Pipedream MCP CLI Examples

This directory contains CLI examples that demonstrate how to integrate with Pipedream's MCP (Model Context Protocol) server using different AI SDKs.

## Examples

- **ai-sdk/**: Example using Vercel's AI SDK with automatic tool handling
- **openai-sdk/**: Example using OpenAI SDK directly with manual tool conversion for full control
- **shared/**: Shared utilities used by both CLI examples

## Prerequisites

To set up your environment, you'll need:

1. A [Pipedream account](https://pipedream.com/auth/signup)
2. A [Pipedream project](https://pipedream.com/docs/projects/#creating-projects)
3. [Pipedream OAuth credentials](https://pipedream.com/docs/rest-api/auth/#oauth)
4. An [OpenAI API key](https://platform.openai.com/api-keys)

## Setup

1. Copy the example environment file and add your credentials:

```bash
cp .env.example .env
# Edit .env with your API keys and Pipedream credentials
```

2. Install dependencies:

```bash
pnpm install
```

## Usage

### AI SDK Example

```bash
pnpm ai-sdk -u <external-user-id> "Send a funny joke to the #random channel in Slack"
```

### OpenAI SDK Example

```bash
pnpm openai-sdk -u <external-user-id> "Send a funny joke to the #random channel in Slack"
```

## For the Full Chat App

For a complete chat application example that demonstrates MCP integration in a web interface, see the [Pipedream MCP Chat app](https://github.com/PipedreamHQ/mcp-chat).
