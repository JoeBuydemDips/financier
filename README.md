# 📈 Financier

> Investment Analysis Platform

Financier is an investment analysis platform designed to help anyone regardless of experience see what they could have achieved by investing, and to demystify the process of building wealth. With real-time stock data, historical performance validation, and clear risk analytics, Financier empowers users to discover that investing doesn't have to be complicated or intimidating. Whether you're curious about "what if I had invested in Apple five years ago?" or want to compare strategies, Financier makes it easy to learn from the past and make confident decisions for the future.

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

- **Node.js** - Server runtime
- **Express** - Web application framework
- **Yahoo Finance API** - Real-time financial data
- **CORS** - Cross-origin resource sharing

### Development Tools

- **ESLint** - Code linting and formatting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **Vite HMR** - Hot module replacement for development

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

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

3. **Start the backend server**

   ```bash
   node server/server.js
   ```

   The API server will run on `http://localhost:3001`

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built application will be in the `dist/` directory.

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

- **Professional-Grade Analysis**: Sophisticated financial calculations and risk metrics
- **Real-Time Data**: Live stock prices and market information
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
├── server/
│   └── server.js           # Express API server
├── docs/
│   └── screenshots/        # Application screenshots
└── public/                 # Static assets
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 📄 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This tool is for educational and informational purposes only. It is not intended as financial advice. Please consult a qualified financial advisor before making investment decisions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with cursor and claude code**
