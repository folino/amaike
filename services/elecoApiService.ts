import type { ElecoApiResponse, ElecoArticle, SearchKeywords } from '../types';

const ELECO_API_BASE_URL = 'https://articapiv3.eleco.com.ar/api/v2/search';

/**
 * Extracts meaningful keywords from user query using AI
 * Uses Gemini to intelligently identify the most relevant search terms
 */
export const extractSearchKeywords = async (userQuery: string): Promise<SearchKeywords> => {
  const extractionStartTime = Date.now();
  console.log('🧠 Starting AI keyword extraction for query:', userQuery);
  
  try {
    const { GoogleGenAI } = await import("@google/genai");
    
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const keywordPrompt = `
Eres un experto en extracción de palabras clave para búsquedas SQL en bases de datos de noticias.

CONSULTA: "${userQuery}"

CONTEXTO IMPORTANTE: Las palabras clave se usarán en consultas SQL con LIKE, donde:
- "Santamarina" encontrará "Santamarina", "santamarina", "SANTAMARINA"
- "juega" es un verbo genérico que NO encontrará artículos relevantes
- Solo nombres propios, lugares e instituciones son útiles para LIKE

TAREA: Extrae SOLO la palabra clave más importante que funcione bien con SQL LIKE para encontrar artículos relevantes.

REGLAS ESTRICTAS PARA SQL LIKE:
1. SOLO nombres propios: personas, lugares, instituciones, equipos, eventos
2. NUNCA verbos: "juega", "pasó", "sabe", "dice", "afirma", "declara"
3. NUNCA palabras genéricas: "que", "se", "de", "la", "calle", "información", "noticias", "municipio", "gobierno", "hay", "sobre", "acerca", "cuándo", "dónde", "cómo", "por qué"
4. Si la consulta es muy genérica, devuelve primary vacío
5. Preserva nombres completos: "San Martín", "José de San Martín", "Juan Manazzoni"
6. Solo 1 palabra clave principal

FORMATO OBLIGATORIO (JSON):
{
  "primary": "palabra_clave_principal_o_vacio"
}

EJEMPLOS CORRECTOS PARA SQL LIKE:
- "¿Cuándo juega Santamarina?" → {"primary": "santamarina"}
- "¿Qué pasó con Pedersoli?" → {"primary": "pedersoli"}
- "Accidente en San Martín" → {"primary": "san martín"}
- "Noticias del municipio" → {"primary": ""}
- "Información sobre Juan Manazzoni" → {"primary": "juan manazzoni"}
- "¿Dónde está la calle de Pedersoli?" → {"primary": "pedersoli"}
- "¿Cómo está el Hospital Santamarina?" → {"primary": "hospital santamarina"}

RESPUESTA (solo JSON, sin explicaciones):`;

    const aiStartTime = Date.now();
    console.log('🤖 Calling Gemini for keyword extraction...');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts: [{ text: keywordPrompt }] }],
    });

    const responseText = response.text.trim();
    console.log(`✅ AI keyword extraction completed in ${Date.now() - aiStartTime}ms`);
    console.log('📝 AI keyword extraction response:', responseText);
    
    // Try to parse JSON response
    try {
      // Clean the response text to extract JSON
      let jsonText = responseText;
      
      // Look for JSON object in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      const keywords = JSON.parse(jsonText);
      console.log('✅ Successfully parsed keywords:', keywords);
      
      // Validate the response structure
      if (typeof keywords.primary === 'string') {
        const result = {
          primary: keywords.primary || '',
          secondary: [] // Always empty now
        };
        console.log(`⚙️ Keyword extraction completed in ${Date.now() - extractionStartTime}ms:`, result);
        return result;
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI keyword response, using fallback');
      console.log('Parse error:', parseError);
      console.log('Raw response:', responseText);
      const fallbackResult = fallbackKeywordExtraction(userQuery);
      console.log(`🔄 Fallback keyword extraction completed in ${Date.now() - extractionStartTime}ms:`, fallbackResult);
      return fallbackResult;
    }
  } catch (error) {
    const errorTime = Date.now() - extractionStartTime;
    console.error(`❌ Error extracting keywords with AI after ${errorTime}ms:`, error);
    // Fallback to simple extraction
    const fallbackResult = fallbackKeywordExtraction(userQuery);
    console.log(`🔄 Fallback keyword extraction completed in ${errorTime}ms:`, fallbackResult);
    return fallbackResult;
  }
};

/**
 * Fallback keyword extraction when AI fails - only returns primary keyword
 */
const fallbackKeywordExtraction = (userQuery: string): SearchKeywords => {
  // Simple fallback: look for capitalized words (proper nouns)
  const words = userQuery.split(' ');
  const properNouns = words.filter(word => 
    word.length > 3 && 
    /^[A-ZÁÉÍÓÚÑÜ]/.test(word) &&
    !['Qué', 'Quién', 'Cuándo', 'Dónde', 'Cómo', 'Porque', 'Información', 'Noticias'].includes(word)
  );
  
  if (properNouns.length > 0) {
    return {
      primary: properNouns[0].toLowerCase(),
      secondary: [] // Always empty now
    };
  }
  
  // If no proper nouns, return empty to avoid generic searches
  return {
    primary: '',
    secondary: []
  };
};


/**
 * Searches El Eco API with a specific keyword
 */
export const searchElecoApi = async (keyword: string, page: number = 1, size: number = 10): Promise<ElecoApiResponse> => {
  const apiCallStart = Date.now();
  console.log(`🌐 Making El Eco API call for keyword: "${keyword}"`);
  
  try {
    const url = new URL(ELECO_API_BASE_URL);
    url.searchParams.set('filter', JSON.stringify({ search: keyword }));
    url.searchParams.set('sortType', 'DESC');
    url.searchParams.set('page', page.toString());
    url.searchParams.set('size', size.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`✅ El Eco API call completed in ${Date.now() - apiCallStart}ms for "${keyword}", returned ${data.data?.length || 0} articles`);
    console.log("data", data);  
    return data;
  } catch (error) {
    const errorTime = Date.now() - apiCallStart;
    console.error(`❌ Error searching El Eco API after ${errorTime}ms for keyword "${keyword}":`, error);
    throw error;
  }
};

/**
 * Performs single keyword search with AI-extracted primary keyword
 * Reduces API calls by using only the most relevant keyword
 */
export const performMultiKeywordSearch = async (userQuery: string): Promise<ElecoArticle[]> => {
  const searchStartTime = Date.now();
  console.log('🔍 Starting single keyword search for:', userQuery);
  
  const allArticles: ElecoArticle[] = [];
  const seenIds = new Set<number>();

  try {
    // Extract keywords using AI
    const keywordStartTime = Date.now();
    const keywords = await extractSearchKeywords(userQuery);
    console.log(`🔑 Keywords extracted in ${Date.now() - keywordStartTime}ms:`, keywords);
    
    // Only search if we have a valid primary keyword
    if (!keywords.primary || keywords.primary.trim() === '') {
      console.log('⚠️ No valid primary keyword found, skipping direct API search');
      return [];
    }

    // Search with primary keyword only
    const primarySearchStart = Date.now();
    console.log(`🎯 Searching with AI-extracted primary keyword: "${keywords.primary}"`);
    const primaryResults = await searchElecoApi(keywords.primary);
    console.log(`✅ Primary search completed in ${Date.now() - primarySearchStart}ms, found ${primaryResults.data?.length || 0} articles`);
    
    if (primaryResults.data) {
      primaryResults.data.forEach(article => {
        if (!seenIds.has(article.id)) {
          allArticles.push(article);
          seenIds.add(article.id);
        }
      });
    }

    // Sort by creation date (newest first)
    const sortedArticles = allArticles.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    console.log(`🏁 Single keyword search completed in ${Date.now() - searchStartTime}ms`);
    console.log(`📊 Final results: ${sortedArticles.length} articles from 1 search`);
    
    return sortedArticles;
  } catch (error) {
    const errorTime = Date.now() - searchStartTime;
    console.error(`❌ Error in single keyword search after ${errorTime}ms:`, error);
    return [];
  }
};

/**
 * Converts El Eco API articles to GroundingSource format
 */
export const convertToGroundingSources = (articles: ElecoArticle[]): any[] => {
  return articles.map(article => ({
    web: {
      uri: `https://www.eleco.com.ar${article.link_note}`,
      title: article.title
    }
  }));
};

