import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Signal } from '../../services/api.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signal-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, FormsModule],
  template: `
    <div class="relative min-h-[400px]">
      @if (isAnalyzing()) {
        <div class="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden rounded border border-tactical-green/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
           <!-- Scanning laser -->
           <div class="absolute top-0 left-0 w-full h-1 bg-tactical-green shadow-[0_0_20px_rgba(34,197,94,1)] animate-scan-laser"></div>
           <!-- Grid background -->
           <div class="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.05)_1px,transparent_1px)] bg-[size:20px_20px] animate-pulse"></div>
           
           <mat-icon class="text-6xl text-tactical-green animate-bounce mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]">radar</mat-icon>
           <h3 class="text-2xl font-black text-white tracking-widest uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] font-mono">Tactical Scanning</h3>
           <p class="text-tactical-green font-mono mt-2 animate-pulse uppercase text-[10px] tracking-[0.3em]">Processing Combat Intel & Market Data...</p>
        </div>
      }

      @if (!isAnalyzing() && signals().length === 0) {
        <div class="flex flex-col items-center justify-center h-full min-h-[400px] border border-dashed border-tactical-green/20 rounded bg-tactical-panel/30">
          <mat-icon class="text-6xl text-zinc-800 mb-4">online_prediction</mat-icon>
          <h3 class="text-xl font-black text-white mb-2 font-mono uppercase tracking-widest">No Active Engagement Signals</h3>
          <p class="text-zinc-600 mb-6 text-center max-w-md font-mono text-[10px] uppercase tracking-wider">Run a deep tactical analysis to generate AI-powered signals based on current market surveillance.</p>
          <button (click)="triggerAnalysis()" class="tactical-btn-primary py-2 px-6 flex items-center gap-2">
             <mat-icon class="text-[20px]">troubleshoot</mat-icon> INITIATE ANALYSIS
          </button>
        </div>
      }

      @if (!isAnalyzing() && signals().length > 0) {
        <div class="mb-6 bg-tactical-panel/40 p-4 rounded border border-tactical-border flex flex-wrap gap-4 items-center justify-between">
          <div class="flex flex-wrap gap-4 items-center w-full md:w-auto">
            <div class="flex items-center gap-2">
              <mat-icon class="text-tactical-green text-sm">filter_list</mat-icon>
              <span class="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Surveillance Filters:</span>
            </div>
            
            <select [ngModel]="filterPair()" (ngModelChange)="filterPair.set($event)" class="bg-zinc-950 text-white text-[9px] font-mono font-black uppercase tracking-widest rounded border border-tactical-border px-3 py-1.5 outline-none hover:border-tactical-green/50 transition-colors">
              <option value="ALL">All Assets</option>
              <option value="BTCUSDT">BTC/USDT</option>
              <option value="ETHUSDT">ETH/USDT</option>
              <option value="SOLUSDT">SOL/USDT</option>
              <option value="BNBUSDT">BNB/USDT</option>
              <option value="ADAUSDT">ADA/USDT</option>
              <option value="XRPUSDT">XRP/USDT</option>
            </select>

            <select [ngModel]="filterType()" (ngModelChange)="filterType.set($event)" class="bg-zinc-950 text-white text-[9px] font-mono font-black uppercase tracking-widest rounded border border-tactical-border px-3 py-1.5 outline-none hover:border-tactical-green/50 transition-colors">
              <option value="ALL">All Strategies</option>
              <option value="LONG">Long (Buy)</option>
              <option value="SHORT">Short (Sell)</option>
            </select>

            <select [ngModel]="filterConfidence()" (ngModelChange)="filterConfidence.set($event)" class="bg-zinc-950 text-white text-[9px] font-mono font-black uppercase tracking-widest rounded border border-tactical-border px-3 py-1.5 outline-none hover:border-tactical-green/50 transition-colors">
              <option value="0">Min Confidence</option>
              <option value="0.5">> 50%</option>
              <option value="0.7">> 70%</option>
              <option value="0.85">> 85%</option>
            </select>
          </div>

          <button (click)="triggerAnalysis()" class="tactical-btn-secondary text-[9px] py-1.5 px-4 flex items-center gap-2">
            <mat-icon class="text-sm h-4 w-4">refresh</mat-icon> REFRESH INTEL
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (signal of filteredSignals(); track signal.pair) {
            <div class="tactical-panel p-6 transition-all duration-500 relative overflow-hidden group hover:-translate-y-1 animate-fade-in-up"
                 style="animation: fadeInUp 0.5s ease-out forwards;"
                 [class.border-tactical-green/30]="signal.type === 'LONG' && signal.confidence > 0.7"
                 [class.border-tactical-red/30]="signal.type === 'SHORT' && signal.confidence > 0.7">
                 
              <!-- Confidence Indicator Bar -->
              <div class="absolute top-0 left-0 w-1 h-full transition-all duration-500 group-hover:w-1.5"
                   [class.bg-tactical-green]="signal.type === 'LONG'"
                   [class.bg-tactical-red]="signal.type === 'SHORT'"
                   [class.shadow-[0_0_10px_rgba(34,197,94,0.5)]]="signal.type === 'LONG'"
                   [class.shadow-[0_0_10px_rgba(239,68,68,0.5)]]="signal.type === 'SHORT'"
                   [style.opacity]="0.3 + (signal.confidence * 0.7)"></div>

              <div class="flex justify-between items-start mb-6 pl-2 relative z-10">
                <div>
                  <h3 class="text-lg font-black text-white font-mono tracking-tighter flex items-center gap-2 group-hover:text-tactical-green transition-colors uppercase">
                    {{ signal.pair }}
                    <mat-icon class="text-[16px]" [class.text-tactical-green]="signal.type === 'LONG'" [class.text-tactical-red]="signal.type === 'SHORT'">
                      {{ signal.type === 'LONG' ? 'arrow_upward' : 'arrow_downward' }}
                    </mat-icon>
                  </h3>
                  <span class="text-[8px] text-zinc-600 font-mono flex items-center gap-1 mt-1 uppercase tracking-widest">
                    <mat-icon class="text-[10px] h-3 w-3">history</mat-icon> {{ signal.timestamp | date:'HH:mm:ss' }} UTC
                  </span>
                </div>
                <div class="px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-500"
                     [class.bg-tactical-green/10]="signal.type === 'LONG'"
                     [class.text-tactical-green]="signal.type === 'LONG'"
                     [class.border-tactical-green/40]="signal.type === 'LONG'"
                     [class.bg-tactical-red/10]="signal.type === 'SHORT'"
                     [class.text-tactical-red]="signal.type === 'SHORT'"
                     [class.border-tactical-red/40]="signal.type === 'SHORT'">
                  {{ signal.type === 'LONG' ? 'BULLISH' : 'BEARISH' }}
                </div>
              </div>
              
              <div class="grid grid-cols-3 gap-2 mb-6 text-[10px] pl-2 relative z-10">
                <div class="bg-zinc-950 p-2 rounded border border-tactical-border group-hover:border-tactical-green/20 transition-colors">
                  <div class="text-zinc-600 text-[7px] font-black uppercase tracking-tighter mb-1">ENTRY</div>
                  <div class="text-white font-mono font-black truncate">
                    {{ signal.entry | number:'1.2-4' }}
                  </div>
                </div>
                <div class="bg-zinc-950 p-2 rounded border border-tactical-border group-hover:border-tactical-green/20 transition-colors">
                  <div class="text-tactical-green/60 text-[7px] font-black uppercase tracking-tighter mb-1">TARGET</div>
                  <div class="text-tactical-green font-mono font-black truncate">
                    {{ signal.tp | number:'1.2-4' }}
                  </div>
                </div>
                <div class="bg-zinc-950 p-2 rounded border border-tactical-border group-hover:border-tactical-green/20 transition-colors">
                  <div class="text-tactical-red/60 text-[7px] font-black uppercase tracking-tighter mb-1">STOP</div>
                  <div class="text-tactical-red font-mono font-black truncate">
                    {{ signal.sl | number:'1.2-4' }}
                  </div>
                </div>
              </div>

              <div class="mb-5 pl-2 relative z-10">
                <div class="flex justify-between items-end mb-2">
                  <span class="uppercase tracking-[0.2em] text-[8px] font-black text-zinc-600 flex items-center gap-1.5">
                    <mat-icon class="text-[12px] h-3 w-3 text-tactical-green">verified</mat-icon> INTEL CONFIDENCE
                  </span>
                  <span class="font-mono text-xl font-black" 
                        [class.text-tactical-green]="signal.confidence > 0.7" 
                        [class.text-tactical-orange]="signal.confidence <= 0.7 && signal.confidence > 0.4" 
                        [class.text-tactical-red]="signal.confidence <= 0.4">
                    {{ (signal.confidence * 100).toFixed(0) }}%
                  </span>
                </div>
                <div class="h-1 bg-zinc-950 rounded-full overflow-hidden border border-tactical-border">
                  <div class="h-full transition-all duration-1000 ease-out" 
                       [class.bg-tactical-green]="signal.confidence > 0.7"
                       [class.bg-tactical-orange]="signal.confidence <= 0.7 && signal.confidence > 0.4"
                       [class.bg-tactical-red]="signal.confidence <= 0.4"
                       [style.width.%]="signal.confidence * 100">
                  </div>
                </div>
              </div>

              <div class="text-[10px] text-zinc-500 border-t border-tactical-border pt-4 mt-2 flex flex-col gap-3 pl-2 relative z-10">
                <div>
                  <div class="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">STRATEGIC REASONING</div>
                  <div class="leading-relaxed font-sans italic line-clamp-3 group-hover:text-zinc-300 transition-colors uppercase text-[9px]">{{ signal.intelligenceReport }}</div>
                </div>

                @if (signal.indicators) {
                  <div class="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-tactical-border/30 pt-3">
                    <div class="flex justify-between items-center">
                      <span class="text-[7px] text-zinc-600 uppercase tracking-widest">RSI</span>
                      <span class="text-[8px] font-mono font-black text-white">{{ signal.indicators.rsi | number:'1.1-1' }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-[7px] text-zinc-600 uppercase tracking-widest">ADX</span>
                      <span class="text-[8px] font-mono font-black text-white">{{ signal.indicators.adx | number:'1.1-1' }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-[7px] text-zinc-600 uppercase tracking-widest">MACD</span>
                      <span class="text-[8px] font-mono font-black text-white">{{ signal.indicators.macd | number:'1.1-2' }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-[7px] text-zinc-600 uppercase tracking-widest">TREND</span>
                      <span class="text-[8px] font-mono font-black" [class.text-tactical-green]="signal.indicators.trend === 'BULLISH'" [class.text-tactical-red]="signal.indicators.trend === 'BEARISH'">{{ signal.indicators.trend }}</span>
                    </div>
                  </div>
                }
                
                <div class="flex items-center justify-between">
                  <div class="text-[7px] font-black text-zinc-700 uppercase tracking-widest">ID: {{ signal.pair }}-{{ signal.timestamp | date:'ss' }}</div>
                  
                  @if (!signal.feedback) {
                    <div class="flex items-center gap-2">
                      <button (click)="submitFeedback(signal, 'positive')" class="p-1 hover:text-tactical-green transition-colors" title="Confirm Intel">
                        <mat-icon class="text-[14px] h-3.5 w-3.5">thumb_up</mat-icon>
                      </button>
                      <button (click)="submitFeedback(signal, 'negative')" class="p-1 hover:text-tactical-red transition-colors" title="Report Error">
                        <mat-icon class="text-[14px] h-3.5 w-3.5">thumb_down</mat-icon>
                      </button>
                    </div>
                  } @else {
                    <div class="text-[8px] font-black flex items-center gap-1 uppercase tracking-widest"
                         [class.text-tactical-green]="signal.feedback === 'positive'"
                         [class.text-tactical-red]="signal.feedback === 'negative'">
                      <mat-icon class="text-[12px] h-3 w-3">verified</mat-icon> LOGGED
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.5s ease-out forwards;
    }
  `]
})
export class SignalCardComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  signals = signal<Signal[]>([]);
  isAnalyzing = signal(false);
  feedbackState: Record<string, 'positive' | 'negative'> = {};
  
  filterPair = signal('ALL');
  filterType = signal('ALL');
  filterConfidence = signal('0');

  filteredSignals = computed(() => {
    const pair = this.filterPair();
    const type = this.filterType();
    const conf = parseFloat(this.filterConfidence());
    
    return this.signals().filter(s => {
      if (pair !== 'ALL' && s.pair !== pair) return false;
      if (type !== 'ALL' && s.type !== type) return false;
      if (s.confidence < conf) return false;
      return true;
    });
  });

  private triggerSub?: Subscription;
  private marketSub?: Subscription;
  private analysisTimeout: ReturnType<typeof setTimeout> | undefined;
  private analysisSub?: Subscription;

  ngOnInit() {
    // Listen for global analysis triggers
    this.triggerSub = this.apiService.analysisTrigger$.subscribe(() => {
      this.runAnalysis();
    });

    // Listen for real-time market data to dynamically recalculate signals
    this.marketSub = this.apiService.marketData$.subscribe(data => {
      this.signals.update(current => {
        return current.map(s => {
          let newEntry = s.entry;
          if (s.pair === 'BTCUSDT' || s.pair === 'BTC/USDT') newEntry = data.btc;
          else if (s.pair === 'ETHUSDT' || s.pair === 'ETH/USDT') newEntry = data.eth;
          else if (s.pair === 'SOLUSDT' || s.pair === 'SOL/USDT') newEntry = data.sol;
          else if (s.pair === 'BNBUSDT' || s.pair === 'BNB/USDT') newEntry = data.bnb;
          else if (s.pair === 'ADAUSDT' || s.pair === 'ADA/USDT') newEntry = data.ada;
          else if (s.pair === 'XRPUSDT' || s.pair === 'XRP/USDT') newEntry = data.xrp;
          
          if (newEntry !== s.entry && newEntry > 0) {
            // Simulate dynamic recalculation of confidence based on price movement
            const diff = (newEntry - s.entry) / s.entry;
            let newConf = s.confidence;
            if (s.type === 'LONG') newConf += diff * 5;
            else if (s.type === 'SHORT') newConf -= diff * 5;
            
            newConf = Math.max(0.1, Math.min(0.99, newConf));
            
            return { ...s, entry: newEntry, confidence: newConf };
          }
          return s;
        });
      });
    });
  }

  ngOnDestroy() {
    this.triggerSub?.unsubscribe();
    this.marketSub?.unsubscribe();
    this.analysisSub?.unsubscribe();
    if (this.analysisTimeout) {
      clearTimeout(this.analysisTimeout);
    }
  }

  triggerAnalysis() {
    this.apiService.triggerAnalysis();
  }

  runAnalysis() {
    if (this.isAnalyzing()) return;
    
    this.isAnalyzing.set(true);
    this.signals.set([]); // Clear current signals
    
    // Simulate deep scanning animation delay
    this.analysisTimeout = setTimeout(() => {
      this.analysisSub = this.apiService.getSignals().subscribe({
        next: (data) => {
          this.signals.set(data);
          this.isAnalyzing.set(false);
          
          // Trigger global flash/sound based on top signal
          if (data.length > 0) {
            this.apiService.analysisComplete$.next({ type: data[0].type });
          }
        },
        error: (err) => {
          console.error('Failed to analyze signals', err);
          this.isAnalyzing.set(false);
        }
      });
    }, 2500); // 2.5 seconds of scanning animation
  }

  refreshSignals() {
    this.runAnalysis();
  }

  getSignalId(signal: Signal): string {
    return signal.id || `${signal.pair}-${signal.timestamp}`;
  }

  submitFeedback(signal: Signal, feedback: 'positive' | 'negative') {
    const signalId = this.getSignalId(signal);
    
    this.apiService.submitSignalFeedback(signalId, feedback).subscribe({
      next: () => {
        // Optimistically update the signal in the list
        this.signals.update(current => 
          current.map(s => 
            this.getSignalId(s) === signalId ? { ...s, feedback } : s
          )
        );
      },
      error: (err) => console.error('Failed to submit feedback', err)
    });
  }
}
