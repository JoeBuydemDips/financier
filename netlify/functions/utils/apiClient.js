// Shared utilities for API fallback management
import alphaVantage from 'alphavantage';
import yahooFinance from 'yahoo-finance2';

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
  const timeUntilReset = Math.ceil((alphaVantageResetTime - Date.now()) / (1000 * 60 * 60)); // hours
  console.log(`Alpha Vantage calls used: ${alphaVantageCallCount}/25. Reset in ${timeUntilReset} hours.`);
  
  // Log warning when approaching limit
  if (alphaVantageCallCount >= 20) {
    console.warn(`WARNING: Alpha Vantage API approaching rate limit (${alphaVantageCallCount}/25 calls used)`);
  }
};

// Export function for external tracking (used by stock.js hybrid approach)
const trackAlphaVantageCallExternal = () => {
  trackAlphaVantageCall();
};

// Get current API status for debugging
const getApiStatus = () => {
  const timeUntilReset = Math.ceil((alphaVantageResetTime - Date.now()) / (1000 * 60 * 60)); // hours
  return {
    alphaVantageCallsUsed: alphaVantageCallCount,
    alphaVantageCallsRemaining: 25 - alphaVantageCallCount,
    alphaVantageResetInHours: timeUntilReset,
    alphaVantageApiKeyConfigured: !!process.env.ALPHA_VANTAGE_API_KEY,
    canUseAlphaVantage: canUseAlphaVantage()
  };
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

// Check if symbol is cryptocurrency (e.g., BTC-USD, ETH-USD)
const isCryptoSymbol = (symbol) => {
  return symbol.includes('-USD') || symbol.includes('-USDT') || 
         ['BTC', 'ETH', 'ADA', 'DOT', 'SOL', 'DOGE', 'MATIC', 'AVAX'].includes(symbol.toUpperCase());
};

// Convert Yahoo crypto symbol to Alpha Vantage format (BTC-USD -> BTC)
const convertCryptoSymbol = (symbol) => {
  if (symbol.includes('-')) {
    return symbol.split('-')[0].toUpperCase();
  }
  return symbol.toUpperCase();
};

// Map Alpha Vantage crypto data to Yahoo Finance format
const mapAlphaVantageCryptoToYahoo = (exchangeRate, originalSymbol) => {
  if (!exchangeRate) return null;
  
  const realtimeRate = exchangeRate['Realtime Currency Exchange Rate'];
  if (!realtimeRate) return null;
  
  return {
    symbol: originalSymbol, // Keep original format (BTC-USD)
    shortName: `${realtimeRate['2. From_Currency Name']}`,
    currentPrice: parseFloat(realtimeRate['5. Exchange Rate']),
    currency: realtimeRate['4. To_Currency Code'],
    marketCap: null, // Not available in exchange rate data
    peRatio: null,
    dividendYield: null,
    beta: null,
    fiftyTwoWeekHigh: null,
    fiftyTwoWeekLow: null,
    volume: null,
    avgVolume: null,
    sector: 'Cryptocurrency',
    industry: 'Digital Currency',
    profitMargins: null,
    bookValue: null,
    priceToBook: null,
    quoteType: 'CRYPTOCURRENCY',
    dataSource: 'alphavantage'
  };
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

// Map Alpha Vantage crypto historical data to Yahoo Finance format
const mapAlphaVantageCryptoHistoryToYahoo = (cryptoData) => {
  if (!cryptoData || !cryptoData['Time Series (Digital Currency Daily)']) return [];
  
  const dailyData = cryptoData['Time Series (Digital Currency Daily)'];
  
  return Object.entries(dailyData)
    .map(([date, data]) => ({
      date: new Date(date),
      open: parseFloat(data['1a. open (USD)']),
      high: parseFloat(data['2a. high (USD)']),
      low: parseFloat(data['3a. low (USD)']),
      close: parseFloat(data['4a. close (USD)']),
      volume: parseFloat(data['5. volume'])
    }))
    .sort((a, b) => a.date - b.date); // Sort by date ascending
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
    const isCrypto = isCryptoSymbol(ticker);
    
    // For CRYPTO: Use Alpha Vantage PRIMARY (to avoid CSP eval() issues)
    if (isCrypto) {
      // Check if we can use Alpha Vantage
      if (!canUseAlphaVantage()) {
        console.log(`Alpha Vantage rate limit reached (${alphaVantageCallCount}/25 calls used). Falling back to Yahoo Finance...`);
        throw new Error('RATE_LIMIT_REACHED');
      }
      
      try {
        console.log(`Fetching crypto data for ${ticker} from Alpha Vantage (primary)... [Call ${alphaVantageCallCount + 1}/25]`);
        
        const alphaClient = getAlphaClient();
        if (!alphaClient) {
          console.log('Alpha Vantage API key not configured in environment variables');
          throw new Error('API_KEY_MISSING');
        }
        
        // Convert BTC-USD to BTC for Alpha Vantage API
        const cryptoSymbol = convertCryptoSymbol(ticker);
        const exchangeRate = await alphaClient.forex.rate(cryptoSymbol, 'USD');
        trackAlphaVantageCall();
        
        const mappedData = mapAlphaVantageCryptoToYahoo(exchangeRate, ticker);
        
        if (!mappedData) {
          throw new Error('No crypto data available from Alpha Vantage');
        }
        
        return mappedData;
      } catch (alphaError) {
        const isRateLimit = alphaError.message === 'RATE_LIMIT_REACHED';
        const isApiKeyMissing = alphaError.message === 'API_KEY_MISSING';
        
        if (isApiKeyMissing) {
          console.log(`Alpha Vantage API key missing for crypto ${ticker}. Check Netlify environment variables.`);
        } else if (isRateLimit) {
          console.log(`Alpha Vantage rate limit reached for crypto ${ticker}. Using Yahoo Finance fallback.`);
        } else {
          console.log(`Alpha Vantage API error for crypto ${ticker}:`, alphaError.message);
        }
        
        // Fallback to Yahoo Finance for crypto (use quote() only - accepts CSP risk)
        try {
          console.log(`Falling back to Yahoo Finance for crypto ${ticker}...`);
          // For crypto, only use quote() method - don't use quoteSummary() which fails
          const quote = await yahooFinance.quote(ticker);
          
          if (!quote || quote.regularMarketPrice === undefined) {
            throw new Error(`No quote data found for ${ticker}`);
          }
          
          const yahooResult = {
            symbol: quote.symbol,
            shortName: quote.shortName || quote.displayName || ticker.replace('-USD', ''),
            currentPrice: quote.regularMarketPrice,
            currency: quote.currency || 'USD',
            volume: quote.regularMarketVolume,
            avgVolume: quote.averageDailyVolume10Day,
            marketCap: quote.marketCap || null,
            peRatio: null, // Not available for crypto
            dividendYield: null, // Not available for crypto
            beta: null, // Not available for crypto
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
            sector: null, // Not available for crypto
            industry: null, // Not available for crypto
            profitMargins: null, // Not available for crypto
            bookValue: null, // Not available for crypto
            priceToBook: null, // Not available for crypto
            quoteType: quote.quoteType || 'CRYPTOCURRENCY'
          };
          
          return {
            ...yahooResult,
            dataSource: 'yahoo-fallback'
          };
        } catch (yahooError) {
          console.log(`Yahoo Finance also failed for crypto ${ticker}:`, yahooError.message);
          
          // Provide specific error messages based on the original Alpha Vantage error
          if (isApiKeyMissing) {
            throw new Error(`Crypto data unavailable: Alpha Vantage API key not configured. Contact administrator.`);
          } else if (isRateLimit) {
            throw new Error(`Crypto data temporarily unavailable: API rate limit reached. Please try again in a few hours.`);
          } else {
            throw new Error(`Crypto data sources are currently unavailable. Please try again in a few minutes.`);
          }
        }
      }
    }
    
    // For STOCKS: Use hybrid approach (Alpha Vantage for quotes, Yahoo for company data)
    try {
      // Try Yahoo Finance first for company data (CSP-safe)
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
    const isCrypto = isCryptoSymbol(ticker);
    
    // For CRYPTO: Use Alpha Vantage PRIMARY (to avoid CSP eval() issues)
    if (isCrypto) {
      // Check if we can use Alpha Vantage
      if (!canUseAlphaVantage()) {
        console.log(`Alpha Vantage rate limit reached (${alphaVantageCallCount}/25 calls used). Falling back to Yahoo Finance for history...`);
        throw new Error('RATE_LIMIT_REACHED');
      }
      
      try {
        console.log(`Fetching crypto history for ${ticker} from Alpha Vantage (primary)... [Call ${alphaVantageCallCount + 1}/25]`);
        
        const alphaClient = getAlphaClient();
        if (!alphaClient) {
          console.log('Alpha Vantage API key not configured in environment variables for history fetch');
          throw new Error('API_KEY_MISSING');
        }
        
        // Convert BTC-USD to BTC for Alpha Vantage API
        const cryptoSymbol = convertCryptoSymbol(ticker);
        const cryptoData = await alphaClient.crypto.daily(cryptoSymbol, 'USD');
        trackAlphaVantageCall();
        

        
        const mappedData = mapAlphaVantageCryptoHistoryToYahoo(cryptoData);
        
        if (!mappedData.length) {
          throw new Error('No crypto historical data available from Alpha Vantage');
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
        const isRateLimit = alphaError.message === 'RATE_LIMIT_REACHED';
        const isApiKeyMissing = alphaError.message === 'API_KEY_MISSING';
        
        if (isApiKeyMissing) {
          console.log(`Alpha Vantage API key missing for crypto ${ticker} history. Check Netlify environment variables.`);
        } else if (isRateLimit) {
          console.log(`Alpha Vantage rate limit reached for crypto ${ticker} history. Using Yahoo Finance fallback.`);
        } else {
          console.log(`Alpha Vantage API error for crypto ${ticker} history:`, alphaError.message);
        }
        
        // Fallback to Yahoo Finance for crypto (use chart() method - accepts CSP risk)
        try {
          console.log(`Falling back to Yahoo Finance for crypto ${ticker} history...`);
          // For crypto, use chart() method directly instead of complex yahoo fetcher
          // Convert date strings to Date objects for Yahoo Finance
          const chartOptions = {
            period1: new Date(options.period1),
            period2: new Date(options.period2),
            interval: '1d'
          };
          const chartData = await yahooFinance.chart(ticker, chartOptions);
          
          if (!chartData || !chartData.quotes || chartData.quotes.length === 0) {
            throw new Error(`No historical data found for ${ticker}`);
          }
          
          // Map chart data to expected format
          const quotes = chartData.quotes.map(quote => ({
            date: new Date(quote.date),
            open: quote.open,
            high: quote.high,
            low: quote.low,
            close: quote.close,
            volume: quote.volume
          }));
          
          return {
            quotes,
            dataSource: 'yahoo-fallback'
          };
        } catch (yahooError) {
          console.log(`Yahoo Finance also failed for crypto ${ticker} history:`, yahooError.message);
          
          // Provide specific error messages based on the original Alpha Vantage error
          if (isApiKeyMissing) {
            throw new Error(`Crypto historical data unavailable: Alpha Vantage API key not configured. Contact administrator.`);
          } else if (isRateLimit) {
            throw new Error(`Crypto historical data temporarily unavailable: API rate limit reached. Please try again in a few hours.`);
          } else {
            throw new Error(`Crypto data sources are currently unavailable. Please try again in a few minutes.`);
          }
        }
      }
    }
    
    // For STOCKS: Try Yahoo Finance first
    try {
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
  trackAlphaVantageCallExternal,
  getApiStatus,
  isCryptoSymbol,
  convertCryptoSymbol,
  mapAlphaVantageToYahooStock,
  mapAlphaVantageCryptoToYahoo,
  mapAlphaVantageToYahooHistory,
  mapAlphaVantageCryptoHistoryToYahoo,
  mapAlphaVantageToYahooSearch,
  createCacheHeaders
}; 