import type { ElecoApiResponse, ElecoArticle, SearchKeywords } from '../types';

const ELECO_API_BASE_URL = 'https://articapiv3.eleco.com.ar/api/v2/search';

/**
 * Extracts meaningful keywords from user query using AI
 * Uses Gemini to intelligently identify the most relevant search terms
 */
export const extractSearchKeywords = async (userQuery: string): Promise<SearchKeywords> => {
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

TAREA: Extrae SOLO palabras clave que funcionen bien con SQL LIKE para encontrar artículos relevantes.

REGLAS ESTRICTAS PARA SQL LIKE:
1. SOLO nombres propios: personas, lugares, instituciones, equipos, eventos
2. NUNCA verbos: "juega", "pasó", "sabe", "dice", "afirma", "declara"
3. NUNCA palabras genéricas: "que", "se", "de", "la", "calle", "información", "noticias", "municipio", "gobierno", "hay", "sobre", "acerca", "cuándo", "dónde", "cómo", "por qué"
4. Si la consulta es muy genérica, devuelve primary vacío
5. Preserva nombres completos: "San Martín", "José de San Martín", "Juan Manazzoni"
6. Máximo 1 palabra clave principal, máximo 2 secundarias

FORMATO OBLIGATORIO (JSON):
{
  "primary": "palabra_clave_principal_o_vacio",
  "secondary": ["palabra_clave_2", "palabra_clave_3"]
}

EJEMPLOS CORRECTOS PARA SQL LIKE:
- "¿Cuándo juega Santamarina?" → {"primary": "santamarina", "secondary": []}
- "¿Qué pasó con Pedersoli?" → {"primary": "pedersoli", "secondary": []}
- "Accidente en San Martín" → {"primary": "san martín", "secondary": ["accidente"]}
- "Noticias del municipio" → {"primary": "", "secondary": []}
- "Información sobre Juan Manazzoni" → {"primary": "juan manazzoni", "secondary": []}
- "¿Dónde está la calle de Pedersoli?" → {"primary": "pedersoli", "secondary": []}
- "¿Cómo está el Hospital Santamarina?" → {"primary": "hospital santamarina", "secondary": []}

RESPUESTA (solo JSON, sin explicaciones):`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts: [{ text: keywordPrompt }] }],
    });

    const responseText = response.text.trim();
    console.log('AI keyword extraction response:', responseText);
    
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
      console.log('Parsed keywords:', keywords);
      
      // Validate the response structure
      if (typeof keywords.primary === 'string' && Array.isArray(keywords.secondary)) {
        return {
          primary: keywords.primary || '',
          secondary: keywords.secondary || []
        };
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (parseError) {
      console.warn('Failed to parse AI keyword response, using fallback');
      console.log('Parse error:', parseError);
      console.log('Raw response:', responseText);
      return fallbackKeywordExtraction(userQuery);
    }
  } catch (error) {
    console.error('Error extracting keywords with AI:', error);
    // Fallback to simple extraction
    return fallbackKeywordExtraction(userQuery);
  }
};

/**
 * Fallback keyword extraction when AI fails
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
      secondary: properNouns.slice(1).map(w => w.toLowerCase())
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
    console.log("data", data);  
    return data;
  } catch (error) {
    console.error('Error searching El Eco API:', error);
    throw error;
  }
};

/**
 * Performs multiple searches with AI-extracted keywords
 * Uses Gemini to intelligently extract the most relevant search terms
 */
export const performMultiKeywordSearch = async (userQuery: string): Promise<ElecoArticle[]> => {
  const allArticles: ElecoArticle[] = [];
  const seenIds = new Set<number>();

  try {
    // Extract keywords using AI
    const keywords = await extractSearchKeywords(userQuery);
    
    // Only search if we have a valid primary keyword
    if (!keywords.primary || keywords.primary.trim() === '') {
      console.log('No valid primary keyword found, skipping direct API search');
      return [];
    }

    // Search with primary keyword
    console.log(`Searching with AI-extracted primary keyword: "${keywords.primary}"`);
    const primaryResults = await searchElecoApi(keywords.primary);
    if (primaryResults.data) {
      primaryResults.data.forEach(article => {
        if (!seenIds.has(article.id)) {
          allArticles.push(article);
          seenIds.add(article.id);
        }
      });
    }

    // Search with secondary keywords (limit to 2 to avoid too many requests)
    const validSecondaryKeywords = keywords.secondary
      .filter(keyword => keyword && keyword.trim() !== '')
      .slice(0, 2);
    
    console.log(`AI-extracted secondary keywords: ${validSecondaryKeywords.join(', ')}`);
    
    for (const keyword of validSecondaryKeywords) {
      try {
        console.log(`Searching with secondary keyword: "${keyword}"`);
        const secondaryResults = await searchElecoApi(keyword);
        if (secondaryResults.data) {
          secondaryResults.data.forEach(article => {
            if (!seenIds.has(article.id)) {
              allArticles.push(article);
              seenIds.add(article.id);
            }
          });
        }
      } catch (error) {
        console.warn(`Error searching with secondary keyword "${keyword}":`, error);
        // Continue with other keywords even if one fails
      }
    }

    // Sort by creation date (newest first)
    return allArticles.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error('Error in AI-powered multi-keyword search:', error);
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

