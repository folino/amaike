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

/**
 * Optimized single-call approach using only Gemini with enhanced grounding
 * This reduces API calls from 4-6 to just 1
 */
export const getOptimizedAmAIkeResponse = async (messages: ChatMessage[]): Promise<AmAIkeResponse> => {
  try {
    const contents = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Single Gemini call with enhanced system prompt and Google Search
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: AMAIKE_SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });

    // Extract text and sources
    const text = response.text || '';
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const allSources: GroundingSource[] = groundingMetadata?.groundingChunks || [];
    
    // Filter only El Eco sources
    const elecoSources = allSources.filter(source => 
      source.web?.uri?.startsWith('https://www.eleco.com.ar') ||
      source.web?.uri?.includes('eleco.com.ar')
    );

    console.log(`Found ${allSources.length} total sources, ${elecoSources.length} from El Eco`);

    return {
      text,
      sources: elecoSources
    };
  } catch (error) {
    console.error("Error fetching response from Gemini API:", error);
    return {
      text: "Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, intenta de nuevo más tarde.",
      sources: []
    };
  }
};

/**
 * Fallback function that uses direct API search only when Gemini fails
 * This would only be called in error cases
 */
export const getFallbackResponse = async (userQuery: string): Promise<AmAIkeResponse> => {
  // Import the El Eco service only if needed
  const { performOptimizedSearch } = await import('./optimizedElecoService');
  
  try {
    const articles = await performOptimizedSearch(userQuery);
    
    if (articles.length === 0) {
      return {
        text: "No he encontrado información específica sobre tu consulta en el contenido de El Eco de Tandil.\n\n🔍 **¿Me querés contar más?**\nSi tenés más detalles sobre este tema, por favor, házmelo saber.",
        sources: []
      };
    }

    // Convert articles to sources
    const sources = articles.map(article => ({
      web: {
        uri: `https://www.eleco.com.ar${article.link_note}`,
        title: article.title
      }
    }));

    const text = `He encontrado ${articles.length} artículo${articles.length > 1 ? 's' : ''} relacionado${articles.length > 1 ? 's' : ''} con tu consulta en El Eco de Tandil.`;

    return { text, sources };
  } catch (error) {
    console.error("Fallback search failed:", error);
    return {
      text: "Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, intenta de nuevo más tarde.",
      sources: []
    };
  }
};