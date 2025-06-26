import express from 'express';
import yahooFinance from 'yahoo-finance2';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Simple in-memory cache with TTL
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
      message: 'The requested stock symbol was not found. Please check the ticker symbol and try again.',
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

// Get comprehensive stock data
app.get('/stock/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const cacheKey = getCacheKey('stock', { ticker });

  // Check cache first
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    // Add small delay to avoid rate limiting
    await delay(200);
    
    // Fetch multiple data sources in parallel
    const [quote, summaryDetail, defaultKeyStatistics] = await Promise.all([
      yahooFinance.quote(ticker),
      yahooFinance.quoteSummary(ticker, { modules: ['summaryDetail'] }),
      yahooFinance.quoteSummary(ticker, { modules: ['defaultKeyStatistics'] })
    ]);

    const stockInfo = {
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

    // Cache successful response
    setCache(cacheKey, stockInfo);
    res.json(stockInfo);
  } catch (error) {
    const errorResponse = handleYahooError(error, 'stock data');
    res.status(errorResponse.status).json({
      message: errorResponse.message,
      type: errorResponse.type,
      ticker: ticker
    });
  }
});

// Get historical data with benchmark comparison
app.get('/history/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const { startDate, endDate } = req.query;
  const cacheKey = getCacheKey('history', { ticker, startDate, endDate });

  // Check cache first
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    await delay(200);
    
    const queryOptions = { period1: startDate, period2: endDate };
    
    // Fetch both the target stock and S&P 500 for comparison
    const [stockData, spyData] = await Promise.all([
      yahooFinance.chart(ticker, queryOptions), // Using chart instead of deprecated historical
      yahooFinance.chart('SPY', queryOptions)
    ]);

    const response = {
      stock: stockData.quotes,
      benchmark: spyData.quotes
    };

    // Cache successful response
    setCache(cacheKey, response);
    res.json(response);
  } catch (error) {
    const errorResponse = handleYahooError(error, 'historical data');
    res.status(errorResponse.status).json({
      message: errorResponse.message,
      type: errorResponse.type,
      ticker: ticker,
      period: `${startDate} to ${endDate}`
    });
  }
});

// Cache status endpoint
app.get('/api/cache/status', (req, res) => {
  res.json({
    cacheSize: cache.size,
    entries: Array.from(cache.keys()).map(key => ({
      key,
      age: Date.now() - cache.get(key).timestamp,
      ttl: CACHE_TTL
    }))
  });
});

// Clear cache endpoint (for development)
app.post('/api/cache/clear', (req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared successfully' });
});

// NEW: Search for assets (stocks, crypto, ETFs)
app.get('/search/:query', async (req, res) => {
  const { query } = req.params;
  
  try {
    const searchResults = await yahooFinance.search(query);
    
    // Filter and format results
    const formattedResults = searchResults.quotes.slice(0, 10).map(quote => ({
      symbol: quote.symbol,
      shortName: quote.shortname || quote.longname,
      exchange: quote.exchange,
      quoteType: quote.quoteType, // EQUITY, CRYPTOCURRENCY, ETF, etc.
      typeDisp: quote.typeDisp
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Failed to search assets' });
  }
});

// NEW: Get multiple assets historical data for comparison
app.post('/compare-assets', async (req, res) => {
  const { assets, startDate, endDate } = req.body;
  
  if (!assets || !Array.isArray(assets) || assets.length === 0) {
    return res.status(400).json({ message: 'Assets array is required' });
  }

  try {
    const queryOptions = { period1: startDate, period2: endDate };
    
    // Fetch historical data for all assets in parallel
    const promises = assets.map(async (asset) => {
      try {
        const historicalData = await yahooFinance.historical(asset.symbol, queryOptions);
        return {
          symbol: asset.symbol,
          name: asset.name,
          allocation: asset.allocation || 1, // Default to 100% if not specified
          data: historicalData,
          success: true
        };
      } catch (error) {
        console.error(`Error fetching data for ${asset.symbol}:`, error);
        return {
          symbol: asset.symbol,
          name: asset.name,
          allocation: asset.allocation || 1,
          data: [],
          success: false,
          error: error.message
        };
      }
    });

    // Also fetch S&P 500 benchmark
    const benchmarkPromise = yahooFinance.historical('SPY', queryOptions);
    
    const [assetResults, benchmarkData] = await Promise.all([
      Promise.all(promises),
      benchmarkPromise
    ]);

    res.json({
      assets: assetResults,
      benchmark: benchmarkData,
      success: true
    });
  } catch (error) {
    console.error('Compare assets error:', error);
    res.status(500).json({ message: 'Failed to fetch comparison data' });
  }
});

// NEW: Calculate DCA performance for multiple assets
app.post('/calculate-dca', async (req, res) => {
  const { 
    assets, 
    startDate, 
    endDate, 
    initialAmount = 0,
    contributionAmount,
    contributionFrequency = 'monthly' 
  } = req.body;

  try {
    const queryOptions = { period1: startDate, period2: endDate };
    
    // Get historical data for all assets
    const assetPromises = assets.map(async (asset) => {
      const historicalData = await yahooFinance.historical(asset.symbol, queryOptions);
      
      // Calculate DCA performance
      const dcaResult = calculateDCAPerformance(
        historicalData,
        startDate,
        endDate,
        initialAmount * (asset.allocation || 1),
        contributionAmount * (asset.allocation || 1),
        contributionFrequency
      );

      return {
        symbol: asset.symbol,
        name: asset.name,
        allocation: asset.allocation || 1,
        ...dcaResult
      };
    });

    // Get benchmark performance
    const benchmarkData = await yahooFinance.historical('SPY', queryOptions);
    const benchmarkDCA = calculateDCAPerformance(
      benchmarkData,
      startDate,
      endDate,
      initialAmount,
      contributionAmount,
      contributionFrequency
    );

    const results = await Promise.all(assetPromises);

    res.json({
      assets: results,
      benchmark: {
        symbol: 'SPY',
        name: 'S&P 500',
        ...benchmarkDCA
      },
      portfolio: calculatePortfolioPerformance(results),
      success: true
    });
  } catch (error) {
    console.error('DCA calculation error:', error);
    res.status(500).json({ message: 'Failed to calculate DCA performance' });
  }
});

// Helper function to calculate DCA performance
function calculateDCAPerformance(historicalData, startDate, endDate, initialAmount, contributionAmount, frequency) {
  if (!historicalData || historicalData.length === 0) {
    return {
      totalInvested: initialAmount,
      finalValue: initialAmount,
      totalShares: 0,
      profitLoss: 0,
      totalReturn: 0,
      annualizedReturn: 0,
      purchases: []
    };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  const years = days / 365.25;

  // Determine contribution interval in days
  const intervalDays = {
    'weekly': 7,
    'biweekly': 14,
    'monthly': 30,
    'quarterly': 90
  }[frequency] || 30;

  let totalShares = 0;
  let totalInvested = initialAmount;
  const purchases = [];

  // Initial investment
  if (initialAmount > 0 && historicalData.length > 0) {
    const initialPrice = historicalData[0].close;
    const initialShares = initialAmount / initialPrice;
    totalShares += initialShares;
    purchases.push({
      date: historicalData[0].date,
      amount: initialAmount,
      price: initialPrice,
      shares: initialShares
    });
  }

  // Regular contributions
  let currentDate = new Date(start);
  let dataIndex = 0;

  while (currentDate <= end && dataIndex < historicalData.length) {
    // Find the closest data point for this date
    while (dataIndex < historicalData.length - 1 && 
           new Date(historicalData[dataIndex].date) < currentDate) {
      dataIndex++;
    }

    if (dataIndex < historicalData.length) {
      const price = historicalData[dataIndex].close;
      const shares = contributionAmount / price;
      
      totalShares += shares;
      totalInvested += contributionAmount;
      
      purchases.push({
        date: historicalData[dataIndex].date,
        amount: contributionAmount,
        price: price,
        shares: shares
      });
    }

    // Move to next contribution date
    currentDate.setDate(currentDate.getDate() + intervalDays);
  }

  // Calculate final value and returns
  const finalPrice = historicalData[historicalData.length - 1].close;
  const finalValue = totalShares * finalPrice;
  const profitLoss = finalValue - totalInvested;
  const totalReturn = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
  const annualizedReturn = totalInvested > 0 && years > 0 ? 
    ((Math.pow(finalValue / totalInvested, 1 / years)) - 1) * 100 : 0;

  return {
    totalInvested,
    finalValue,
    totalShares,
    profitLoss,
    totalReturn,
    annualizedReturn,
    purchases: purchases.slice(-10), // Return last 10 purchases for display
    averageCost: totalInvested / totalShares || 0,
    currentPrice: finalPrice
  };
}

// Helper function to calculate overall portfolio performance
function calculatePortfolioPerformance(assetResults) {
  const totalInvested = assetResults.reduce((sum, asset) => sum + asset.totalInvested, 0);
  const totalValue = assetResults.reduce((sum, asset) => sum + asset.finalValue, 0);
  const profitLoss = totalValue - totalInvested;
  const totalReturn = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  return {
    totalInvested,
    finalValue: totalValue,
    profitLoss,
    totalReturn,
    assets: assetResults.length
  };
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
