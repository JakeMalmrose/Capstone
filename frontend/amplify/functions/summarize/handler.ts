import type { Schema } from "../../data/resource"
import OpenAI from "openai";

const openai = new OpenAI();

export const handler: Schema["summarize"]["functionHandler"] = async (event) => {
  const { text } = event.arguments
  
  if (typeof text !== 'string') {
    throw new Error('Text must be a string');
  }

  return summarize(text);
}

const summarize = async function(text: string) {
    try {
        const summary = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are news article summarizer. You are given a news article and you output a 1 paragraph summary of the article."
                },
                {
                    role: "user",
                    content: text
                }
            ]
        });
        return summary.choices[0].message.content;
    } catch (error) {
        console.error(error);
        throw error; // Re-throw the error after logging
    }
}