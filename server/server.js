import express from 'express';
import yahooFinance from 'yahoo-finance2';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Get comprehensive stock data
app.get('/stock/:ticker', async (req, res) => {
  const { ticker } = req.params;

  try {
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

    res.json(stockInfo);
  } catch (error) {
    console.error('Stock info error:', error);
    res.status(500).json({ message: 'Failed to fetch stock information' });
  }
});

// Get historical data with benchmark comparison
app.get('/history/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const queryOptions = { period1: startDate, period2: endDate };
    
    // Fetch both the target stock and S&P 500 for comparison
    const [stockData, spyData] = await Promise.all([
      yahooFinance.historical(ticker, queryOptions),
      yahooFinance.historical('SPY', queryOptions)
    ]);

    res.json({
      stock: stockData,
      benchmark: spyData
    });
  } catch (error) {
    console.error('Historical data error:', error);
    res.status(500).json({ message: 'Failed to fetch historical data' });
  }
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
