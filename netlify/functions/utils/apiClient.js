// Shared utilities for API fallback management
import alphaVantage from 'alphavantage';

let alpha = null;

// Initialize Alpha Vantage client lazily
const getAlphaClient = () => {
  if (!alpha && process.env.ALPHA_VANTAGE_API_KEY) {
    alpha = alphaVantage({ key: process.env.ALPHA_VANTAGE_API_KEY });
  }
  return alpha;
};

// Rate limiting tracking for Alpha Vantage
let alphaVantageCallCount = 0;
let alphaVantageResetTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now

// Request deduplication - prevent multiple identical requests
const pendingRequests = new Map();

// Check if we can make Alpha Vantage API calls
const canUseAlphaVantage = () => {
  // First check if API key is available
  if (!process.env.ALPHA_VANTAGE_API_KEY) {
    console.log('Alpha Vantage API key not available');
    return false;
  }
  
  // Reset counter if 24 hours have passed
  if (Date.now() > alphaVantageResetTime) {
    alphaVantageCallCount = 0;
    alphaVantageResetTime = Date.now() + (24 * 60 * 60 * 1000);
  }
  
  // Alpha Vantage free tier: 25 calls per day
  return alphaVantageCallCount < 25;
};

// Track Alpha Vantage API usage
const trackAlphaVantageCall = () => {
  alphaVantageCallCount++;
  console.log(`Alpha Vantage calls used: ${alphaVantageCallCount}/25`);
};

// Create unique request key for deduplication
const createRequestKey = (type, params) => {
  return `${type}:${JSON.stringify(params)}`;
};

// Request deduplication wrapper
const deduplicateRequest = async (requestKey, requestFn) => {
  // If request is already pending, wait for it
  if (pendingRequests.has(requestKey)) {
    console.log(`Deduplicating request: ${requestKey}`);
    return await pendingRequests.get(requestKey);
  }
  
  // Make new request and store promise
  const requestPromise = requestFn();
  pendingRequests.set(requestKey, requestPromise);
  
  try {
    const result = await requestPromise;
    return result;
  } finally {
    // Clean up pending request
    pendingRequests.delete(requestKey);
  }
};

// Map Alpha Vantage stock data to Yahoo Finance format
const mapAlphaVantageToYahooStock = (overview, quote) => {
  if (!overview || !quote) return null;
  
  const globalQuote = quote['Global Quote'];
  if (!globalQuote) return null;
  
  return {
    symbol: globalQuote['01. symbol'],
    shortName: overview['Name'],
    currentPrice: parseFloat(globalQuote['05. price']),
    currency: 'USD', // Alpha Vantage primarily uses USD
    marketCap: overview['MarketCapitalization'] ? parseInt(overview['MarketCapitalization']) : null,
    peRatio: overview['PERatio'] ? parseFloat(overview['PERatio']) : null,
    dividendYield: overview['DividendYield'] ? parseFloat(overview['DividendYield']) : null,
    beta: overview['Beta'] ? parseFloat(overview['Beta']) : null,
    fiftyTwoWeekHigh: overview['52WeekHigh'] ? parseFloat(overview['52WeekHigh']) : null,
    fiftyTwoWeekLow: overview['52WeekLow'] ? parseFloat(overview['52WeekLow']) : null,
    volume: globalQuote['06. volume'] ? parseInt(globalQuote['06. volume']) : null,
    avgVolume: null, // Not available in Alpha Vantage
    sector: overview['Sector'],
    industry: overview['Industry'],
    profitMargins: overview['ProfitMargin'] ? parseFloat(overview['ProfitMargin']) : null,
    bookValue: overview['BookValue'] ? parseFloat(overview['BookValue']) : null,
    priceToBook: overview['PriceToBookRatio'] ? parseFloat(overview['PriceToBookRatio']) : null,
    dataSource: 'alphavantage'
  };
};

// Map Alpha Vantage historical data to Yahoo Finance format
const mapAlphaVantageToYahooHistory = (timeSeriesData) => {
  if (!timeSeriesData || !timeSeriesData['Time Series (Daily)']) return [];
  
  const dailyData = timeSeriesData['Time Series (Daily)'];
  
  return Object.entries(dailyData)
    .map(([date, data]) => ({
      date: new Date(date),
      open: parseFloat(data['1. open']),
      high: parseFloat(data['2. high']),
      low: parseFloat(data['3. low']),
      close: parseFloat(data['4. close']),
      volume: parseInt(data['6. volume'])
    }))
    .sort((a, b) => a.date - b.date); // Sort by date ascending
};

// Map Alpha Vantage search results to Yahoo Finance format
const mapAlphaVantageToYahooSearch = (searchData) => {
  if (!searchData || !searchData['bestMatches']) return [];
  
  return searchData['bestMatches']
    .slice(0, 10) // Limit to 10 results
    .map(match => ({
      symbol: match['1. symbol'],
      shortname: match['2. name'],
      exchange: match['4. region'],
      type: match['3. type']
    }));
};

// Fetch stock data with fallback logic and deduplication
const fetchStockWithFallback = async (ticker, yahooFetcher) => {
  const requestKey = createRequestKey('stock', { ticker });
  
  return await deduplicateRequest(requestKey, async () => {
    try {
      // Try Yahoo Finance first
      console.log(`Fetching stock data for ${ticker} from Yahoo Finance...`);
      const yahooResult = await yahooFetcher(ticker);
      return {
        ...yahooResult,
        dataSource: 'yahoo'
      };
    } catch (yahooError) {
      console.log(`Yahoo Finance failed for ${ticker}:`, yahooError.message);
      
      // Check if we can use Alpha Vantage
      if (!canUseAlphaVantage()) {
        throw new Error('Primary data source unavailable and backup API limit reached. Please try again later.');
      }
      
      try {
        console.log(`Falling back to Alpha Vantage for ${ticker}...`);
        
        // Get Alpha Vantage client and make both API calls
        const alphaClient = getAlphaClient();
        if (!alphaClient) {
          throw new Error('Alpha Vantage API key not configured');
        }
        
        const [overview, quote] = await Promise.all([
          alphaClient.fundamental.company_overview(ticker),
          alphaClient.data.quote(ticker)
        ]);
        
        trackAlphaVantageCall(); // Track 2 calls
        trackAlphaVantageCall();
        
        const mappedData = mapAlphaVantageToYahooStock(overview, quote);
        
        if (!mappedData) {
          throw new Error('No data available from Alpha Vantage');
        }
        
        return mappedData;
      } catch (alphaError) {
        console.log(`Alpha Vantage also failed for ${ticker}:`, alphaError.message);
        throw new Error(`Both data sources are currently unavailable. Please try again in a few minutes.`);
      }
    }
  });
};

// Fetch historical data with fallback logic and deduplication
const fetchHistoryWithFallback = async (ticker, options, yahooFetcher) => {
  const requestKey = createRequestKey('history', { ticker, options });
  
  return await deduplicateRequest(requestKey, async () => {
    try {
      // Try Yahoo Finance first
      console.log(`Fetching historical data for ${ticker} from Yahoo Finance...`);
      const yahooResult = await yahooFetcher(ticker, options);
      return {
        ...yahooResult,
        dataSource: 'yahoo'
      };
    } catch (yahooError) {
      console.log(`Yahoo Finance failed for ${ticker} history:`, yahooError.message);
      
      // Check if we can use Alpha Vantage
      if (!canUseAlphaVantage()) {
        throw new Error('Primary data source unavailable and backup API limit reached. Please try again later.');
      }
      
      try {
        console.log(`Falling back to Alpha Vantage for ${ticker} history...`);
        
        // Get Alpha Vantage client and fetch daily time series
        const alphaClient = getAlphaClient();
        if (!alphaClient) {
          throw new Error('Alpha Vantage API key not configured');
        }
        
        const timeSeriesData = await alphaClient.data.daily_adjusted(ticker, 'full');
        trackAlphaVantageCall();
        
        const mappedData = mapAlphaVantageToYahooHistory(timeSeriesData);
        
        if (!mappedData.length) {
          throw new Error('No historical data available from Alpha Vantage');
        }
        
        // Filter data based on date range if provided
        let filteredData = mappedData;
        if (options.period1 && options.period2) {
          const startDate = new Date(options.period1);
          const endDate = new Date(options.period2);
          filteredData = mappedData.filter(item => 
            item.date >= startDate && item.date <= endDate
          );
        }
        
        return {
          quotes: filteredData,
          dataSource: 'alphavantage'
        };
      } catch (alphaError) {
        console.log(`Alpha Vantage also failed for ${ticker} history:`, alphaError.message);
        throw new Error(`Both data sources are currently unavailable. Please try again in a few minutes.`);
      }
    }
  });
};

// Fetch search results with fallback logic and deduplication
const fetchSearchWithFallback = async (query, yahooFetcher) => {
  const requestKey = createRequestKey('search', { query });
  
  return await deduplicateRequest(requestKey, async () => {
    try {
      // Try Yahoo Finance first
      console.log(`Searching for "${query}" using Yahoo Finance...`);
      const yahooResult = await yahooFetcher(query);
      return yahooResult.map(item => ({
        ...item,
        dataSource: 'yahoo'
      }));
    } catch (yahooError) {
      console.log(`Yahoo Finance search failed for "${query}":`, yahooError.message);
      
      // Check if we can use Alpha Vantage
      if (!canUseAlphaVantage()) {
        throw new Error('Primary data source unavailable and backup API limit reached. Please try again later.');
      }
      
      try {
        console.log(`Falling back to Alpha Vantage search for "${query}"...`);
        
        const alphaClient = getAlphaClient();
        if (!alphaClient) {
          throw new Error('Alpha Vantage API key not configured');
        }
        
        const searchData = await alphaClient.data.search(query);
        trackAlphaVantageCall();
        
        const mappedData = mapAlphaVantageToYahooSearch(searchData);
        
        return mappedData.map(item => ({
          ...item,
          dataSource: 'alphavantage'
        }));
      } catch (alphaError) {
        console.log(`Alpha Vantage search also failed for "${query}":`, alphaError.message);
        throw new Error(`Both data sources are currently unavailable. Please try again in a few minutes.`);
      }
    }
  });
};

// Enhanced error handler that includes fallback information
const handleAPIError = (error, operation, ticker = '') => {
  console.error(`API ${operation} error for ${ticker}:`, error);
  
  // Determine error type and provide appropriate user message
  if (error.message.includes('rate limit') || error.message.includes('Too Many Requests')) {
    return {
      status: 429,
      message: 'Data sources are busy. Please try again in a few minutes. Consider adding Alpha Vantage backup for better reliability.',
      type: 'rate_limit'
    };
  }
  
  if (error.message.includes('backup API limit reached')) {
    return {
      status: 503,
      message: 'Primary data source is down and backup limit reached. Service will restore automatically. Please try again later.',
      type: 'backup_limit'
    };
  }
  
  if (error.message.includes('Both data sources are currently unavailable')) {
    return {
      status: 503,
      message: 'All data sources are temporarily unavailable. Please try again in a few minutes.',
      type: 'all_apis_down'
    };
  }
  
  if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
    return {
      status: 408,
      message: 'Data sources are responding slowly. Please try again in a moment.',
      type: 'timeout'
    };
  }
  
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return {
      status: 503,
      message: 'Unable to connect to data sources. Please check your internet connection and try again.',
      type: 'connection'
    };
  }
  
  if (error.status === 404 || error.message.includes('not found')) {
    return {
      status: 404,
      message: `The requested symbol "${ticker}" was not found. Please check the ticker symbol and try again.`,
      type: 'not_found'
    };
  }
  
  return {
    status: 500,
    message: 'Data sources are experiencing issues. Please try again later.',
    type: 'api_error'
  };
};

// Create cache headers for HTTP caching
const createCacheHeaders = (dataSource, cacheSeconds) => {
  const maxAge = dataSource === 'alphavantage' ? cacheSeconds * 2 : cacheSeconds; // Cache AV data longer
  
  return {
    'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    'ETag': `"${Date.now()}-${dataSource}"`,
    'Vary': 'Accept-Encoding'
  };
};

export {
  fetchStockWithFallback,
  fetchHistoryWithFallback,
  fetchSearchWithFallback,
  handleAPIError,
  canUseAlphaVantage,
  mapAlphaVantageToYahooStock,
  mapAlphaVantageToYahooHistory,
  mapAlphaVantageToYahooSearch,
  createCacheHeaders
}; 