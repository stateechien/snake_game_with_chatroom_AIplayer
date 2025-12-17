import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage } from "../types";

let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

const SYSTEM_INSTRUCTION = `
You are simulating a chaotic, fast-paced multiplayer game chatroom for a game called "Snake.io 100".
Users are gamers using internet slang (lol, lag, ez, gg, noob, hacker, rekt).
Generate JSON responses representing chat messages from random bots.
Keep messages short (1-5 words).
Be funny, competitive, or salty.
`;

export const generateBotChat = async (context: string): Promise<ChatMessage[]> => {
  if (!ai) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Context: ${context}. Generate 3 random chat messages from different users.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    sender: { type: Type.STRING },
                    text: { type: Type.STRING }
                }
            }
        }
      },
    });

    const data = JSON.parse(response.text || "[]");
    
    return data.map((msg: any, index: number) => ({
      id: `gemini-${Date.now()}-${index}`,
      sender: msg.sender,
      text: msg.text,
      isSystem: false,
      timestamp: Date.now() + index * 500
    }));

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return [];
  }
};