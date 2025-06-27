import yahooFinance from 'yahoo-finance2';
import { fetchStockWithFallback, handleAPIError } from './utils/apiClient.js';

// Simple in-memory cache with TTL (will reset on cold starts)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds (Yahoo data)
const ALPHA_CACHE_TTL = 60 * 60 * 1000; // 1 hour for Alpha Vantage data (more precious)

// Cache helper functions
const getCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached) {
    // Use different TTL based on data source
    const ttl = cached.data.dataSource === 'alphavantage' ? ALPHA_CACHE_TTL : CACHE_TTL;
    if (Date.now() - cached.timestamp < ttl) {
      console.log(`Cache hit for: ${key} (source: ${cached.data.dataSource || 'yahoo'})`);
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
  console.log(`Cached: ${key} (source: ${data.dataSource || 'yahoo'})`);
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

  // Extract ticker from path: /stock/AAPL -> AAPL
  const pathSegments = event.path.split('/');
  const ticker = pathSegments[pathSegments.length - 1];

  if (!ticker) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Ticker symbol is required' })
    };
  }

  const cacheKey = getCacheKey('stock', { ticker });

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
    // Add small delay to avoid rate limiting
    await delay(200);
    
    // Use fallback system to get stock data
    const stockInfo = await fetchStockWithFallback(ticker, async (symbol) => {
      // Yahoo Finance fetcher function
      const [quote, summaryDetail, defaultKeyStatistics] = await Promise.all([
        yahooFinance.quote(symbol),
        yahooFinance.quoteSummary(symbol, { modules: ['summaryDetail'] }),
        yahooFinance.quoteSummary(symbol, { modules: ['defaultKeyStatistics'] })
      ]);

      return {
        symbol: quote.symbol,
        shortName: quote.shortName || quote.displayName,
        currentPrice: quote.regularMarketPrice,
        currency: quote.currency,
        marketCap: summaryDetail.summaryDetail?.marketCap,
        peRatio: summaryDetail.summaryDetail?.trailingPE,
        dividendYield: summaryDetail.summaryDetail?.dividendYield,
        beta: summaryDetail.summaryDetail?.beta,
        fiftyTwoWeekHigh: summaryDetail.summaryDetail?.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: summaryDetail.summaryDetail?.fiftyTwoWeekLow,
        volume: quote.regularMarketVolume,
        avgVolume: quote.averageDailyVolume10Day,
        sector: summaryDetail.summaryDetail?.sector,
        industry: summaryDetail.summaryDetail?.industry,
        profitMargins: defaultKeyStatistics.defaultKeyStatistics?.profitMargins,
        bookValue: defaultKeyStatistics.defaultKeyStatistics?.bookValue,
        priceToBook: defaultKeyStatistics.defaultKeyStatistics?.priceToBook
      };
    });

    // Cache successful response
    setCache(cacheKey, stockInfo);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stockInfo)
    };
  } catch (error) {
    const errorResponse = handleAPIError(error, 'stock data', ticker);
    return {
      statusCode: errorResponse.status,
      headers,
      body: JSON.stringify({
        message: errorResponse.message,
        type: errorResponse.type,
        ticker: ticker
      })
    };
  }
}; 