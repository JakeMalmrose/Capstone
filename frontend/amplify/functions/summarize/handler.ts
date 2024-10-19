import type { Schema } from "../../data/resource";
import { NlpOperation, Summarizer } from "../../services/nlpService";
import { OpenAIClient } from "../../services/openAiClient";

const openaiApiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
const systemPrompt =
  process.env.SYSTEM_PROMPT ||
  "You are a news article summarizer. You are given a news article and you output a 1 paragraph summary of the article.";

if (!openaiApiKey) {
  throw new Error("OPENAI_API_KEY is not set");
}

const openaiClient = new OpenAIClient(openaiApiKey, model);

export const handler: Schema["summarize"]["functionHandler"] = async (event) => {
  const { text } = event.arguments;

  if (typeof text !== "string") {
    throw new Error("Text must be a string");
  }

  const summarizer: NlpOperation = new Summarizer(openaiClient, systemPrompt);

  try {
    const result = await summarizer.perform(text);
    return result;
  } catch (error) {
    console.error("Error during summarization:", error);
    throw new Error("An error occurred during summarization.");
  }
};
