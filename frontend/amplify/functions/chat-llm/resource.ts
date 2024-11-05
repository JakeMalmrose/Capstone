// amplify/functions/chat-llm/resource.ts
import { defineFunction, secret } from "@aws-amplify/backend";

export const chatWithLLM = defineFunction({
  name: "chatWithLLM",
  entry: "./handler.ts",
  environment: {
    OPENAI_API_KEY: secret("openai-api-key"),
    ANTHROPIC_API_KEY: secret("anthropic-api-key"),
    OLLAMA_BASE_URL: "http://localhost:11434",
  },
  timeoutSeconds: 30,
});
