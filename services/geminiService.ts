import { GoogleGenAI } from "@google/genai";
import { AMAIKE_SYSTEM_PROMPT } from '../constants';
import type { GroundingSource, ChatMessage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface AmAIkeResponse {
  text: string;
  sources: GroundingSource[];
}

export const getAmAIkeResponse = async (messages: ChatMessage[]): Promise<AmAIkeResponse> => {
  try {
    const contents = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: AMAIKE_SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const allSources: GroundingSource[] = groundingMetadata?.groundingChunks || [];
    
    const sources = allSources.filter(source => 
      source.web?.uri?.startsWith('https://www.eleco.com.ar')
    );
    console.log("response", response);
    console.log("All sources", allSources);
    console.log("sources", sources);
    console.log("text", text);
    return { text, sources };
  } catch (error) {
    console.error("Error fetching response from Gemini API:", error);
    return {
      text: "Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, intenta de nuevo más tarde.",
      sources: []
    };
  }
};