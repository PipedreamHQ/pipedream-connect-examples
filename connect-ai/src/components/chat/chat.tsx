"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type CoreMessage } from "ai";
import { readStreamableValue } from "ai/rsc";
import { BotIcon, SendIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { MarkdownRenderer } from "../markdown-renderer";
import { continueConversation } from "./actions";

export const maxDuration = 30;

export function Chat() {
  const [messages, setMessages] = useState<CoreMessage[]>([
    {
      role: "assistant",
      content: "Hello! How can I help you with Pipedream Connect today?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const newMessages: CoreMessage[] = [
        ...messages,
        { content: input.trim(), role: "user" },
      ];

      setMessages(newMessages);
      setInput("");

      const result = await continueConversation(newMessages);

      for await (const content of readStreamableValue(result)) {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: content as string,
          },
        ]);
      }
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col p-4 border-r">
        <ScrollArea className="flex-1 pr-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-start space-x-2 mb-4 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <BotIcon className="w-6 h-6 mt-1 text-primary" />
              )}
              <Card
                className={`${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <CardContent className="p-3">
                  <MarkdownRenderer>{m.content as string}</MarkdownRenderer>
                </CardContent>
              </Card>
              {m.role === "user" && (
                <UserIcon className="w-6 h-6 mt-1 text-primary" />
              )}
            </div>
          ))}
        </ScrollArea>
        <div className="flex items-center space-x-2 mt-4">
          <Input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage(e)}
          />
          <Button onClick={handleSendMessage}>
            <SendIcon className="w-4 h-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
