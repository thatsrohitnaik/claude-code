import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt, type Intent } from "./prompts/system";
import { promptVariablesFromContext, buildContext, type BuildContextResult } from "./context";

function getGemini() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
}

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

  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
    });

    // Build conversation history for Gemini
    const history = conversationHistory.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history,
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const content = response.text();

    return { content };
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      content: "AI service is not configured. Please add your GEMINI_API_KEY to the environment.",
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
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContentStream([{
      role: "user",
      parts: [{ text: userMessage }],
    }]);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error("Gemini streaming error:", error);
    yield "AI service is not configured. Please add your GEMINI_API_KEY to the environment.";
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
        // Generate embedding using Gemini
        const genAI = getGemini();
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await embeddingModel.embedContent(__memory__.content);
        const embedding = result.embedding.values;

        const { db } = await import("@lifepilot/db");
        await db.memory.create({
          data: {
            userId,
            category: __memory__.category,
            content: __memory__.content,
            embedding: embedding as any,
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