import { defineFunction, secret } from "@aws-amplify/backend";

export const summarize = defineFunction({
  name: "summarize",
  entry: "./handler.ts",
  environment: {
    OPENAI_API_KEY: secret("openai-api-key"),
    OPENAI_MODEL: "gpt-3.5-turbo", // Default model; can be swapped out
    SYSTEM_PROMPT:
      "You are a news article summarizer. You are given a news article and you output a 1 paragraph summary of the article.",
  },
});
