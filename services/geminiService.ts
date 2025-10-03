import { GoogleGenAI } from "@google/genai";
import { AMAIKE_SYSTEM_PROMPT } from '../constants';
import { performMultiKeywordSearch, convertToGroundingSources } from './elecoApiService';
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

    // Get the latest user message for keyword extraction
    const latestUserMessage = messages.filter(m => m.sender === 'user').pop();
    const userQuery = latestUserMessage?.text || '';

    // Perform dual search: Gemini + Direct El Eco API
    const [geminiResponse, elecoResults] = await Promise.allSettled([
      // Gemini search with Google Search
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: AMAIKE_SYSTEM_PROMPT,
          tools: [{ googleSearch: {} }],
        },
      }),
      // Direct El Eco API search with AI-powered keyword extraction
      performMultiKeywordSearch(userQuery)
    ]);

    // Process Gemini response
    let geminiText = '';
    let geminiSources: GroundingSource[] = [];
    
    if (geminiResponse.status === 'fulfilled') {
      geminiText = geminiResponse.value.text;
      const groundingMetadata = geminiResponse.value.candidates?.[0]?.groundingMetadata;
      const allGeminiSources: GroundingSource[] = groundingMetadata?.groundingChunks || [];
      geminiSources = allGeminiSources.filter(source => 
        source.web?.uri?.startsWith('https://www.eleco.com.ar')
      );
    }

    // Process El Eco API results
    let elecoSources: GroundingSource[] = [];
    let elecoText = '';
    
    if (elecoResults.status === 'fulfilled' && elecoResults.value.length > 0) {
      elecoSources = convertToGroundingSources(elecoResults.value);
      elecoText = generateElecoSummary(elecoResults.value);
    }

    // Combine results
    const allSources = [...geminiSources, ...elecoSources];
    const combinedText = combineSearchResults(geminiText, elecoText, allSources.length > 0);

    console.log("Gemini sources:", geminiSources.length);
    console.log("El Eco API sources:", elecoSources.length);
    console.log("Total sources:", allSources.length);
    console.log("Combined text:", combinedText);

    return { text: combinedText, sources: allSources };
  } catch (error) {
    console.error("Error fetching response from Gemini API:", error);
    return {
      text: "Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, intenta de nuevo más tarde.",
      sources: []
    };
  }
};


/**
 * Generates a summary from El Eco API results
 */
const generateElecoSummary = (articles: any[]): string => {
  if (articles.length === 0) return '';
  
  const summary = articles.slice(0, 3).map(article => {
    const date = new Date(article.created_at).toLocaleDateString('es-AR');
    return `• ${article.title} (${date})`;
  }).join('\n');
  
  return `\n\n**Resultados adicionales de El Eco:**\n${summary}`;
};

/**
 * Combines Gemini and El Eco search results
 */
const combineSearchResults = (geminiText: string, elecoText: string, hasSources: boolean): string => {
  if (!hasSources) {
    return geminiText + (elecoText ? elecoText : '');
  }
  
  // If we have sources, combine the texts intelligently
  if (elecoText && !geminiText.includes('Puedes leer más en:')) {
    return geminiText + elecoText;
  }
  
  return geminiText;
};