# Performance Optimization Implementation Guide

## Problem Analysis
Current implementation makes 4-6 API calls per user message:
1. AI call for keyword extraction
2. Multiple El Eco API searches (1 primary + 2 secondary)
3. Gemini call with Google Search
4. Optional AI validation call

## Proposed Solutions

### Option 1: Single Gemini Call (Recommended) 🚀
**Reduces calls from 4-6 to 1**

```typescript
// Replace in App.tsx
import { getOptimizedAmAIkeResponse } from './services/optimizedGeminiService';

// In handleSendMessage function, replace:
const { text, sources } = await getAmAIkeResponse(messagesWithUserReply);
// With:
const { text, sources } = await getOptimizedAmAIkeResponse(messagesWithUserReply);
```

**Benefits:**
- 80-90% reduction in API calls
- Much faster response times
- Leverages Gemini's intelligent search with site:eleco.com.ar constraint
- Maintains quality of results
- Simpler error handling

### Option 2: Smart Caching Strategy
```typescript
// Create a simple in-memory cache
const responseCache = new Map<string, { response: AmAIkeResponse; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedResponse = async (messages: ChatMessage[]): Promise<AmAIkeResponse> => {
  const userQuery = messages.filter(m => m.sender === 'user').pop()?.text || '';
  const cacheKey = userQuery.toLowerCase().trim();
  
  // Check cache first
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached response');
    return cached.response;
  }
  
  // Get fresh response
  const response = await getOptimizedAmAIkeResponse(messages);
  
  // Cache the response
  responseCache.set(cacheKey, { response, timestamp: Date.now() });
  
  return response;
};
```

### Option 3: Hybrid Approach with Fallback
```typescript
export const getHybridResponse = async (messages: ChatMessage[]): Promise<AmAIkeResponse> => {
  try {
    // Try optimized Gemini first (fast)
    const response = await Promise.race([
      getOptimizedAmAIkeResponse(messages),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 8000)
      )
    ]) as AmAIkeResponse;
    
    return response;
  } catch (error) {
    console.log('Gemini failed or timed out, using fallback');
    // Fallback to direct API search only if needed
    return await getFallbackResponse(messages.filter(m => m.sender === 'user').pop()?.text || '');
  }
};
```

## Implementation Steps

### Step 1: Update App.tsx (Immediate 80% improvement)
```typescript
// Replace the import
import { getOptimizedAmAIkeResponse } from './services/optimizedGeminiService';

// In handleSendMessage, replace the API call
const { text, sources } = await getOptimizedAmAIkeResponse(messagesWithUserReply);
```

### Step 2: Monitor Performance
Add timing logs to measure improvement:
```typescript
const startTime = Date.now();
const { text, sources } = await getOptimizedAmAIkeResponse(messagesWithUserReply);
console.log(`Response time: ${Date.now() - startTime}ms`);
```

### Step 3: Optional Enhancements
- Add response caching for common queries
- Implement request deduplication
- Add loading states with progress indicators

## Expected Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| API Calls per query | 4-6 | 1 | 80-90% ↓ |
| Average response time | 8-15s | 2-4s | 70-80% ↓ |
| Error probability | High | Low | 60% ↓ |
| User experience | Poor | Excellent | Significant ↑ |

## Testing Checklist
- [ ] Responses still contain relevant information
- [ ] Sources are properly filtered to eleco.com.ar only
- [ ] Tip collection flow still works
- [ ] Error handling works properly
- [ ] Response times are significantly improved

## Rollback Plan
If issues arise, simply revert the import in App.tsx:
```typescript
// Rollback to original
import { getAmAIkeResponse } from './services/geminiService';
```