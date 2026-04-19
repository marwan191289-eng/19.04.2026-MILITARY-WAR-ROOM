import { Component, inject, OnInit, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50" (click)="closeSettings.emit()" (keydown.escape)="closeSettings.emit()" tabindex="0">
      <div class="bg-tactical-panel border border-tactical-border rounded shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-md p-6 animate-fade-in-up" (click)="$event.stopPropagation()" (keydown)="null" tabindex="0">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-xl font-black text-white flex items-center gap-3 uppercase font-mono tracking-widest">
            <mat-icon class="text-tactical-green">settings</mat-icon> System Parameters
          </h2>
          <button (click)="closeSettings.emit()" class="text-zinc-600 hover:text-white transition-colors">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="space-y-8">
          <!-- Risk Level -->
          <div>
            <div class="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Engagement Risk Tolerance</div>
            <div class="grid grid-cols-3 gap-2">
              @for (level of ['LOW', 'MEDIUM', 'HIGH']; track level) {
                <button 
                  (click)="settings.riskLevel = level"
                  class="px-3 py-2 rounded text-[10px] font-black font-mono border transition-all uppercase tracking-widest"
                  [class.bg-tactical-green/10]="settings.riskLevel === level"
                  [class.border-tactical-green/50]="settings.riskLevel === level"
                  [class.text-tactical-green]="settings.riskLevel === level"
                  [class.bg-zinc-950]="settings.riskLevel !== level"
                  [class.border-tactical-border]="settings.riskLevel !== level"
                  [class.text-zinc-600]="settings.riskLevel !== level"
                >
                  {{ level }}
                </button>
              }
            </div>
            <p class="text-[9px] text-zinc-600 mt-3 font-mono uppercase tracking-wider">
              @if (settings.riskLevel === 'LOW') { Conservative: High confidence signals only (>80%). }
              @if (settings.riskLevel === 'MEDIUM') { Balanced: Moderate confidence signals (>60%). }
              @if (settings.riskLevel === 'HIGH') { Aggressive: All potential opportunities (>40%). }
            </p>
          </div>

          <!-- Timeframe -->
          <div>
            <label for="timeframe-select" class="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Analysis Timeframe</label>
            <select id="timeframe-select" [(ngModel)]="settings.timeframe" class="w-full bg-zinc-950 text-white text-[10px] font-mono font-black uppercase tracking-widest rounded border border-tactical-border px-4 py-3 outline-none focus:border-tactical-green/50 transition-all">
              <option value="1m">1 Minute (Scalping)</option>
              <option value="5m">5 Minutes (Intraday)</option>
              <option value="15m">15 Minutes (Swing)</option>
              <option value="1h">1 Hour (Trend)</option>
            </select>
          </div>

          <!-- Active Pairs -->
          <div>
            <div class="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Active Surveillance Sectors</div>
            <div class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              @for (pair of availablePairs; track pair) {
                <div class="flex items-center gap-3 p-2 rounded border border-tactical-border bg-zinc-950/50 hover:bg-tactical-green/5 cursor-pointer transition-all" 
                     (click)="togglePair(pair)" (keydown.enter)="togglePair(pair)" tabindex="0">
                  <div class="w-4 h-4 rounded border flex items-center justify-center transition-all" 
                       [class.bg-tactical-green]="settings.activePairs?.includes(pair)"
                       [class.border-tactical-green]="settings.activePairs?.includes(pair)"
                       [class.border-zinc-800]="!settings.activePairs?.includes(pair)">
                    @if (settings.activePairs?.includes(pair)) {
                      <mat-icon class="text-[10px] text-black font-black h-3 w-3">check</mat-icon>
                    }
                  </div>
                  <span class="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest">{{ pair }}</span>
                </div>
              }
            </div>
          </div>

          <!-- API Key Section -->
          <div class="border-t border-tactical-border pt-8">
            <div class="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Gemini Tactical API Key</div>
            <div class="relative">
              <input 
                [type]="showKey ? 'text' : 'password'" 
                [(ngModel)]="apiKey" 
                placeholder="ENTER TACTICAL KEY..."
                class="w-full bg-zinc-950 text-white text-[10px] font-mono font-black uppercase tracking-widest rounded border border-tactical-border px-4 py-3 focus:outline-none pr-12 transition-all"
                [class.border-tactical-red/50]="!isValidKey && apiKey"
                [class.focus:border-tactical-red]="!isValidKey && apiKey"
                [class.focus:border-tactical-green/50]="isValidKey || !apiKey"
              >
              <button 
                (click)="showKey = !showKey"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 focus:outline-none"
                tabindex="-1"
              >
                <mat-icon class="text-[16px] h-4 w-4">{{ showKey ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            @if (!isValidKey && apiKey) {
              <p class="text-[8px] text-tactical-red mt-2 flex items-center gap-1 font-mono font-black uppercase tracking-widest">
                <mat-icon class="text-[10px] h-3 w-3">error</mat-icon> Invalid Key Format. Must start with "AIza".
              </p>
            }
            <p class="text-[8px] text-zinc-600 mt-3 font-mono uppercase tracking-widest leading-relaxed">
              Required for AI Tactical Intel and Sentiment Analysis. 
              <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-tactical-green hover:underline">Request Intel Key</a>.
            </p>
          </div>
        </div>

        <div class="mt-10 flex justify-end gap-4">
          <button (click)="closeSettings.emit()" class="px-4 py-2 text-[10px] font-black text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">ABORT</button>
          <button 
            (click)="saveSettings()" 
            [disabled]="!isValidKey && apiKey"
            class="tactical-btn-primary px-6 py-2 text-[10px] flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <mat-icon class="text-[16px] h-4 w-4">save</mat-icon> COMMIT CHANGES
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  
  @Output() closeSettings = new EventEmitter<void>();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  settings: any = {
    riskLevel: 'MEDIUM',
    activePairs: [],
    timeframe: '15m'
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  apiKey = '';
  showKey = false;

  availablePairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ADA/USDT', 'XRP/USDT', 'DOGE/USDT', 'DOT/USDT'];

  get isValidKey(): boolean {
    if (!this.apiKey) return true; // Empty is valid (clearing the key)
    return this.apiKey.startsWith('AIza') && this.apiKey.length > 20;
  }

  ngOnInit() {
    this.apiKey = this.apiService.getApiKey();
    this.apiService.getSettings().subscribe(data => {
      this.settings = data;
      this.cdr.markForCheck();
    });
  }

  togglePair(pair: string) {
    if (!this.settings.activePairs) this.settings.activePairs = [];
    
    if (this.settings.activePairs.includes(pair)) {
      this.settings.activePairs = this.settings.activePairs.filter((p: string) => p !== pair);
    } else {
      this.settings.activePairs.push(pair);
    }
  }

  saveSettings() {
    this.apiService.setApiKey(this.apiKey);
    this.apiService.updateSettings(this.settings).subscribe(() => {
      this.closeSettings.emit();
    });
  }
}
