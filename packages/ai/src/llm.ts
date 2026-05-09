import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { buildSystemPrompt, type Intent, type PromptVariables } from "./prompts/system";
import { promptVariablesFromContext, buildContext, type BuildContextResult } from "./context";
import type { ReadableStream } from "node:stream";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface LLMResponse {
  content: string;
  thinking?: string;
}

export async function callLLM(
  userId: string,
  userMessage: string,
  intent: Intent,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<LLMResponse> {
  const context = await buildContext(userId, userMessage);
  const promptVars = promptVariablesFromContext(context, intent, userMessage);
  const systemPrompt = buildSystemPrompt(promptVars);

  // Build conversation messages
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: systemPrompt },
    ...conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  try {
    // Try Anthropic first
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages,
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "";

    return { content };
  } catch (error) {
    console.error("Anthropic API error, falling back to OpenAI:", error);

    // Fallback to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: userMessage },
      ],
    });

    return {
      content: response.choices[0]?.message?.content || "",
    };
  }
}

export async function* streamLLM(
  userId: string,
  userMessage: string,
  intent: Intent,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): AsyncGenerator<string> {
  const context = await buildContext(userId, userMessage);
  const promptVars = promptVariablesFromContext(context, intent, userMessage);
  const systemPrompt = buildSystemPrompt(promptVars);

  try {
    // Try Anthropic streaming
    const stream = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        { role: "user", content: systemPrompt },
        ...conversationHistory.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        { role: "user", content: userMessage },
      ],
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        yield chunk.delta.text;
      }
    }
  } catch (error) {
    console.error("Anthropic streaming error, falling back to OpenAI:", error);

    // Fallback to OpenAI streaming
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: userMessage },
      ],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}

export async function processAIResponse(
  rawResponse: string,
  userId: string
): Promise<{ cleanResponse: string; memory?: { category: string; content: string } }> {
  const memoryMatch = rawResponse.match(/\{"__memory__":\s*\{.*\}/);

  let memory: { category: string; content: string } | undefined;

  if (memoryMatch) {
    try {
      const parsed = JSON.parse(memoryMatch[0]);
      const { __memory__ } = parsed;

      if (__memory__?.category && __memory__?.content) {
        // Generate embedding and store memory
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: __memory__.content,
        });

        const { db } = await import("@lifepilot/db");
        await db.memory.create({
          data: {
            userId,
            category: __memory__.category,
            content: __memory__.content,
            embedding: embeddingResponse.data[0].embedding,
          },
        });

        memory = {
          category: __memory__.category,
          content: __memory__.content,
        };
      }
    } catch (error) {
      console.error("Error processing memory:", error);
    }
  }

  const cleanResponse = rawResponse.replace(/\n?\{"__memory__":\s*\{.*\}/, "").trim();

  return { cleanResponse, memory };
}

export { buildContext, type BuildContextResult } from "./context";
export { buildSystemPrompt, type PromptVariables, type Intent } from "./prompts/system";