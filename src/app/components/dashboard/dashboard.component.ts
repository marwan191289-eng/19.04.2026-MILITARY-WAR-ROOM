import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketTickerComponent } from '../market-ticker/market-ticker.component';
import { SignalCardComponent } from '../signal-card/signal-card.component';
import { PriceChartComponent } from '../price-chart/price-chart.component';
import { AlertsComponent } from '../alerts/alerts.component';
import { SettingsComponent } from '../settings/settings.component';
import { ChatbotComponent } from '../chatbot/chatbot.component';
import { SentimentComponent } from '../sentiment/sentiment.component';
import { PortfolioComponent } from '../portfolio/portfolio.component';
import { IntelligenceComponent } from '../intelligence/intelligence.component';
import { CombatLogComponent } from '../combat-log/combat-log.component';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MarketTickerComponent,
    SignalCardComponent,
    PriceChartComponent,
    AlertsComponent,
    SettingsComponent,
    ChatbotComponent,
    SentimentComponent,
    PortfolioComponent,
    IntelligenceComponent,
    CombatLogComponent,
    MatIconModule
  ],
  template: `
    <div class="flex h-screen bg-tactical-bg text-zinc-300 overflow-hidden font-sans relative">
      <!-- Tactical Grid Overlay -->
      <div class="absolute inset-0 pointer-events-none z-0 opacity-10" 
           style="background-image: linear-gradient(var(--color-tactical-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-tactical-border) 1px, transparent 1px); background-size: 80px 80px;"></div>
      
      <!-- Sidebar Overlay for Mobile -->
      @if (mobileMenuOpen) {
        <div class="fixed inset-0 bg-black/95 z-40 md:hidden backdrop-blur-md" 
             (click)="mobileMenuOpen = false"
             (keydown.escape)="mobileMenuOpen = false"
             tabindex="0"
             role="button"
             aria-label="Close Mobile Menu"></div>
      }

      <!-- Sidebar -->
      <aside class="w-72 bg-tactical-panel border-r border-tactical-border flex flex-col shadow-2xl z-50 fixed md:relative h-full transition-transform duration-300"
             [class.-translate-x-full]="!mobileMenuOpen"
             [class.md:translate-x-0]="true">
        <div class="p-6 border-b border-tactical-border flex flex-col gap-4 relative overflow-hidden">
          <div class="flex items-center justify-between relative z-10">
            <div class="flex items-center gap-3">
              <!-- Tactical Logo -->
              <div class="w-10 h-10 bg-tactical-green flex items-center justify-center text-black font-black text-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] border-2 border-black">
                <mat-icon>radar</mat-icon>
              </div>
              <div class="flex flex-col">
                <h1 class="font-mono font-black text-lg leading-none tracking-tighter text-white uppercase">MILITARY</h1>
                <h1 class="font-mono font-black text-lg leading-none tracking-tighter text-tactical-green uppercase">WAR ROOM</h1>
              </div>
            </div>
            <button class="md:hidden text-zinc-600 hover:text-white" (click)="mobileMenuOpen = false">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="flex items-center gap-2 text-[9px] font-black font-mono text-tactical-green/60 uppercase tracking-[0.2em]">
            <span class="w-1.5 h-1.5 rounded-full bg-tactical-green animate-pulse"></span>
            Operational Status: Active
          </div>
          <div class="flex items-center gap-2 text-[7px] font-black font-mono text-zinc-700 uppercase tracking-[0.2em] mt-1">
            <mat-icon class="text-[10px] h-3 w-3">lan</mat-icon>
            Network: Encrypted / Node: 04-Alpha
          </div>
        </div>
        
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar relative z-10">
          <div class="tactical-header pl-2 mb-2">Command Center</div>
          
          <button (click)="setActiveTab('dashboard')" 
                  [class.bg-tactical-green/10]="activeTab === 'dashboard'" 
                  [class.text-tactical-green]="activeTab === 'dashboard'" 
                  [class.border-tactical-green/30]="activeTab === 'dashboard'" 
                  class="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-all duration-200 border border-transparent font-mono text-[11px] font-black uppercase tracking-widest group">
            <mat-icon class="text-[18px]">grid_view</mat-icon> <span>Overview</span>
          </button>
          
          <button (click)="setActiveTab('portfolio')" 
                  [class.bg-tactical-green/10]="activeTab === 'portfolio'" 
                  [class.text-tactical-green]="activeTab === 'portfolio'" 
                  [class.border-tactical-green/30]="activeTab === 'portfolio'" 
                  class="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-all duration-200 border border-transparent font-mono text-[11px] font-black uppercase tracking-widest group">
            <mat-icon class="text-[18px]">account_balance_wallet</mat-icon> <span>Asset Command</span>
          </button>
          
          <button (click)="setActiveTab('markets')" 
                  [class.bg-tactical-green/10]="activeTab === 'markets'" 
                  [class.text-tactical-green]="activeTab === 'markets'" 
                  [class.border-tactical-green/30]="activeTab === 'markets'" 
                  class="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-all duration-200 border border-transparent font-mono text-[11px] font-black uppercase tracking-widest group">
            <mat-icon class="text-[18px]">monitoring</mat-icon> <span>Surveillance</span>
          </button>
          
          <button (click)="setActiveTab('signals')" 
                  [class.bg-tactical-green/10]="activeTab === 'signals'" 
                  [class.text-tactical-green]="activeTab === 'signals'" 
                  [class.border-tactical-green/30]="activeTab === 'signals'" 
                  class="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-all duration-200 border border-transparent font-mono text-[11px] font-black uppercase tracking-widest group">
            <mat-icon class="text-[18px]">security</mat-icon> <span>Tactical Intel</span>
          </button>
          
          <button (click)="setActiveTab('alerts')" 
                  [class.bg-tactical-green/10]="activeTab === 'alerts'" 
                  [class.text-tactical-green]="activeTab === 'alerts'" 
                  [class.border-tactical-green/30]="activeTab === 'alerts'" 
                  class="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-all duration-200 border border-transparent font-mono text-[11px] font-black uppercase tracking-widest group">
            <mat-icon class="text-[18px]">notification_important</mat-icon> <span>Threat Alerts</span>
          </button>
          
          <div class="mt-8 mb-4 border-t border-tactical-border pt-6">
            <div class="tactical-header pl-2 mb-2">System Config</div>
            <button (click)="showSettings = true; mobileMenuOpen = false" class="w-full flex items-center gap-3 px-4 py-3 text-zinc-600 hover:text-white hover:bg-white/5 rounded transition-all duration-200 border border-transparent font-mono text-[11px] font-black uppercase tracking-widest group">
              <mat-icon class="group-hover:rotate-90 transition-transform duration-500 text-[18px]">settings</mat-icon> Parameters
            </button>
            <div class="px-4 py-3 mt-2">
              <div class="text-[7px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-2">System Uptime</div>
              <div class="text-[10px] font-mono font-black text-zinc-500 tracking-widest">{{ uptime() }}</div>
            </div>
          </div>
        </nav>

        <div class="p-4 border-t border-tactical-border bg-black/40">
          <!-- Commander Card -->
          <div class="bg-zinc-950/80 border border-tactical-green/20 rounded p-3 mb-4 flex items-center gap-3 group cursor-default shadow-[0_0_15px_rgba(34,197,94,0.05)]">
            <div class="w-10 h-10 rounded bg-tactical-green/10 flex items-center justify-center text-tactical-green font-black border border-tactical-green/30 group-hover:bg-tactical-green group-hover:text-black transition-all duration-500">MN</div>
            <div class="flex-1 min-w-0">
              <div class="text-[11px] font-black text-white truncate uppercase tracking-wider">Marwan Negm</div>
              <div class="text-[8px] font-mono text-tactical-green/60 uppercase tracking-[0.3em] mt-0.5">Chief Strategist</div>
            </div>
          </div>

          <div class="flex items-center gap-3 px-3 py-2 bg-zinc-950/50 rounded border border-tactical-border group">
            <div class="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-[9px] font-black border border-zinc-800 text-zinc-600 group-hover:border-tactical-red/30 transition-colors">OP</div>
            <div class="flex-1 min-w-0">
              <div class="text-[10px] font-black truncate text-zinc-500 uppercase tracking-widest">OPERATOR</div>
              <div class="text-[7px] font-mono text-zinc-700 uppercase tracking-wider">Level 5 Clearance</div>
            </div>
            <button (click)="logout()" class="text-zinc-700 hover:text-tactical-red transition-colors p-1.5">
              <mat-icon class="text-[16px]">power_settings_new</mat-icon>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <!-- Top Bar -->
        <header class="bg-tactical-panel border-b border-tactical-border h-14 flex items-center justify-between px-6 md:hidden z-20">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-tactical-green flex items-center justify-center text-black font-black text-sm border border-black">
              <mat-icon class="text-[16px]">radar</mat-icon>
            </div>
            <h1 class="font-mono font-black text-xs tracking-widest text-white uppercase">WAR ROOM</h1>
          </div>
          <button (click)="mobileMenuOpen = true" class="text-tactical-green p-2">
            <mat-icon>menu</mat-icon>
          </button>
        </header>

        <!-- Market Ticker -->
        <app-market-ticker></app-market-ticker>

        <!-- API Key Warning Banner -->
        @if (!hasValidKey()) {
          <div class="bg-tactical-red/10 border-b border-tactical-red/20 px-6 py-2 flex items-center justify-between z-20 relative">
            <div class="flex items-center gap-3 text-tactical-red text-[10px] uppercase font-mono font-black tracking-widest">
              <mat-icon class="text-[16px]">error_outline</mat-icon>
              <span>Intelligence Gap: Tactical AI systems offline. API Key required.</span>
            </div>
            <button (click)="showSettings = true" class="bg-tactical-red text-black text-[9px] font-black px-4 py-1 rounded uppercase tracking-widest hover:bg-white transition-colors">
              Initialize Key
            </button>
          </div>
        }

        <!-- Tactical Action Header -->
        <div class="px-6 md:px-8 py-3 border-b border-tactical-border bg-black/40 flex justify-between items-center relative z-20">
          <div class="text-tactical-green text-[9px] font-black font-mono flex items-center gap-2 uppercase tracking-[0.3em]">
            <span class="w-1.5 h-1.5 rounded-full bg-tactical-green shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            Surveillance Stream: Active
          </div>
          <button (click)="triggerAnalysis()" class="tactical-btn-primary py-1.5 px-4 text-[10px] flex items-center gap-2">
             <mat-icon class="text-[16px]">radar</mat-icon> Scan Sector
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar relative z-10" id="main-scroll">
          
          <!-- Screen Flash Overlays -->
          @if (flashColor() === 'LONG') {
            <div class="fixed inset-0 bg-tactical-green/10 z-[100] pointer-events-none" style="animation: flash 0.5s ease-out forwards;"></div>
          }
          @if (flashColor() === 'SHORT') {
            <div class="fixed inset-0 bg-tactical-red/10 z-[100] pointer-events-none" style="animation: flash 0.5s ease-out forwards;"></div>
          }

          <!-- Toast Notification -->
          @if (toastMessage()) {
            <div class="fixed bottom-6 right-6 z-[110] animate-fade-in-up">
              <div class="bg-tactical-panel border-2 rounded p-4 shadow-2xl flex items-start gap-4 max-w-sm"
                   [class.border-tactical-green]="toastMessage()?.type === 'LONG'"
                   [class.border-tactical-red]="toastMessage()?.type === 'SHORT'"
                   [class.border-tactical-orange]="toastMessage()?.type === 'INFO'">
                <div class="w-10 h-10 rounded flex items-center justify-center shrink-0"
                     [class.bg-tactical-green/20]="toastMessage()?.type === 'LONG'"
                     [class.text-tactical-green]="toastMessage()?.type === 'LONG'"
                     [class.bg-tactical-red/20]="toastMessage()?.type === 'SHORT'"
                     [class.text-tactical-red]="toastMessage()?.type === 'SHORT'"
                     [class.bg-tactical-orange/20]="toastMessage()?.type === 'INFO'"
                     [class.text-tactical-orange]="toastMessage()?.type === 'INFO'">
                  <mat-icon>{{ toastMessage()?.type === 'LONG' ? 'trending_up' : toastMessage()?.type === 'SHORT' ? 'trending_down' : 'warning' }}</mat-icon>
                </div>
                <div>
                  <h4 class="text-white font-mono font-black text-[10px] uppercase tracking-widest mb-1">Combat Alert</h4>
                  <p class="text-zinc-400 text-[9px] font-mono uppercase tracking-wider">{{ toastMessage()?.message }}</p>
                </div>
                <button (click)="toastMessage.set(null)" class="text-zinc-600 hover:text-white">
                  <mat-icon class="text-[18px]">close</mat-icon>
                </button>
              </div>
            </div>
          }
          
          <!-- Dashboard View -->
          @if (activeTab === 'dashboard') {
            <div class="animate-fade-in-up">
              <!-- Stats Grid -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="tactical-panel p-5 group">
                  <div class="tactical-header">
                    <mat-icon class="text-[14px]">account_balance_wallet</mat-icon> Asset Valuation
                  </div>
                  <div class="tactical-value text-3xl font-mono">$124,592<span class="text-lg text-zinc-700">.00</span></div>
                  <div class="text-tactical-green text-[9px] font-black font-mono mt-3 flex items-center gap-1.5 uppercase tracking-[0.2em]">
                    <mat-icon class="text-[12px] h-3 w-3">trending_up</mat-icon> Delta: +2.4% (24H)
                  </div>
                </div>

                <div class="tactical-panel p-5 group">
                  <div class="tactical-header">
                    <mat-icon class="text-[14px]">security</mat-icon> Tactical Intel
                  </div>
                  <div class="tactical-value text-3xl font-mono">08</div>
                  <div class="text-tactical-orange text-[9px] font-black font-mono mt-3 flex items-center gap-1.5 uppercase tracking-[0.2em]">
                    <mat-icon class="text-[12px] h-3 w-3">bolt</mat-icon> 3 High Confidence Sectors
                  </div>
                </div>

                <div class="tactical-panel p-5 group">
                  <div class="tactical-header">
                    <mat-icon class="text-[14px]">radar</mat-icon> Active Engagements
                  </div>
                  <div class="tactical-value text-3xl font-mono">03</div>
                  <div class="text-tactical-red text-[9px] font-black font-mono mt-3 flex items-center gap-1.5 uppercase tracking-[0.2em]">
                    <mat-icon class="text-[12px] h-3 w-3">trending_down</mat-icon> Risk Exposure: -0.8%
                  </div>
                </div>
              </div>

              <!-- Charts Row -->
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div class="lg:col-span-2 h-[500px]">
                  <app-price-chart></app-price-chart>
                </div>
                <div class="h-[500px]">
                  <app-sentiment></app-sentiment>
                </div>
              </div>

              <!-- Tactical Intel -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="tactical-panel p-6">
                  <h2 class="tactical-header text-[11px] mb-6">
                    <mat-icon class="text-tactical-green text-[18px]">security</mat-icon> Tactical Combat Signals
                  </h2>
                  <app-signal-card></app-signal-card>
                </div>
                <div class="space-y-6">
                  <div class="tactical-panel p-6">
                    <h2 class="tactical-header text-[11px] mb-6">
                      <mat-icon class="text-tactical-orange text-[18px]">public</mat-icon> Global Intelligence Feed
                    </h2>
                    <app-intelligence></app-intelligence>
                  </div>
                  <div class="tactical-panel p-6">
                    <h2 class="tactical-header text-[11px] mb-6">
                      <mat-icon class="text-zinc-500 text-[18px]">history_edu</mat-icon> Combat Engagement Log
                    </h2>
                    <app-combat-log></app-combat-log>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Portfolio View -->
          @if (activeTab === 'portfolio') {
            <div class="h-full flex flex-col animate-fade-in-up">
              <app-portfolio></app-portfolio>
            </div>
          }

          <!-- Markets View -->
          @if (activeTab === 'markets') {
            <div class="h-full flex flex-col animate-fade-in-up">
              <h2 class="tactical-header text-[11px] mb-6">
                <mat-icon class="text-tactical-green text-[18px]">monitoring</mat-icon> Sector Surveillance
              </h2>
              <div class="flex-1 min-h-[600px]">
                <app-price-chart></app-price-chart>
              </div>
            </div>
          }

          <!-- Signals View -->
          @if (activeTab === 'signals') {
            <div class="animate-fade-in-up">
              <h2 class="tactical-header text-[11px] mb-6">
                <mat-icon class="text-tactical-green text-[18px]">security</mat-icon> Advanced Tactical Intelligence
              </h2>
              <div class="mb-6 p-4 bg-tactical-green/5 border border-tactical-green/20 rounded text-[9px] font-mono text-tactical-green/80 uppercase tracking-[0.2em] leading-relaxed">
                Combat algorithms engaged. Analyzing multi-vector indicators: RSI, MACD, Bollinger Bands. Volatility adjustments active via Gemini Tactical Engine.
              </div>
              <app-signal-card></app-signal-card>
            </div>
          }

          <!-- Alerts View -->
          @if (activeTab === 'alerts') {
             <div class="max-w-4xl mx-auto animate-fade-in-up">
               <h2 class="tactical-header text-[11px] mb-6">
                 <mat-icon class="text-tactical-red text-[18px]">notification_important</mat-icon> Threat Detection Management
               </h2>
               <app-alerts></app-alerts>
             </div>
          }

          <!-- Global Footer -->
          <footer class="mt-12 pt-8 border-t border-tactical-border flex flex-col items-center justify-center gap-6 pb-8">
            <div class="text-center">
              <div class="font-mono font-black text-xl text-white tracking-[0.4em] uppercase mb-2">MILITARY WAR ROOM</div>
              <p class="text-[8px] text-zinc-700 font-mono uppercase tracking-[0.5em] mb-4">Tactical Intelligence Command & Control</p>
              <div class="flex justify-center gap-8 text-zinc-600">
                <div class="flex flex-col items-center gap-1">
                  <span class="text-[7px] font-mono uppercase tracking-widest">Architect</span>
                  <span class="text-[9px] font-black text-tactical-green uppercase tracking-widest">Marwan Negm</span>
                </div>
                <div class="w-px h-8 bg-tactical-border"></div>
                <div class="flex flex-col items-center gap-1">
                  <span class="text-[7px] font-mono uppercase tracking-widest">System</span>
                  <span class="text-[9px] font-black text-zinc-500 uppercase tracking-widest">v4.2.0-Tactical</span>
                </div>
              </div>
            </div>
          </footer>

        </div>

        <!-- Settings Modal -->
        @if (showSettings) {
          <app-settings (closeSettings)="showSettings = false"></app-settings>
        }
        
        <app-chatbot></app-chatbot>
      </main>
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  activeTab = 'dashboard';
  showSettings = false;
  mobileMenuOpen = false;
  flashColor = signal<'LONG' | 'SHORT' | 'NEUTRAL' | 'INFO' | null>(null);
  toastMessage = signal<{message: string, type: 'LONG'|'SHORT'|'INFO'} | null>(null);
  uptime = signal('00:00:00:00');
  
  private uptimeInterval: ReturnType<typeof setInterval> | undefined;
  private subs = new Subscription();
  private timeouts: ReturnType<typeof setTimeout>[] = [];

  ngOnInit() {
    this.startUptimeCounter();
    this.subs.add(this.apiService.analysisComplete$.subscribe(result => {
      this.flashColor.set(result.type);
      this.playTone(result.type);
      const t = setTimeout(() => this.flashColor.set(null), 1000);
      this.timeouts.push(t);
    }));

    this.subs.add(this.apiService.alertTriggered$.subscribe(alert => {
      this.flashColor.set(alert.type);
      this.playTone(alert.type);
      this.toastMessage.set({ message: alert.message, type: alert.type });
      const t1 = setTimeout(() => this.flashColor.set(null), 1000);
      const t2 = setTimeout(() => this.toastMessage.set(null), 5000);
      this.timeouts.push(t1, t2);
    }));
  }

  ngOnDestroy() {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
    }
    this.timeouts.forEach(t => clearTimeout(t));
    this.subs.unsubscribe();
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.mobileMenuOpen = false;
  }

  triggerAnalysis() {
    this.apiService.triggerAnalysis();
    if (this.activeTab !== 'signals') {
      this.activeTab = 'signals';
    }
  }

  playTone(type: 'LONG' | 'SHORT' | 'NEUTRAL' | 'INFO') {
    try {
      const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      
      if (type === 'LONG') {
        const playBeep = (time: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, time);
          gain.gain.setValueAtTime(0.1, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
          osc.start(time);
          osc.stop(time + 0.1);
        };
        playBeep(ctx.currentTime);
        playBeep(ctx.currentTime + 0.15);
      } else if (type === 'SHORT') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.2);
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.4);
        osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.6);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      } else {
        // INFO or NEUTRAL tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  }

  hasValidKey(): boolean {
    return this.apiService.hasValidKey();
  }

  private startUptimeCounter() {
    const startTime = Date.now();
    this.uptimeInterval = setInterval(() => {
      const diff = Date.now() - startTime;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      this.uptime.set(
        `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    }, 1000);
  }

  logout() {
    // Mock logout
    if (confirm('Are you sure you want to logout?')) {
      window.location.reload();
    }
  }
}
