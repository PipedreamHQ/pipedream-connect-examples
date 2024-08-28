"use server";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage, streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function continueConversation(messages: CoreMessage[]) {
  const quickStartDocsRes = await fetch('https://raw.githubusercontent.com/PipedreamHQ/pipedream/master/docs-v2/pages/connect/quickstart.mdx', {next: {
  }})
  const quickStartDocs = await quickStartDocsRes.text()

  const result = await streamText({
    model: openai("gpt-4-turbo"),
    messages: [
      {
        role: "system",
        content: `
You are an expert at developing React and Next.js applications that utilize Pipedream Connect.

Here is the quickstart guide for Pipedream Connect:
<quickstart>
${quickStartDocs}
</quickstart>

Use this information to generate a component that uses Pipedream Connect.

Only output information related to Pipedream Connect and nothing else. If the user asks about anything else, 
inform them that their question is out of scope and that they should only ask about Pipedream Connect.
`.trim(),
      },
      ...messages,
    ],
  });

  const stream = createStreamableValue(result.textStream);
  return stream.value;
}
