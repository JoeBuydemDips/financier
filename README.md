# 📈 Financier

> Investment Analysis Platform

Financier is an investment analysis platform designed to help anyone regardless of experience see what they could have achieved by investing, and to demystify the process of building wealth. Built with Netlify Functions for scalable, serverless backend operations and powered by real-time stock data, historical performance validation, and clear risk analytics, Financier empowers users to discover that investing doesn't have to be complicated or intimidating. Whether you're curious about "what if I had invested in Apple five years ago?" or want to compare strategies, Financier makes it easy to learn from the past and make confident decisions for the future.

[check it out here](https://krasgnik-financier.netlify.app)

## ✨ Features

### 🎯 Investment Calculator

- **Dollar Cost Averaging (DCA) Analysis**: Calculate returns for systematic investment strategies
- **Flexible Investment Frequencies**: Daily, weekly, or monthly contributions
- **Custom Date Ranges**: Analyze performance across any time period
- **Real-time Stock Data**: Live price feeds and market information

### 📊 Comprehensive Analysis

- **Investment Performance Tracking**: Monitor portfolio value vs. contributions over time
- **Benchmark Comparison**: Compare performance against S&P 500 index
- **Interactive Charts**: Area and line charts with customizable data series
- **Key Metrics Dashboard**: Total invested, portfolio value, profit/loss, and annualized returns

### 🏢 Stock Details & Fundamentals

- **Real-time Pricing**: Current stock price with 52-week range visualization
- **Financial Metrics**: P/E ratio, market cap, dividend yield, volume, and more
- **Company Overview**: Detailed financial and trading information
- **Market Data**: Beta, profit margins, and other key indicators

### ⚠️ Risk Analysis & Management

- **Risk Assessment**: Overall risk level based on volatility metrics
- **Detailed Risk Metrics**: Volatility, maximum drawdown, Sharpe ratio, and beta
- **Risk Management Recommendations**: Personalized suggestions for diversification, position sizing, and market timing
- **Visual Risk Indicators**: Color-coded risk levels and explanatory tooltips

### 🎨 Modern User Experience

- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Smooth Animations**: Powered by Framer Motion for enhanced user interactions
- **Professional UI**: Clean, modern interface with dark theme
- **Consistent Navigation**: Investment calculator available across all analysis pages

## 🖼️ Screenshots

### Investment Overview Dashboard

![Investment Overview](docs/screenshots/overview-dashboard.png)
_Main dashboard showing investment results, performance charts, and DCA analysis_

### Investment Comparison & Portfolio Analysis

![Investment Comparison](docs/screenshots/investment-comparison.png)
_Multi-asset portfolio comparison with DCA strategy analysis and performance visualization_

### Stock Details & Fundamentals

![Stock Details](docs/screenshots/stock-details.png)
_Comprehensive stock information including financial metrics and company overview_

### Risk Analysis & Assessment

![Risk Analysis](docs/screenshots/risk-analysis.png)
_Professional risk assessment with detailed metrics and management recommendations_

## 🛠️ Technology Stack

### Frontend

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Framer Motion** - Smooth animations and interactions
- **Recharts** - Interactive data visualizations
- **Lucide React** - Beautiful icon library

### Backend

- **Netlify Functions** - Serverless functions for API endpoints
- **Yahoo Finance API** - Real-time financial data
- **Built-in CORS** - Seamless cross-origin resource sharing

### Development Tools

- **Netlify CLI** - Local development and deployment
- **ESLint** - Code linting and formatting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **Vite HMR** - Hot module replacement for development

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Netlify CLI (installed globally): `npm install -g netlify-cli`

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/JoeBuydemDips/financier.git
   cd financier
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server with Netlify Functions**

   ```bash
   netlify dev
   ```

   The application will be available at `http://localhost:8888`

   This single command starts both the frontend and serverless backend functions.

### Building for Production

```bash
npm run build
```

The built application will be in the `dist/` directory.

### Deployment to Netlify

#### Option 1: Git-based Deployment (Recommended)

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Netlify automatically detects `netlify.toml` and deploys both frontend and functions

#### Option 2: Manual Deployment

```bash
# Build and deploy directly
npm run build
netlify deploy --prod
```

## 📱 Usage

1. **Enter a Stock Symbol**: Use the ticker input in the Investment Calculator (e.g., AAPL, SPY, TSLA)
2. **Configure Investment Parameters**: Set contribution amount, frequency, and date range
3. **Calculate Returns**: Click "Calculate Returns" to run the analysis
4. **Explore Analysis**: Navigate between tabs to view different aspects:
   - **Overview**: Investment results and performance charts
   - **Investment Comparison**: Compare multiple investment strategies
   - **Stock Details**: Fundamental analysis and company information
   - **Risk Analysis**: Risk metrics and management recommendations

## 🌟 Key Highlights

- **Serverless Architecture**: Built with Netlify Functions for automatic scaling and global performance
- **Professional-Grade Analysis**: Sophisticated financial calculations and risk metrics
- **Real-Time Data**: Live stock prices and market information
- **Zero Server Maintenance**: Fully serverless backend with automatic updates and scaling
- **Responsive Design**: Seamless experience across all devices
- **Educational Tooltips**: Learn about financial concepts while using the platform
- **Consistent UX**: Investment calculator available on every page for easy parameter adjustment

## 🔧 Development

### Project Structure

```
financier/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── pages/          # Page-specific components
│   │   ├── NavigationTabs.tsx
│   │   └── ...
│   ├── App.tsx             # Main application component
│   ├── App.css             # Global styles and design system
│   └── main.tsx            # Application entry point
├── netlify/
│   └── functions/          # Serverless API functions
│       ├── stock.js        # Stock data endpoint
│       ├── history.js      # Historical data endpoint
│       ├── search.js       # Stock search endpoint
│       └── calculate-dca.js # DCA calculation endpoint
├── server/
│   └── server.js           # Legacy Express server (replaced by functions)
├── docs/
│   └── screenshots/        # Application screenshots
├── netlify.toml            # Netlify configuration
└── public/                 # Static assets
```

### API Endpoints

When running locally with `netlify dev`, the following API endpoints are available:

- `GET /.netlify/functions/stock/{ticker}` - Get stock information
- `GET /.netlify/functions/history/{ticker}?startDate={date}&endDate={date}` - Get historical data
- `GET /.netlify/functions/search/{query}` - Search for stocks
- `POST /.netlify/functions/calculate-dca` - Calculate DCA performance

## 📄 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This tool is for educational and informational purposes only. It is not intended as financial advice. Please consult a qualified financial advisor before making investment decisions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with cursor and claude code**
