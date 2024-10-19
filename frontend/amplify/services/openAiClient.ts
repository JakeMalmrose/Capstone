// services/openaiClient.ts
import OpenAI from "openai";

export class OpenAIClient {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  async createChatCompletion(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      if (response.choices && response.choices.length > 0) {
        if(!response.choices[0].message.content){
            throw new Error("No content returned from OpenAI API");
        }
        return response.choices[0].message.content;
      } else {
        throw new Error("No choices returned from OpenAI API");
      }
    } catch (error) {
      console.error("Error during OpenAI API call:", error);
      throw error;
    }
  }
}
