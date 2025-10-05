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
  const startTime = Date.now();
  console.log('🚀 Starting AmAIke response generation...');
  
  try {
    const contents = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Get the latest user message for keyword extraction
    const latestUserMessage = messages.filter(m => m.sender === 'user').pop();
    const userQuery = latestUserMessage?.text || '';
    console.log('📝 User query:', userQuery);

    // Perform dual search: Gemini + Direct El Eco API
    const dualSearchStartTime = Date.now();
    console.log('🔄 Starting dual search (Gemini + El Eco API)...');
    
    const [geminiResponse, elecoResults] = await Promise.allSettled([
      // Gemini search with Google Search
      (async () => {
        const geminiStartTime = Date.now();
        console.log('🤖 Starting Gemini search with Google Search...');
        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents,
          config: {
            systemInstruction: AMAIKE_SYSTEM_PROMPT,
            tools: [{ googleSearch: {} }],
          },
        });
        console.log(`✅ Gemini search completed in ${Date.now() - geminiStartTime}ms`);
        return result;
      })(),
      // Direct El Eco API search with AI-powered keyword extraction
      (async () => {
        const elecoStartTime = Date.now();
        console.log('🔍 Starting El Eco API search with keyword extraction...');
        const result = await performMultiKeywordSearch(userQuery);
        console.log(`✅ El Eco API search completed in ${Date.now() - elecoStartTime}ms`);
        return result;
      })()
    ]);
    
    console.log(`🏁 Dual search completed in ${Date.now() - dualSearchStartTime}ms`);

    // Process Gemini response
    const processingStartTime = Date.now();
    console.log('⚙️ Processing search results...');
    
    let geminiText = '';
    let geminiSources: GroundingSource[] = [];
    
    if (geminiResponse.status === 'fulfilled') {
      geminiText = geminiResponse.value.text;
      const groundingMetadata = geminiResponse.value.candidates?.[0]?.groundingMetadata;
      const allGeminiSources: GroundingSource[] = groundingMetadata?.groundingChunks || [];
      geminiSources = allGeminiSources.filter(source => 
        source.web?.uri?.startsWith('https://www.eleco.com.ar')
      );
      console.log(`📊 Gemini: ${allGeminiSources.length} total sources, ${geminiSources.length} from El Eco`);
    } else {
      console.log('❌ Gemini search failed:', geminiResponse.reason);
    }

    // Process El Eco API results
    let elecoSources: GroundingSource[] = [];
    let elecoText = '';
    
    if (elecoResults.status === 'fulfilled' && elecoResults.value.length > 0) {
      elecoSources = convertToGroundingSources(elecoResults.value);
      elecoText = generateElecoSummary(elecoResults.value);
      console.log(`📰 El Eco API: ${elecoResults.value.length} articles found`);
    } else {
      console.log('❌ El Eco API search failed or returned no results:', elecoResults.status === 'rejected' ? elecoResults.reason : 'No articles found');
    }
    
    const allSources = [...geminiSources, ...elecoSources];

    // Temporarily disable AI validation to debug
    let validatedSources = allSources;
    console.log(`📋 Source summary: Gemini(${geminiSources.length}) + ElEco(${elecoSources.length}) = Total(${allSources.length})`);
    
    // Combine results
    const combinedText = combineSearchResults(geminiText, elecoText, validatedSources.length > 0);
    
    console.log(`⚙️ Processing completed in ${Date.now() - processingStartTime}ms`);
    console.log(`🎯 Final response: ${combinedText.length} characters, ${validatedSources.length} sources`);
    console.log(`⏱️ Total AmAIke response time: ${Date.now() - startTime}ms`);

    return { text: combinedText, sources: validatedSources };
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`❌ Error fetching response from Gemini API after ${errorTime}ms:`, error);
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
  // Don't generate additional text since sources are displayed by UI
  return '';
};

/**
 * Validates sources using AI to filter out irrelevant results
 */
const validateSourcesWithAI = async (sources: GroundingSource[], userQuery: string): Promise<GroundingSource[]> => {
  if (sources.length === 0) return sources;

  try {
    const { GoogleGenAI } = await import("@google/genai");

    if (!process.env.API_KEY) {
      console.warn("API_KEY not available for source validation, returning all sources");
      return sources;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Prepare source information for validation
    const sourceInfo = sources.map((source, index) => ({
      index,
      title: source.web?.title || 'Sin título',
      url: source.web?.uri || ''
    }));

    const validationPrompt = `
Eres un experto en validación de relevancia de artículos periodísticos.

CONSULTA DEL USUARIO: "${userQuery}"

ARTÍCULOS ENCONTRADOS:
${sourceInfo.map(s => `${s.index + 1}. ${s.title}`).join('\n')}

TAREA: Determina qué artículos son RELEVANTES para responder la consulta del usuario.

CRITERIOS DE RELEVANCIA:
- El artículo debe estar DIRECTAMENTE relacionado con la consulta
- Debe contener información ÚTIL para responder la pregunta
- Evita artículos que solo mencionen palabras similares pero no respondan la consulta
- Prioriza artículos que aporten valor informativo

RESPUESTA: Devuelve SOLO los números de los artículos relevantes separados por comas.
Ejemplo: 1,3,5

Si ningún artículo es relevante, responde: ninguno`;

    const response = await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: validationPrompt }] }],
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Validation timeout')), 10000)
      )
    ]) as any;

    const responseText = response.text.trim();
    console.log('AI validation response:', responseText);

    // Parse the response
    if (responseText.toLowerCase().includes('ninguno')) {
      return [];
    }

    const relevantIndices = responseText
      .split(',')
      .map(num => parseInt(num.trim()) - 1) // Convert to 0-based index
      .filter(index => index >= 0 && index < sources.length);

    const validatedSources = relevantIndices.map(index => sources[index]);
    console.log(`Validated ${validatedSources.length} out of ${sources.length} sources`);
    
    return validatedSources;
  } catch (error) {
    console.error('Error validating sources with AI:', error);
    // Return all sources if validation fails
    return sources;
  }
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