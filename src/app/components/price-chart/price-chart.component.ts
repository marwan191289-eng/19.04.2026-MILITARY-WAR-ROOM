import { Component, inject, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const TradingView: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

@Component({
  selector: 'app-price-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="tactical-panel p-1 h-full flex flex-col relative overflow-hidden group">
      <!-- Background Glow -->
      <div class="absolute top-0 left-0 w-64 h-64 bg-tactical-green/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-tactical-green/10 transition-colors duration-500"></div>

      <div class="flex items-center justify-between px-5 py-4 border-b border-tactical-border mb-1 relative z-10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded border border-tactical-green/30 bg-zinc-950 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            <mat-icon class="text-tactical-green">show_chart</mat-icon>
          </div>
          <div>
            <h3 class="text-white font-black text-lg tracking-tighter uppercase font-mono">Tactical Surveillance</h3>
            <p class="text-[8px] text-zinc-600 font-black uppercase tracking-[0.3em] mt-0.5 font-mono">Real-time engagement data</p>
          </div>
        </div>
        <div class="relative">
          <select 
            [(ngModel)]="selectedPair" 
            (change)="onPairChange()"
            class="bg-zinc-950 text-white text-[10px] font-black tracking-[0.2em] uppercase rounded border border-tactical-border pl-4 pr-10 py-2.5 focus:border-tactical-green/50 outline-none cursor-pointer appearance-none transition-all hover:bg-zinc-900 font-mono"
          >
            @for (pair of pairs; track pair) {
              <option [value]="pair">{{ pair }}</option>
            }
          </select>
          <mat-icon class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none text-sm">expand_more</mat-icon>
        </div>
      </div>
      <div class="w-full flex-1 rounded overflow-hidden min-h-[500px] relative z-10 border border-tactical-border bg-black/40 animate-fade-in-up" style="animation: fadeInUp 0.5s ease-out forwards;">
        <div id="tradingview_widget" class="w-full h-full"></div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class PriceChartComponent implements AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  
  pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ADA/USDT', 'XRP/USDT'];
  selectedPair = 'BTC/USDT';
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private widget: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTradingViewScript();
    }
  }

  loadTradingViewScript() {
    if (typeof TradingView !== 'undefined') {
      this.initWidget();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => this.initWidget();
    document.head.appendChild(script);
  }

  onPairChange() {
    if (isPlatformBrowser(this.platformId)) {
      // Clear the container first to be safe, though the widget might handle it
      const container = document.getElementById('tradingview_widget');
      if (container) container.innerHTML = '';
      this.initWidget();
    }
  }

  initWidget() {
    if (typeof TradingView === 'undefined') return;

    const symbol = `BINANCE:${this.selectedPair.replace('/', '')}`;

    this.widget = new TradingView.widget({
      "width": "100%",
      "height": "100%",
      "symbol": symbol,
      "interval": "60",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "withdateranges": true,
      "hide_side_toolbar": false,
      "allow_symbol_change": true,
      "container_id": "tradingview_widget",
      "details": true,
      "calendar": true,
      "studies": [
        "RSI@tv-basicstudies",
        "MACD@tv-basicstudies",
        "AutoFibRetracement@tv-basicstudies"
      ]
    });
  }
}
