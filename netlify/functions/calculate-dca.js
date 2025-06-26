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
  
  return {
    status: 500,
    message: 'Yahoo Finance API is experiencing issues. Please try again later.',
    type: 'api_error'
  };
};

// Add delay function to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Invalid JSON in request body' })
    };
  }

  const { 
    assets, 
    startDate, 
    endDate, 
    initialAmount = 0,
    contributionAmount,
    contributionFrequency = 'monthly' 
  } = requestBody;

  if (!assets || !Array.isArray(assets) || assets.length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Assets array is required and must not be empty' })
    };
  }

  if (!startDate || !endDate || !contributionAmount) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'startDate, endDate, and contributionAmount are required' })
    };
  }

  const cacheKey = getCacheKey('calculate-dca', { assets, startDate, endDate, initialAmount, contributionAmount, contributionFrequency });

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
    const queryOptions = { period1: startDate, period2: endDate };
    
    // Get historical data for all assets
    const assetPromises = assets.map(async (asset) => {
      await delay(100); // Small delay between requests
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

    const response = {
      assets: results,
      benchmark: {
        symbol: 'SPY',
        name: 'S&P 500',
        ...benchmarkDCA
      },
      portfolio: calculatePortfolioPerformance(results),
      success: true
    };

    // Cache successful response
    setCache(cacheKey, response);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    const errorResponse = handleYahooError(error, 'DCA calculation');
    return {
      statusCode: errorResponse.status,
      headers,
      body: JSON.stringify({
        message: errorResponse.message,
        type: errorResponse.type
      })
    };
  }
}; 