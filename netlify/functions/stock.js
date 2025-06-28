import yahooFinance from 'yahoo-finance2';
import { fetchStockWithFallback, handleAPIError, createCacheHeaders } from './utils/apiClient.js';

// Simple in-memory cache with TTL (will reset on cold starts)
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes for Yahoo data (increased for production)
const ALPHA_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours for Alpha Vantage data (more precious)

// Cache helper functions

// Cache helper functions
const getCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached) {
    // Use different TTL based on data source
    const isAlphaVantageData = cached.data && cached.data.dataSource === 'alphavantage';
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
  const isAlphaVantageData = data && data.dataSource === 'alphavantage';
  const source = isAlphaVantageData ? 'alphavantage' : 'yahoo';
  console.log(`Cached: ${key} (source: ${source})`);
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

  // Extract ticker from path: /stock/AAPL -> AAPL
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
    
    // Use unified approach: Alpha Vantage primary for crypto, hybrid for stocks
    const stockInfo = await fetchStockWithFallback(ticker, async (symbol) => {
      // Yahoo Finance fetcher function (for fallback or stocks)
      const [quote, summaryDetail, defaultKeyStatistics] = await Promise.all([
        yahooFinance.quote(symbol), // May have CSP issues for quotes
        yahooFinance.quoteSummary(symbol, { modules: ['summaryDetail'] }),
        yahooFinance.quoteSummary(symbol, { modules: ['defaultKeyStatistics'] })
      ]);
      
      return {
        symbol: quote.symbol,
        shortName: quote.shortName || quote.displayName,
        currentPrice: quote.regularMarketPrice,
        currency: quote.currency,
        volume: quote.regularMarketVolume,
        avgVolume: quote.averageDailyVolume10Day,
        marketCap: summaryDetail.summaryDetail?.marketCap,
        peRatio: summaryDetail.summaryDetail?.trailingPE,
        dividendYield: summaryDetail.summaryDetail?.dividendYield,
        beta: summaryDetail.summaryDetail?.beta,
        fiftyTwoWeekHigh: summaryDetail.summaryDetail?.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: summaryDetail.summaryDetail?.fiftyTwoWeekLow,
        sector: summaryDetail.summaryDetail?.sector,
        industry: summaryDetail.summaryDetail?.industry,
        profitMargins: defaultKeyStatistics.defaultKeyStatistics?.profitMargins,
        bookValue: defaultKeyStatistics.defaultKeyStatistics?.bookValue,
        priceToBook: defaultKeyStatistics.defaultKeyStatistics?.priceToBook,
        quoteType: quote.quoteType || 'EQUITY'
      };
    });

    // Cache successful response
    setCache(cacheKey, stockInfo);
    
    // Add HTTP cache headers for CDN caching
    const dataSource = stockInfo.dataSource || 'yahoo';
    const isAlphaVantageData = dataSource.includes('alphavantage');
    const cacheHeaders = createCacheHeaders(
      isAlphaVantageData ? 'alphavantage' : 'yahoo', 
      isAlphaVantageData ? 7200 : 1800 // 2hrs for AV data, 30min for Yahoo
    );
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        ...cacheHeaders
      },
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