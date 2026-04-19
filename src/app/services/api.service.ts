import { Injectable, NgZone, PLATFORM_ID, inject, makeStateKey, TransferState, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of, tap, from, map, catchError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { GoogleGenAI } from "@google/genai";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const process: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface MarketData {
  timestamp: string;
  btc: number;
  eth: number;
  sol: number;
  bnb: number;
  ada: number;
  xrp: number;
}

export interface Signal {
  pair: string;
  type: 'LONG' | 'SHORT' | 'NEUTRAL';
  entry: number;
  tp: number;
  sl: number;
  confidence: number;
  timestamp: string;
  intelligenceReport: string;
  id?: string;
  feedback?: 'positive' | 'negative';
  indicators?: {
    rsi: number;
    adx: number | undefined;
    macd: number | undefined;
    trend: string;
  };
}

export interface Intelligence {
  id: number;
  type: string;
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  sentiment: string;
  description: string;
}

export interface CombatLogEntry extends Signal {
  status: 'ACTIVE' | 'COMPLETED';
  pnl: string;
}

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Alert {
  id: number;
  pair: string;
  condition: string;
  active: boolean;
  type?: 'LONG' | 'SHORT' | 'INFO';
  notifyEmail?: boolean;
  notifyInApp?: boolean;
}

export interface ChatResponse {
  text: string;
  groundingMetadata?: unknown;
}

export interface SentimentResponse {
  score: number;
  label: string;
  summary: string;
  narratives: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService implements OnDestroy {
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);
  private transferState = inject(TransferState);

  private marketDataSubject = new Subject<MarketData>();
  marketData$ = this.marketDataSubject.asObservable();
  private baseUrl = '';
  private ai: GoogleGenAI;
  private ws?: WebSocket;

  // Analysis triggers
  analysisTrigger$ = new Subject<void>();
  analysisComplete$ = new Subject<{type: 'LONG'|'SHORT'|'NEUTRAL'}>();
  
  // Alert triggers
  alertTriggered$ = new Subject<{type: 'LONG'|'SHORT'|'INFO', message: string}>();

  triggerAnalysis() {
    this.analysisTrigger$.next();
  }
  
  triggerAlert(alert: Alert) {
    this.alertTriggered$.next({ type: alert.type || 'INFO', message: `${alert.pair}: ${alert.condition}` });
  }

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      // Server-side: Always use localhost to ensure we hit the local server instance
      // and avoid network issues or public URL routing problems during SSR.
      const port = process.env['PORT'] || 3000;
      this.baseUrl = `http://localhost:${port}`;
    }
    this.connectMarketStream();

    // Initialize Gemini AI
    // Try multiple sources for the API key: localStorage > TransferState > Environment
    const GEMINI_KEY = makeStateKey<string>('GEMINI_API_KEY');
    let apiKey = '';

    if (isPlatformBrowser(this.platformId)) {
      // Client-side
      const localKey = localStorage.getItem('gemini_api_key');
      const transferKey = this.transferState.get(GEMINI_KEY, '');
      
      // Fallback to import.meta.env if available (Vite)
      let envKey = '';
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        envKey = (import.meta as any).env?.['GEMINI_API_KEY'] || (import.meta as any).env?.['API_KEY'];
      } catch { /* ignore */ }

      apiKey = localKey || transferKey || envKey || '';
    } else {
      // Server-side
      try {
        if (typeof process !== 'undefined' && process.env) {
          apiKey = process.env['GEMINI_API_KEY'] || process.env['API_KEY'] || '';
        }
      } catch { /* ignore */ }
      
      this.transferState.set(GEMINI_KEY, apiKey);
    }
                   
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  private apiKey = '';

  ngOnDestroy() {
    if (this.ws) {
      this.ws.close();
    }
  }

  setApiKey(key: string) {
    this.apiKey = key;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('gemini_api_key', key);
    }
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  getApiKey(): string {
    return this.apiKey;
  }

  connectMarketStream() {
    if (isPlatformBrowser(this.platformId)) {
      // Connect to Binance WebSocket for real-time data
      const streams = [
        'btcusdt@miniTicker',
        'ethusdt@miniTicker',
        'solusdt@miniTicker',
        'bnbusdt@miniTicker',
        'adausdt@miniTicker',
        'xrpusdt@miniTicker'
      ].join('/');
      
      this.ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      
      const currentData: MarketData = {
        timestamp: new Date().toISOString(),
        btc: 0,
        eth: 0,
        sol: 0,
        bnb: 0,
        ada: 0,
        xrp: 0
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        // message.data contains the ticker payload
        // { e: '24hrMiniTicker', E: 123456789, s: 'BTCUSDT', c: '45000.00', ... }
        
        if (message.data) {
          const ticker = message.data;
          const price = parseFloat(ticker.c);
          
          if (ticker.s === 'BTCUSDT') currentData.btc = price;
          if (ticker.s === 'ETHUSDT') currentData.eth = price;
          if (ticker.s === 'SOLUSDT') currentData.sol = price;
          if (ticker.s === 'BNBUSDT') currentData.bnb = price;
          if (ticker.s === 'ADAUSDT') currentData.ada = price;
          if (ticker.s === 'XRPUSDT') currentData.xrp = price;
          
          currentData.timestamp = new Date().toISOString();

          this.ngZone.run(() => {
            this.marketDataSubject.next({ ...currentData });
          });
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket failed:', error);
      };
      
      // Reconnect logic could be added here
    }
  }

  getSignals(): Observable<Signal[]> {
    const key = makeStateKey<Signal[]>('SIGNALS');
    if (this.transferState.hasKey(key)) {
      const stored = this.transferState.get(key, []);
      this.transferState.remove(key);
      return of(stored);
    }

    return this.http.get<Signal[]>(`${this.baseUrl}/api/signals`).pipe(
      tap(data => {
        if (!isPlatformBrowser(this.platformId)) {
          this.transferState.set(key, data);
        }
      })
    );
  }

  getHistoricalData(pair = 'BTC/USDT'): Observable<OHLCV[]> {
    const key = makeStateKey<OHLCV[]>(`HISTORICAL_${pair}`);
    if (this.transferState.hasKey(key)) {
      const stored = this.transferState.get(key, []);
      this.transferState.remove(key);
      return of(stored);
    }

    return this.http.get<OHLCV[]>(`${this.baseUrl}/api/historical-data?pair=${pair}`).pipe(
      tap(data => {
        if (!isPlatformBrowser(this.platformId)) {
          this.transferState.set(key, data);
        }
      })
    );
  }

  getAlerts(): Observable<Alert[]> {
    const key = makeStateKey<Alert[]>('ALERTS');
    if (this.transferState.hasKey(key)) {
      const stored = this.transferState.get(key, []);
      this.transferState.remove(key);
      return of(stored);
    }

    return this.http.get<Alert[]>(`${this.baseUrl}/api/alerts`).pipe(
      tap(data => {
        if (!isPlatformBrowser(this.platformId)) {
          this.transferState.set(key, data);
        }
      })
    );
  }

  addAlert(alert: Partial<Alert>): Observable<Alert> {
    return this.http.post<Alert>(`${this.baseUrl}/api/alerts`, alert);
  }

  deleteAlert(id: number): Observable<unknown> {
    return this.http.delete<unknown>(`${this.baseUrl}/api/alerts/${id}`);
  }

  getSettings(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/api/settings`);
  }

  getIntelligence(): Observable<Intelligence[]> {
    return this.http.get<Intelligence[]>(`${this.baseUrl}/api/intelligence`);
  }

  getCombatLog(): Observable<CombatLogEntry[]> {
    return this.http.get<CombatLogEntry[]>(`${this.baseUrl}/api/combat-log`);
  }

  updateSettings(settings: unknown): Observable<unknown> {
    return this.http.post<unknown>(`${this.baseUrl}/api/settings`, settings);
  }

  submitSignalFeedback(signalId: string, feedback: 'positive' | 'negative'): Observable<unknown> {
    return this.http.post<unknown>(`${this.baseUrl}/api/signals/feedback`, { signalId, feedback });
  }

  hasValidKey(): boolean {
    return this.isValidApiKey(this.apiKey);
  }

  private isValidApiKey(key: string): boolean {
    return !!key && key.length > 20 && key.startsWith('AIza');
  }

  getChatResponse(message: string, history: { role: string; text: string }[]): Observable<ChatResponse> {
    if (!this.isValidApiKey(this.apiKey)) {
      return of({
        text: "Please set a valid Gemini API Key (starting with 'AIza') in Settings to use the AI Chat feature."
      });
    }

    // Use Gemini SDK directly
    const contents = history ? history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    })) : [];
    
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    return from(this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are an expert crypto analyst assistant. Use Google Search to provide real-time data on prices, news, and market trends. Be concise and professional."
      }
    })).pipe(
      map(response => ({
        text: response.text || "I couldn't generate a response.",
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      })),
      catchError(err => {
        // Only log if it's not a known API key error (which we try to catch upfront, but just in case)
        if (!err.message?.includes('API key not valid')) {
          console.error('Chat SDK error:', err);
        }
        throw err;
      })
    );
  }

  getSentiment(): Observable<SentimentResponse> {
    if (!this.apiKey) {
      console.info('Gemini API Key not set. Using fallback sentiment data (Demo Mode).');
      return of({
          score: 50,
          label: "Neutral",
          summary: "Market sentiment analysis requires a valid Gemini API Key. Please configure it in Settings.",
          narratives: ["Waiting for API Key", "Configuration Required", "System Standby"]
      });
    }

    if (!this.isValidApiKey(this.apiKey)) {
      console.warn('Gemini API Key is invalid (must start with AIza). Using fallback sentiment data.');
      return of({
          score: 50,
          label: "Neutral",
          summary: "The provided Gemini API Key is invalid. Please check your settings.",
          narratives: ["Invalid API Key", "Configuration Error", "System Standby"]
      });
    }

    // Use Gemini SDK directly
    return from(this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [{ text: "Analyze the current crypto market sentiment based on the latest news from the last 24 hours. Provide a 'Fear & Greed' score from 0-100 and a brief summary of the top 3 market-moving narratives." }]
      }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            score: { type: "NUMBER" },
            label: { type: "STRING" },
            summary: { type: "STRING" },
            narratives: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          }
        }
      }
    })).pipe(
      map(response => {
        try {
          return JSON.parse(response.text || '{}') as SentimentResponse;
        } catch (e) {
          console.error('Failed to parse sentiment JSON:', e);
          throw e;
        }
      }),
      catchError(err => {
        // Suppress the specific API key error log since we are handling it with fallback
        if (!err.message?.includes('API key not valid')) {
           console.error('Sentiment SDK error:', err);
        }
        
        // Return fallback data on error
        return of({
          score: 65,
          label: "Greed",
          summary: "Market is showing resilience despite regulatory news (Fallback Data).",
          narratives: ["Bitcoin ETF inflows", "Solana ecosystem growth", "Regulatory clarity in Asia"]
        });
      })
    );
  }
}
