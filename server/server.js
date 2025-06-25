import express from 'express';
import yahooFinance from 'yahoo-finance2';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());

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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
