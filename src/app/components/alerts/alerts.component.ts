import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Alert, MarketData } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="tactical-panel p-6 relative overflow-hidden">
      <!-- Glow effect -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-tactical-red/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div class="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h2 class="text-xl font-black text-white font-mono tracking-tighter uppercase">Threat Detection</h2>
          <p class="text-[8px] text-zinc-600 mt-1 font-mono uppercase tracking-[0.3em]">Manage Strategic Surveillance Triggers</p>
        </div>
        <div class="bg-tactical-red/10 text-tactical-red px-3 py-1 rounded border border-tactical-red/30 text-[8px] font-black uppercase tracking-[0.3em] font-mono">
          {{ alerts().length }} ACTIVE SENSORS
        </div>
      </div>
      
      <div class="flex flex-col gap-4 mb-6 relative z-10 bg-zinc-950/80 p-4 rounded border border-tactical-border">
        <div class="flex flex-col md:flex-row gap-3 items-start">
          <div class="w-full md:w-1/4">
            <label for="targetAsset" class="text-[7px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1 block font-mono">TARGET ASSET</label>
            <div class="relative">
              <select id="targetAsset" [(ngModel)]="newPair" class="w-full bg-zinc-950 text-white text-[9px] font-mono font-black uppercase tracking-widest rounded border border-tactical-border px-3 py-2.5 outline-none appearance-none focus:border-tactical-red/50 transition-colors">
                <option value="" disabled selected>SELECT TARGET</option>
                @for (pair of availablePairs; track pair) {
                  <option [value]="pair">{{ pair }}</option>
                }
              </select>
              <mat-icon class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none text-sm">expand_more</mat-icon>
            </div>
          </div>
          <div class="w-full md:w-1/4">
            <label for="threatLevel" class="text-[7px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1 block font-mono">THREAT LEVEL</label>
            <div class="relative">
              <select id="threatLevel" [(ngModel)]="newType" class="w-full bg-zinc-950 text-white text-[9px] font-mono font-black uppercase tracking-widest rounded border border-tactical-border px-3 py-2.5 outline-none appearance-none focus:border-tactical-red/50 transition-colors">
                <option value="INFO">ADVISORY</option>
                <option value="LONG">BULLISH ENGAGEMENT</option>
                <option value="SHORT">BEARISH ENGAGEMENT</option>
              </select>
              <mat-icon class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none text-sm">expand_more</mat-icon>
            </div>
          </div>
          <div class="w-full md:w-2/4">
            <label for="triggerCondition" class="text-[7px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1 block font-mono">TRIGGER CONDITION</label>
            <input id="triggerCondition" type="text" placeholder="e.g. Price > 45000 or RSI < 30" class="w-full bg-zinc-950 text-white text-[9px] font-mono font-black uppercase tracking-widest rounded border border-tactical-border px-3 py-2.5 outline-none focus:border-tactical-red/50 transition-colors" 
                   [(ngModel)]="newCondition" [class.border-tactical-red]="conditionError">
            @if (conditionError) {
              <div class="text-tactical-red text-[7px] mt-1 font-black uppercase tracking-[0.3em] flex items-center gap-1 font-mono">
                <mat-icon class="text-[10px] h-3 w-3">error</mat-icon> {{ conditionError }}
              </div>
            }
          </div>
        </div>
        
        <div class="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-tactical-border">
          <div class="flex items-center gap-6 w-full md:w-auto">
            <label class="flex items-center gap-2 cursor-pointer group">
              <div class="relative flex items-center justify-center w-4 h-4 rounded border border-zinc-800 bg-zinc-950 group-hover:border-tactical-red transition-colors">
                <input type="checkbox" [(ngModel)]="notifyInApp" class="peer sr-only">
                <mat-icon class="text-[14px] text-tactical-red opacity-0 peer-checked:opacity-100 transition-opacity absolute">check</mat-icon>
              </div>
              <span class="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] group-hover:text-zinc-300 transition-colors flex items-center gap-1.5 font-mono">
                <mat-icon class="text-[12px]">notifications</mat-icon> IN-APP
              </span>
            </label>
            
            <label class="flex items-center gap-2 cursor-pointer group">
              <div class="relative flex items-center justify-center w-4 h-4 rounded border border-zinc-800 bg-zinc-950 group-hover:border-tactical-red transition-colors">
                <input type="checkbox" [(ngModel)]="notifyEmail" class="peer sr-only">
                <mat-icon class="text-[14px] text-tactical-red opacity-0 peer-checked:opacity-100 transition-opacity absolute">check</mat-icon>
              </div>
              <span class="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] group-hover:text-zinc-300 transition-colors flex items-center gap-1.5 font-mono">
                <mat-icon class="text-[12px]">email</mat-icon> EMAIL
              </span>
            </label>
          </div>
          
          <div class="w-full md:w-auto flex gap-2">
            <button (click)="addAlert()" class="tactical-btn-primary py-2 px-5 text-[9px] flex-1 md:flex-none">
              <mat-icon class="text-[18px]">add_alert</mat-icon> DEPLOY SENSOR
            </button>
            <button (click)="clearAlerts()" class="tactical-btn-secondary py-2 px-3 flex-1 md:flex-none">
              <mat-icon class="text-[18px]">delete_sweep</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-2 relative z-10 custom-scrollbar max-h-[400px] overflow-y-auto pr-2">
        @for (alert of alerts(); track alert.id) {
          <div class="flex items-center justify-between bg-zinc-950/80 p-4 rounded border border-tactical-border hover:border-tactical-red/30 transition-all duration-300 group animate-fade-in-up" style="animation: fadeInUp 0.3s ease-out forwards;">
            <div class="flex items-center gap-4">
              <div class="relative flex h-2 w-2">
                @if (alert.active) {
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        [class.bg-tactical-green]="alert.type === 'LONG'"
                        [class.bg-tactical-red]="alert.type === 'SHORT'"
                        [class.bg-tactical-orange]="alert.type === 'INFO' || !alert.type"></span>
                }
                <span class="relative inline-flex rounded-full h-2 w-2" 
                      [class.bg-tactical-green]="alert.active && alert.type === 'LONG'" 
                      [class.bg-tactical-red]="alert.active && alert.type === 'SHORT'" 
                      [class.bg-tactical-orange]="alert.active && (alert.type === 'INFO' || !alert.type)" 
                      [class.bg-zinc-800]="!alert.active"></span>
              </div>
              <div>
                <div class="text-white font-mono text-xs font-black tracking-tighter flex items-center gap-2 uppercase">
                  {{ alert.pair }}
                  @if (alert.type) {
                    <span class="text-[7px] px-1.5 py-0.5 rounded uppercase tracking-[0.2em] border font-mono font-black"
                          [class.bg-tactical-green/10]="alert.type === 'LONG'"
                          [class.text-tactical-green]="alert.type === 'LONG'"
                          [class.border-tactical-green/30]="alert.type === 'LONG'"
                          [class.bg-tactical-red/10]="alert.type === 'SHORT'"
                          [class.text-tactical-red]="alert.type === 'SHORT'"
                          [class.border-tactical-red/30]="alert.type === 'SHORT'"
                          [class.bg-tactical-orange/10]="alert.type === 'INFO'"
                          [class.text-tactical-orange]="alert.type === 'INFO'"
                          [class.border-tactical-orange/30]="alert.type === 'INFO'">
                      {{ alert.type === 'LONG' ? 'BULLISH' : alert.type === 'SHORT' ? 'BEARISH' : 'ADVISORY' }}
                    </span>
                  }
                  <div class="flex items-center gap-1 ml-2">
                    @if (alert.notifyInApp) {
                      <mat-icon class="text-[12px] text-zinc-700" title="In-App Notification">notifications</mat-icon>
                    }
                    @if (alert.notifyEmail) {
                      <mat-icon class="text-[12px] text-zinc-700" title="Email Notification">email</mat-icon>
                    }
                  </div>
                </div>
                <div class="text-zinc-500 text-[9px] font-mono bg-zinc-950 px-2 py-0.5 rounded mt-1 inline-block border border-tactical-border uppercase tracking-widest font-black">{{ alert.condition }}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button (click)="testAlert(alert)" class="text-zinc-700 hover:text-tactical-green transition-all duration-300 p-1.5 rounded opacity-50 group-hover:opacity-100" title="Simulate Trigger">
                <mat-icon class="text-sm">notifications_active</mat-icon>
              </button>
              <button (click)="deleteAlert(alert.id)" class="text-zinc-700 hover:text-tactical-red transition-all duration-300 p-1.5 rounded opacity-50 group-hover:opacity-100" title="Delete Sensor">
                <mat-icon class="text-sm">delete_forever</mat-icon>
              </button>
            </div>
          </div>
        }
        @if (alerts().length === 0) {
          <div class="flex flex-col items-center justify-center py-12 text-zinc-700 border border-dashed border-tactical-border rounded bg-zinc-950/30">
            <mat-icon class="text-4xl mb-3 opacity-20">notifications_off</mat-icon>
            <p class="text-[9px] font-black uppercase tracking-[0.3em] font-mono">No Active Surveillance Sensors</p>
            <p class="text-[7px] mt-1 opacity-50 uppercase tracking-[0.3em] font-mono">Deploy a sensor to monitor market movements</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AlertsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  alerts = signal<Alert[]>([]);
  newPair = '';
  newCondition = '';
  newType: 'LONG' | 'SHORT' | 'INFO' = 'INFO';
  notifyEmail = false;
  notifyInApp = true;
  conditionError = '';
  availablePairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ADA/USDT', 'XRP/USDT', 'DOGE/USDT', 'DOT/USDT'];
  
  private marketDataSub?: Subscription;
  private triggeredAlerts = new Set<number>(); // To prevent continuous triggering

  ngOnInit() {
    this.loadAlerts();
    this.marketDataSub = this.apiService.marketData$.subscribe(data => {
      this.evaluateAlerts(data);
    });
  }

  ngOnDestroy() {
    if (this.marketDataSub) {
      this.marketDataSub.unsubscribe();
    }
  }

  evaluateAlerts(data: MarketData) {
    const currentAlerts = this.alerts();
    for (const alert of currentAlerts) {
      if (!alert.active || this.triggeredAlerts.has(alert.id)) continue;

      let price = 0;
      if (alert.pair === 'BTC/USDT') price = data.btc;
      else if (alert.pair === 'ETH/USDT') price = data.eth;
      else if (alert.pair === 'SOL/USDT') price = data.sol;
      else if (alert.pair === 'BNB/USDT') price = data.bnb;
      else if (alert.pair === 'ADA/USDT') price = data.ada;
      else if (alert.pair === 'XRP/USDT') price = data.xrp;

      if (price === 0) continue;

      // Simple parser for "> 45000", "< 3000", "Above 45000", "Below 3000"
      const conditionStr = alert.condition.toLowerCase();
      let triggered = false;

      if (conditionStr.includes('>') || conditionStr.includes('above')) {
        const match = conditionStr.match(/\d+(\.\d+)?/);
        if (match) {
          const targetPrice = parseFloat(match[0]);
          if (price > targetPrice) triggered = true;
        }
      } else if (conditionStr.includes('<') || conditionStr.includes('below')) {
        const match = conditionStr.match(/\d+(\.\d+)?/);
        if (match) {
          const targetPrice = parseFloat(match[0]);
          if (price < targetPrice) triggered = true;
        }
      }

      if (triggered) {
        this.triggeredAlerts.add(alert.id);
        
        // Handle notifications based on preferences
        if (alert.notifyInApp !== false) { // Default to true if undefined
          this.apiService.triggerAlert(alert);
        }
        
        if (alert.notifyEmail) {
          console.log(`[Email Notification Simulated] Alert Triggered: ${alert.pair} ${alert.condition}`);
          // In a real app, this would call a backend endpoint to send an email
        }
        
        // Optionally, deactivate the alert after it triggers
        // alert.active = false;
        // this.apiService.updateAlert(alert).subscribe();
      }
    }
  }

  loadAlerts() {
    this.apiService.getAlerts().subscribe({
      next: (data) => {
        this.alerts.set(data);
      },
      error: (err) => console.error('Failed to load alerts', err)
    });
  }

  addAlert() {
    this.conditionError = '';
    if (!this.newPair) return;
    if (!this.newCondition.trim()) {
      this.conditionError = 'Condition cannot be empty';
      return;
    }
    
    this.apiService.addAlert({
      pair: this.newPair,
      condition: this.newCondition,
      type: this.newType,
      notifyEmail: this.notifyEmail,
      notifyInApp: this.notifyInApp
    }).subscribe({
      next: (alert) => {
        this.alerts.update(current => [...current, alert]);
        this.newPair = '';
        this.newCondition = '';
        this.newType = 'INFO';
        this.notifyEmail = false;
        this.notifyInApp = true;
      },
      error: (err) => console.error('Failed to add alert', err)
    });
  }

  testAlert(alert: Alert) {
    this.apiService.triggerAlert(alert);
  }

  deleteAlert(id: number) {
    this.apiService.deleteAlert(id).subscribe({
      next: () => {
        this.alerts.update(current => current.filter(a => a.id !== id));
      },
      error: (err) => console.error('Failed to delete alert', err)
    });
  }

  clearAlerts() {
    const currentAlerts = this.alerts();
    this.alerts.set([]);
    
    currentAlerts.forEach(alert => {
      this.apiService.deleteAlert(alert.id).subscribe({
        error: (err) => console.error(`Failed to delete alert ${alert.id}`, err)
      });
    });
  }
}
