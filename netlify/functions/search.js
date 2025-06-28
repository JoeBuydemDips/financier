import yahooFinance from 'yahoo-finance2';
import { fetchSearchWithFallback, handleAPIError, createCacheHeaders } from './utils/apiClient.js';

// Simple in-memory cache with TTL (will reset on cold starts)
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour for Yahoo data (search results don't change often)
const ALPHA_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours for Alpha Vantage data (more precious)

// Cache helper functions
const getCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached) {
    // Use different TTL based on data source
    const isAlphaVantageData = Array.isArray(cached.data) && cached.data.some(item => item.dataSource === 'alphavantage');
    const ttl = isAlphaVantageData ? ALPHA_CACHE_TTL : CACHE_TTL;
    if (Date.now() - cached.timestamp < ttl) {
      const source = isAlphaVantageData ? 'alphavantage' : 'yahoo';
      console.log(`Cache hit for: ${key} (source: ${source})`);
      return cached.data;
    }
    cache.delete(key); // Remove expired cache
  }
  return null;
};

const setCache = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  const isAlphaVantageData = Array.isArray(data) && data.some(item => item.dataSource === 'alphavantage');
  const source = isAlphaVantageData ? 'alphavantage' : 'yahoo';
  console.log(`Cached: ${key} (source: ${source})`);
};

// Error handling is now managed by the shared apiClient utility

// Add delay function to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  // Extract query from path: /search/AAPL -> AAPL
  const pathSegments = event.path.split('/');
  const rawQuery = pathSegments[pathSegments.length - 1];

  if (!rawQuery) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Search query is required' })
    };
  }

  // Normalize search query to uppercase for better matching (btc -> BTC)
  const query = rawQuery.toUpperCase();

  const cacheKey = getCacheKey('search', { query });

  // Check cache first
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(cachedData)
    };
  }

  try {
    await delay(200);
    
    // Use fallback system to search for stocks
    const searchResults = await fetchSearchWithFallback(decodeURIComponent(query), async (searchQuery) => {
      // Yahoo Finance search function
      const results = await yahooFinance.search(searchQuery);
      
      // Filter and format results for stocks only
      return results.quotes
        .filter(result => result.typeDisp === 'Equity')
        .slice(0, 10) // Limit to top 10 results
        .map(result => ({
          symbol: result.symbol,
          shortname: result.shortname || result.longname,
          exchange: result.exchDisp,
          type: result.typeDisp
        }));
    });

    // Cache successful response
    setCache(cacheKey, searchResults);
    
    // Add HTTP cache headers for CDN caching (search results can be cached long)
    const dataSource = searchResults.length > 0 ? searchResults[0].dataSource || 'yahoo' : 'yahoo';
    const cacheHeaders = createCacheHeaders(
      dataSource, 
      dataSource === 'alphavantage' ? 14400 : 3600 // 4hrs for AV, 1hr for Yahoo
    );
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        ...cacheHeaders
      },
      body: JSON.stringify(searchResults)
    };
  } catch (error) {
    const errorResponse = handleAPIError(error, 'search', query);
    return {
      statusCode: errorResponse.status,
      headers,
      body: JSON.stringify({
        message: errorResponse.message,
        type: errorResponse.type,
        query: query
      })
    };
  }
}; 