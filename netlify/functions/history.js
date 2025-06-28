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

// Timeout wrapper for API calls
const withTimeout = (promise, timeoutMs, errorMessage) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
};

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
    
    // Performance monitoring
    const startTime = Date.now();
    console.log(`Starting history request for ${ticker} at ${new Date(startTime).toISOString()}`);
    
    const queryOptions = { period1: startDate, period2: endDate };
    
    // Optimize: Check if ticker is same as benchmark to avoid duplicate API calls
    const benchmarkTicker = 'SPY';
    const isDuplicateRequest = ticker.toUpperCase() === benchmarkTicker;
    
    console.log(`Fetching history for ${ticker}, benchmark: ${benchmarkTicker}, duplicate: ${isDuplicateRequest}`);
    
    let stockData, benchmarkData;
    
    if (isDuplicateRequest) {
      // Single API call when ticker equals benchmark
      console.log(`Optimizing: Single API call for ${ticker} (same as benchmark)`);
      stockData = await withTimeout(
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
        20000, // 20 second timeout for single call
        `Request timeout: ${ticker} data took too long to fetch`
      );
      // Use same data for benchmark
      benchmarkData = stockData;
    } else {
      // Parallel calls for different tickers with timeout
      console.log(`Fetching separate data for ${ticker} and benchmark ${benchmarkTicker}`);
      [stockData, benchmarkData] = await Promise.all([
        withTimeout(
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
          15000, // 15 second timeout for parallel calls
          `Request timeout: ${ticker} data took too long to fetch`
        ),
        withTimeout(
          fetchHistoryWithFallback(benchmarkTicker, queryOptions, async (symbol, options) => {
            // Convert date strings to Date objects for Yahoo Finance
            const chartOptions = {
              period1: new Date(options.period1),
              period2: new Date(options.period2),
              interval: '1d'
            };
            const data = await yahooFinance.chart(symbol, chartOptions);
            return data;
          }),
          15000, // 15 second timeout for parallel calls
          `Request timeout: ${benchmarkTicker} benchmark data took too long to fetch`
        )
      ]);
    }

    // Performance logging
    const duration = Date.now() - startTime;
    console.log(`History request completed for ${ticker} in ${duration}ms`);
    
    const response = {
      stock: stockData.quotes,
      benchmark: benchmarkData.quotes,
      dataSource: {
        stock: stockData.dataSource || 'yahoo',
        benchmark: benchmarkData.dataSource || 'yahoo'
      },
      performance: {
        duration,
        optimized: isDuplicateRequest,
        timestamp: new Date().toISOString()
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
    // Performance logging for failed requests
    const duration = Date.now() - startTime;
    console.error(`History request failed for ${ticker} after ${duration}ms:`, error.message);
    
    // Check if this is a timeout error - provide graceful degradation
    if (error.message.includes('timeout')) {
      console.log(`Timeout detected for ${ticker}, providing helpful error message`);
      
      return {
        statusCode: 408, // Request Timeout
        headers,
        body: JSON.stringify({
          message: `Request timeout: Historical data for ${ticker} took too long to fetch`,
          type: 'timeout',
          ticker: ticker,
          period: `${startDate} to ${endDate}`,
          suggestion: 'Try a shorter date range or try again later. Large date ranges may exceed processing limits.',
          performance: {
            duration,
            timeout: true,
            timestamp: new Date().toISOString()
          }
        })
      };
    }
    
    const errorResponse = handleAPIError(error, 'historical data', ticker);
    return {
      statusCode: errorResponse.status,
      headers,
      body: JSON.stringify({
        message: errorResponse.message,
        type: errorResponse.type,
        ticker: ticker,
        period: `${startDate} to ${endDate}`,
        performance: {
          duration,
          timestamp: new Date().toISOString()
        }
      })
    };
  }
}; 