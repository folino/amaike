import type { ElecoApiResponse, ElecoArticle } from '../types';

const ELECO_API_BASE_URL = 'https://articapiv3.eleco.com.ar/api/v2/search';

/**
 * Simple keyword extraction without AI - much faster
 * Extracts proper nouns and meaningful terms from user query
 */
const extractSimpleKeywords = (userQuery: string): string[] => {
  // Remove common question words and articles
  const stopWords = [
    'qué', 'que', 'cuándo', 'cuando', 'dónde', 'donde', 'cómo', 'como', 
    'quién', 'quien', 'por', 'para', 'con', 'sin', 'sobre', 'acerca',
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'en', 'y', 'o', 'es', 'son', 'fue', 'han', 'ha',
    'información', 'noticias', 'artículo', 'artículos', 'nota', 'notas'
  ];

  const words = userQuery.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !stopWords.includes(word))
    .filter(word => /^[a-záéíóúñü]/.test(word)); // Only words starting with letters

  // Prioritize capitalized words (proper nouns) from original query
  const originalWords = userQuery.split(/\s+/);
  const properNouns = originalWords.filter(word => 
    /^[A-ZÁÉÍÓÚÑÜ]/.test(word) && 
    word.length > 3 &&
    !['Qué', 'Cuándo', 'Dónde', 'Cómo', 'Quién', 'Información', 'Noticias'].includes(word)
  );

  // Combine proper nouns (prioritized) with other meaningful words
  const keywords = [...new Set([
    ...properNouns.map(w => w.toLowerCase()),
    ...words.slice(0, 3) // Limit to 3 additional words
  ])];

  return keywords.slice(0, 2); // Maximum 2 keywords to avoid too many requests
};

/**
 * Optimized search that uses simple keyword extraction
 * Reduces API calls by avoiding AI-powered keyword extraction
 */
export const performOptimizedSearch = async (userQuery: string): Promise<ElecoArticle[]> => {
  try {
    const keywords = extractSimpleKeywords(userQuery);
    
    if (keywords.length === 0) {
      console.log('No meaningful keywords found for search');
      return [];
    }

    console.log(`Searching with simple-extracted keywords: ${keywords.join(', ')}`);

    const allArticles: ElecoArticle[] = [];
    const seenIds = new Set<number>();

    // Search with each keyword (but limit to avoid too many requests)
    for (const keyword of keywords.slice(0, 2)) { // Max 2 searches
      try {
        const results = await searchElecoApi(keyword);
        if (results.data) {
          results.data.forEach(article => {
            if (!seenIds.has(article.id)) {
              allArticles.push(article);
              seenIds.add(article.id);
            }
          });
        }
      } catch (error) {
        console.warn(`Error searching with keyword "${keyword}":`, error);
        // Continue with other keywords
      }
    }

    // Sort by creation date (newest first)
    return allArticles.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error('Error in optimized search:', error);
    return [];
  }
};

/**
 * Direct El Eco API search
 */
const searchElecoApi = async (keyword: string, page: number = 1, size: number = 10): Promise<ElecoApiResponse> => {
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

    return await response.json();
  } catch (error) {
    console.error('Error searching El Eco API:', error);
    throw error;
  }
};