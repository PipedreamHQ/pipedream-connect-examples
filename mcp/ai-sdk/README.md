# AI SDK Example

This example demonstrates how to use [Vercel's AI SDK](https://ai-sdk.dev) with Pipedream's dynamic MCP server.

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
pnpm start -u your-user-id "Send a message to Slack saying hello"
```

### With Additional Options

```bash
pnpm start -u your-user-id "Create a Linear ticket for the bug I found" --model gpt-4 --max-steps 15
```

### Available Options

- `--external-user-id` or `-u` (required): The external user ID for Pipedream Connect
- `--model`: AI model
- `--max-steps`: Maximum conversation steps (default: 10)
