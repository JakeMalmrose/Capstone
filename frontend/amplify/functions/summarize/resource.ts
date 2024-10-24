// amplify/functions/summarize/resource.ts
import { defineFunction, secret } from "@aws-amplify/backend";

export const summarize = defineFunction({
  name: "summarize",
  entry: "./handler.ts",
  environment: {
    OPENAI_API_KEY: secret("openai-api-key"),
    ANTHROPIC_API_KEY: secret("anthropic-api-key"),
    OLLAMA_BASE_URL: "http://localhost:11434", // This could also be a secret if needed
  },
  timeoutSeconds: 30,
});