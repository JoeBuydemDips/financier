import yahooFinance from 'yahoo-finance2';

// Simple in-memory cache with TTL (will reset on cold starts)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cache helper functions
const getCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit for: ${key}`);
    return cached.data;
  }
  if (cached) {
    cache.delete(key); // Remove expired cache
  }
  return null;
};

const setCache = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  console.log(`Cached: ${key}`);
};

// Error handler for Yahoo Finance API issues
const handleYahooError = (error, operation) => {
  console.error(`Yahoo Finance ${operation} error:`, error);
  
  if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
    return {
      status: 408,
      message: 'Yahoo Finance API is currently slow to respond. Please try again in a moment.',
      type: 'timeout'
    };
  }
  
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return {
      status: 503,
      message: 'Yahoo Finance API is currently unavailable. Please check your internet connection and try again.',
      type: 'connection'
    };
  }
  
  if (error.status === 429) {
    return {
      status: 429,
      message: 'Too many requests to Yahoo Finance API. Please wait a few minutes and try again.',
      type: 'rate_limit'
    };
  }
  
  if (error.status === 404) {
    return {
      status: 404,
      message: 'No search results found for the given query.',
      type: 'not_found'
    };
  }
  
  return {
    status: 500,
    message: 'Yahoo Finance API is experiencing issues. Please try again later.',
    type: 'api_error'
  };
};

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
  const query = pathSegments[pathSegments.length - 1];

  if (!query) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Search query is required' })
    };
  }

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
    
    // Use Yahoo Finance search
    const searchResults = await yahooFinance.search(decodeURIComponent(query));
    
    // Filter and format results for stocks only
    const filteredResults = searchResults.quotes
      .filter(result => result.typeDisp === 'Equity')
      .slice(0, 10) // Limit to top 10 results
      .map(result => ({
        symbol: result.symbol,
        shortname: result.shortname || result.longname,
        exchange: result.exchDisp,
        type: result.typeDisp
      }));

    // Cache successful response
    setCache(cacheKey, filteredResults);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(filteredResults)
    };
  } catch (error) {
    const errorResponse = handleYahooError(error, 'search');
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