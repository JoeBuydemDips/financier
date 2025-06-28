import yahooFinance from 'yahoo-finance2';
import { fetchHistoryWithFallback, handleAPIError, createCacheHeaders } from './utils/apiClient.js';

// Simple in-memory cache with TTL (will reset on cold starts)
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour for Yahoo data (historical data changes less)
const ALPHA_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours for Alpha Vantage data (more precious)

// Cache helper functions
const getCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached) {
    // Use different TTL based on data source (handle object format)
    const hasAlphaVantage = typeof cached.data.dataSource === 'object'
      ? (cached.data.dataSource.stock === 'alphavantage' || cached.data.dataSource.benchmark === 'alphavantage')
      : (cached.data.dataSource === 'alphavantage');
    const ttl = hasAlphaVantage ? ALPHA_CACHE_TTL : CACHE_TTL;
    
    if (Date.now() - cached.timestamp < ttl) {
      const sourceInfo = typeof cached.data.dataSource === 'object' 
        ? `stock:${cached.data.dataSource.stock}, benchmark:${cached.data.dataSource.benchmark}`
        : (cached.data.dataSource || 'yahoo');
      console.log(`Cache hit for: ${key} (source: ${sourceInfo})`);
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
  // Handle both string and object dataSource formats
  const sourceInfo = typeof data.dataSource === 'object' 
    ? `stock:${data.dataSource.stock}, benchmark:${data.dataSource.benchmark}`
    : (data.dataSource || 'yahoo');
  console.log(`Cached: ${key} (source: ${sourceInfo})`);
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

  // Extract ticker from path: /history/AAPL -> AAPL
  const pathSegments = event.path.split('/');
  const rawTicker = pathSegments[pathSegments.length - 1];

  if (!rawTicker) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Ticker symbol is required' })
    };
  }

  // Normalize ticker to uppercase for consistency (btc-usd -> BTC-USD)
  const ticker = rawTicker.toUpperCase();

  // Parse query parameters
  const { startDate, endDate } = event.queryStringParameters || {};
  
  if (!startDate || !endDate) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'startDate and endDate query parameters are required' })
    };
  }

  const cacheKey = getCacheKey('history', { ticker, startDate, endDate });

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
    
    const queryOptions = { period1: startDate, period2: endDate };
    
    // Use fallback system to get historical data for both stock and benchmark
    const [stockData, benchmarkData] = await Promise.all([
      fetchHistoryWithFallback(ticker, queryOptions, async (symbol, options) => {
        // Convert date strings to Date objects for Yahoo Finance
        const chartOptions = {
          period1: new Date(options.period1),
          period2: new Date(options.period2),
          interval: '1d'
        };
        const data = await yahooFinance.chart(symbol, chartOptions);
        return data;
      }),
      fetchHistoryWithFallback('SPY', queryOptions, async (symbol, options) => {
        // Convert date strings to Date objects for Yahoo Finance
        const chartOptions = {
          period1: new Date(options.period1),
          period2: new Date(options.period2),
          interval: '1d'
        };
        const data = await yahooFinance.chart(symbol, chartOptions);
        return data;
      })
    ]);

    const response = {
      stock: stockData.quotes,
      benchmark: benchmarkData.quotes,
      dataSource: {
        stock: stockData.dataSource || 'yahoo',
        benchmark: benchmarkData.dataSource || 'yahoo'
      }
    };

    // Cache successful response
    setCache(cacheKey, response);
    
    // Add HTTP cache headers for CDN caching (historical data can be cached longer)
    const cacheHeaders = createCacheHeaders(
      response.dataSource?.stock || 'yahoo', 
      response.dataSource?.stock === 'alphavantage' ? 14400 : 3600 // 4hrs for AV, 1hr for Yahoo
    );
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        ...cacheHeaders
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    const errorResponse = handleAPIError(error, 'historical data', ticker);
    return {
      statusCode: errorResponse.status,
      headers,
      body: JSON.stringify({
        message: errorResponse.message,
        type: errorResponse.type,
        ticker: ticker,
        period: `${startDate} to ${endDate}`
      })
    };
  }
}; 