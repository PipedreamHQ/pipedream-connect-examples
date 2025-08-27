# OpenAI SDK Example

This example demonstrates how to use the [OpenAI SDK](https://github.com/openai/openai-node) with Pipedream's dynamic MCP server.

## Prerequisites

See the [main README](../../README.md) for environment setup.

## Installation

```bash
pnpm install
```

## Usage

The `--external-user-id` or `-u` parameter is required.

### Basic Usage

```bash
pnpm start -u <uuid> "Send a message to Slack saying hello"
```

### With Additional Options

```bash
pnpm start -u <uuid> "Create a Linear ticket for the bug I found" --model gpt-4 --max-steps 15
```

### Available Options

- `--external-user-id` or `-u` (required): The external user ID for Pipedream Connect
- `--model`: AI model (default: gpt-4-1106-preview)
- `--max-steps`: Maximum conversation steps (default: 10)
