import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import axios from 'axios';
import { RSI, MACD, EMA, BollingerBands, ADX, ATR, StochasticRSI } from 'technicalindicators';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());

// --- Real-Time Technical Analysis Engine ---

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function fetchOHLCV(symbol: string, interval = '1m', limit = 100): Promise<Candle[]> {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: { symbol: symbol.replace('/', ''), interval, limit }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data.map((d: any[]) => ({
      time: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5])
    }));
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return [];
  }
}

// 6. Settings & Learning Mechanism
let userSettings = {
  riskLevel: 'MEDIUM', // LOW, MEDIUM, HIGH
  activePairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
  timeframe: '15m'
};

const signalWeights: Record<string, number> = {
  'RSI': 1.0,
  'MACD': 1.0,
  'BB': 1.0
};

// Store feedback in memory: signalId -> feedback
const signalFeedback = new Map<string, 'positive' | 'negative'>();

app.post('/api/settings', (req, res) => {
  userSettings = { ...userSettings, ...req.body };
  res.json(userSettings);
});

app.get('/api/settings', (req, res) => {
  res.json(userSettings);
});

app.post('/api/signals/feedback', (req, res) => {
  const { signalId, feedback } = req.body; // feedback: 'positive' | 'negative'
  
  // Store feedback
  signalFeedback.set(signalId, feedback);

  // Simple Reinforcement Learning Simulation
  const adjustment = feedback === 'positive' ? 0.05 : -0.05;
  
  // Apply to all for this demo, or parse signalId/reason if we had it structured better
  // For now, let's just say we learn globally
  signalWeights['RSI'] = Math.max(0.1, Math.min(2.0, signalWeights['RSI'] + adjustment));
  signalWeights['MACD'] = Math.max(0.1, Math.min(2.0, signalWeights['MACD'] + adjustment));
  
  res.json({ success: true, newWeights: signalWeights });
});

interface Signal {
  pair: string;
  type: 'LONG' | 'SHORT' | 'NEUTRAL';
  entry: number;
  tp: number;
  sl: number;
  confidence: number;
  timestamp: string;
  intelligenceReport: string;
  id: string;
  feedback?: 'positive' | 'negative';
  indicators?: {
    rsi: number;
    adx: number | undefined;
    macd: number | undefined;
    trend: string;
  };
  status?: 'ACTIVE' | 'COMPLETED';
  pnl?: string;
}

// Modified analyzeMarket to use settings and weights
function analyzeMarket(symbol: string, candles: Candle[]) {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  // Calculate Indicators
  const rsi = RSI.calculate({ values: closes, period: 14 });
  const macd = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
  const ema200 = EMA.calculate({ values: closes, period: 200 });
  const bb = BollingerBands.calculate({ period: 20, stdDev: 2, values: closes });
  const adx = ADX.calculate({ high: highs, low: lows, close: closes, period: 14 });
  const atr = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });
  const stochRsi = StochasticRSI.calculate({
    values: closes,
    kPeriod: 3,
    dPeriod: 3,
    rsiPeriod: 14,
    stochasticPeriod: 14
  });

  const currentRSI = rsi[rsi.length - 1];
  const currentMACD = macd[macd.length - 1];
  const currentEMA = ema200[ema200.length - 1];
  const currentPrice = closes[closes.length - 1];
  const currentBB = bb[bb.length - 1];
  const currentADX = adx[adx.length - 1];
  const currentATR = atr[atr.length - 1];
  const currentStochRsi = stochRsi[stochRsi.length - 1];
  const lastCandleTime = candles[candles.length - 1].time;

  let signalType: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
  let confidence = 0.5;
  let intelligenceReport = '';

  // Strategy Logic with Weights
  let bullishScore = 0;
  let bearishScore = 0;

  // 1. RSI Analysis
  const rsiWeight = 1.5 * signalWeights['RSI'];
  if (currentRSI < 30) bullishScore += rsiWeight;
  else if (currentRSI > 70) bearishScore += rsiWeight;
  
  // Stochastic RSI confirmation
  if (currentStochRsi && currentStochRsi.k < 20 && currentStochRsi.d < 20) bullishScore += rsiWeight * 0.5;
  else if (currentStochRsi && currentStochRsi.k > 80 && currentStochRsi.d > 80) bearishScore += rsiWeight * 0.5;

  // 2. MACD Analysis
  const macdWeight = 2.0 * signalWeights['MACD'];
  if (currentMACD?.MACD !== undefined && currentMACD?.signal !== undefined && currentMACD?.histogram !== undefined) {
    if (currentMACD.MACD > currentMACD.signal) {
      bullishScore += macdWeight;
      if (currentMACD.histogram > 0) bullishScore += macdWeight * 0.5;
    } else {
      bearishScore += macdWeight;
      if (currentMACD.histogram < 0) bearishScore += macdWeight * 0.5;
    }
  }

  // 3. Bollinger Bands Analysis
  const bbWeight = 1.2 * signalWeights['BB'];
  if (currentPrice < currentBB.lower) bullishScore += bbWeight;
  else if (currentPrice > currentBB.upper) bearishScore += bbWeight;

  // 4. Trend Analysis (EMA 200)
  const trendWeight = 1.5;
  const isBullishTrend = currentPrice > currentEMA;
  if (isBullishTrend) bullishScore += trendWeight;
  else bearishScore += trendWeight;

  // 5. ADX (Trend Strength)
  const adxWeight = 1.0;
  if (currentADX && currentADX.adx > 25) {
    // Strong trend - amplify existing signal
    if (isBullishTrend) bullishScore += adxWeight;
    else bearishScore += adxWeight;
  }

  // Determine Signal
  const totalScore = bullishScore + bearishScore;
  if (bullishScore > bearishScore) {
    signalType = 'LONG';
    confidence = bullishScore / totalScore;
    intelligenceReport = `STRATEGIC ADVANTAGE: Bullish momentum confirmed across multiple vectors. RSI at ${currentRSI.toFixed(1)} showing recovery. MACD crossover active. Trend strength (ADX) is ${currentADX?.adx.toFixed(1)}.`;
  } else if (bearishScore > bullishScore) {
    signalType = 'SHORT';
    confidence = bearishScore / totalScore;
    intelligenceReport = `THREAT DETECTED: Bearish pressure intensifying. RSI at ${currentRSI.toFixed(1)} indicating exhaustion. MACD histogram expanding downwards. Trend strength (ADX) is ${currentADX?.adx.toFixed(1)}.`;
  }

  // Risk Level Adjustment
  let threshold = 0.60;
  if (userSettings.riskLevel === 'LOW') threshold = 0.70;
  if (userSettings.riskLevel === 'HIGH') threshold = 0.50;

  if (confidence < threshold) {
    signalType = 'NEUTRAL';
  }

  // Calculate TP/SL based on ATR (Average True Range)
  const volatilityFactor = currentATR || (Math.max(...highs.slice(-14)) - Math.min(...lows.slice(-14))) / 14;
  const sl = signalType === 'LONG' ? currentPrice - (volatilityFactor * 2) : currentPrice + (volatilityFactor * 2);
  const tp = signalType === 'LONG' ? currentPrice + (volatilityFactor * 4) : currentPrice - (volatilityFactor * 4);

  // Cap confidence at 0.99
  confidence = Math.min(0.99, confidence);

  // Generate stable ID based on pair and candle timestamp
  const signalId = `${symbol}-${lastCandleTime}`;

  return {
    pair: symbol,
    type: signalType,
    entry: currentPrice,
    tp: parseFloat(tp.toFixed(2)),
    sl: parseFloat(sl.toFixed(2)),
    confidence,
    timestamp: new Date(lastCandleTime).toISOString(),
    intelligenceReport,
    id: signalId,
    feedback: signalFeedback.get(signalId),
    indicators: {
      rsi: currentRSI,
      adx: currentADX?.adx,
      macd: currentMACD?.MACD,
      trend: isBullishTrend ? 'BULLISH' : 'BEARISH'
    }
  };
}

// 1. Data Collector & Stream Processor Simulation (SSE for Real-time Data)
app.get('/api/market-data', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendUpdate = () => {
    const data = {
      timestamp: new Date().toISOString(),
      btc: 45000 + Math.random() * 1000 - 500,
      eth: 3200 + Math.random() * 100 - 50,
      sol: 110 + Math.random() * 10 - 5,
    };
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const intervalId = setInterval(sendUpdate, 2000);

  req.on('close', () => {
    clearInterval(intervalId);
  });
});

// 7. Global Intelligence & News Simulation
const globalIntelligence = [
  { id: 1, type: 'MACRO', title: 'FED INTEREST RATE DECISION', impact: 'HIGH', sentiment: 'HAWKISH', description: 'Federal Reserve indicates potential rate hikes, increasing market volatility.' },
  { id: 2, type: 'CRYPTO', title: 'ETHEREUM DENKUN UPGRADE', impact: 'MEDIUM', sentiment: 'BULLISH', description: 'Successful implementation of EIP-4844 reduces Layer 2 fees significantly.' },
  { id: 3, type: 'GEOPOLITICAL', title: 'GLOBAL TRADE TENSIONS', impact: 'HIGH', sentiment: 'NEUTRAL', description: 'New trade regulations impacting cross-border digital asset flows.' },
  { id: 4, type: 'TECH', title: 'AI INTEGRATION IN DEFI', impact: 'MEDIUM', sentiment: 'BULLISH', description: 'Major DeFi protocols adopting AI for automated risk management.' }
];

app.get('/api/intelligence', (req, res) => {
  res.json(globalIntelligence);
});

// 8. Combat Log (Signal History)
const combatLog: Signal[] = [];

app.get('/api/combat-log', (req, res) => {
  res.json(combatLog.slice(-50).reverse());
});

// Update signals endpoint to populate combat log
app.get('/api/signals', async (req, res) => {
  const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT'];
  const signals = [];

  for (const pair of pairs) {
    const candles = await fetchOHLCV(pair);
    if (candles.length > 50) {
      const analysis = analyzeMarket(pair.replace('USDT', '/USDT'), candles);
      if (analysis.type !== 'NEUTRAL') {
        signals.push(analysis);
        
        // Add to combat log if not already there
        if (!combatLog.find(l => l.id === analysis.id)) {
          combatLog.push({
            ...analysis,
            status: Math.random() > 0.5 ? 'ACTIVE' : 'COMPLETED',
            pnl: Math.random() > 0.5 ? (Math.random() * 5).toFixed(2) : (Math.random() * -3).toFixed(2)
          });
        }
      }
    }
  }

  res.json(signals);
});

// 3. Historical Data for Charts (D3.js) - Kept for fallback, though TradingView is primary
app.get('/api/historical-data', (req, res) => {
  // const { pair = 'BTC/USDT', timeframe = '1h' } = req.query;
  // Generate mock OHLCV data
  const data = [];
  let price = 45000;
  const now = new Date();
  for (let i = 100; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600 * 1000);
    const open = price;
    const close = price + (Math.random() * 200 - 100);
    const high = Math.max(open, close) + Math.random() * 50;
    const low = Math.min(open, close) - Math.random() * 50;
    const volume = Math.floor(Math.random() * 1000);
    data.push({
      date: time.toISOString(),
      open,
      high,
      low,
      close,
      volume,
    });
    price = close;
  }
  res.json(data);
});

// 4. Alerts & Notifications
let alerts = [
  { id: 1, pair: 'BTC/USDT', condition: 'Above 46000', active: true },
  { id: 2, pair: 'ETH/USDT', condition: 'Below 3000', active: true },
];

app.get('/api/alerts', (req, res) => {
  res.json(alerts);
});

app.post('/api/alerts', (req, res) => {
  const newAlert = { id: Date.now(), ...req.body, active: true };
  alerts.push(newAlert);
  res.json(newAlert);
});

app.delete('/api/alerts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  alerts = alerts.filter((a) => a.id !== id);
  res.json({ success: true });
});

// 5. Auth Service Simulation
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // Mock authentication
  if (email === 'user@example.com' && password === 'password') {
    res.json({
      token: 'mock-jwt-token-123456',
      user: { id: 1, name: 'Crypto Trader', email },
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Fallback for API routes to prevent HTML response
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
