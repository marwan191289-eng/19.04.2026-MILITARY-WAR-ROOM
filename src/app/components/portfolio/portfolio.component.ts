import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Subscription } from 'rxjs';

interface Holding {
  id: string;
  asset: string;
  amount: number;
  avgBuyPrice: number;
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="h-full flex flex-col gap-6 p-2 md:p-6 overflow-y-auto custom-scrollbar relative z-10">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 class="text-3xl font-black text-white tracking-tighter uppercase font-mono drop-shadow-md">Asset Command</h2>
          <p class="text-tactical-green/70 mt-1 font-mono text-[10px] uppercase tracking-[0.2em]">Strategic Portfolio Surveillance & Resource Allocation</p>
        </div>
        <div class="flex gap-3 w-full md:w-auto">
          <button (click)="showAddModal = true" class="tactical-btn-primary py-2 px-4 text-[10px] flex items-center gap-2">
            <mat-icon class="text-[18px]">add</mat-icon> ADD RESOURCE
          </button>
          <button (click)="connectExchange()" class="tactical-btn-secondary py-2 px-4 text-[10px] flex items-center gap-2">
            <mat-icon class="text-[18px]">link</mat-icon> CONNECT EXTERNAL INTEL
          </button>
        </div>
      </div>

      <!-- Portfolio Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="tactical-panel p-6 relative overflow-hidden group">
          <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-6xl text-tactical-green">account_balance_wallet</mat-icon>
          </div>
          <h3 class="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Total Valuation</h3>
          <div class="text-3xl font-black text-white font-mono tracking-tighter">
            {{ totalBalance() | currency:'USD':'symbol':'1.2-2' }}
          </div>
        </div>

        <div class="tactical-panel p-6 relative overflow-hidden group">
          <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-6xl" [class.text-tactical-green]="totalPnL() >= 0" [class.text-tactical-red]="totalPnL() < 0">trending_up</mat-icon>
          </div>
          <h3 class="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Net Engagement P&L</h3>
          <div class="text-3xl font-black font-mono tracking-tighter flex items-center gap-2"
               [class.text-tactical-green]="totalPnL() >= 0"
               [class.text-tactical-red]="totalPnL() < 0">
            {{ totalPnL() >= 0 ? '+' : '' }}{{ totalPnL() | currency:'USD':'symbol':'1.2-2' }}
          </div>
        </div>

        <div class="tactical-panel p-6 relative overflow-hidden group">
          <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-6xl" [class.text-tactical-green]="totalPnLPercent() >= 0" [class.text-tactical-red]="totalPnLPercent() < 0">percent</mat-icon>
          </div>
          <h3 class="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Strategic ROI</h3>
          <div class="text-3xl font-black font-mono tracking-tighter flex items-center gap-2"
               [class.text-tactical-green]="totalPnLPercent() >= 0"
               [class.text-tactical-red]="totalPnLPercent() < 0">
            {{ totalPnLPercent() >= 0 ? '+' : '' }}{{ totalPnLPercent() | number:'1.2-2' }}%
          </div>
        </div>
      </div>

      <!-- Holdings Table -->
      <div class="tactical-panel overflow-hidden flex-1 flex flex-col">
        <div class="p-4 border-b border-tactical-border flex justify-between items-center bg-zinc-950/50">
          <h3 class="text-xs font-black text-white flex items-center gap-2 uppercase tracking-widest">
            <mat-icon class="text-tactical-green text-sm">inventory</mat-icon> Active Resource Inventory
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-zinc-950 text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">
                <th class="p-4 border-b border-tactical-border">ASSET</th>
                <th class="p-4 border-b border-tactical-border text-right">QUANTITY</th>
                <th class="p-4 border-b border-tactical-border text-right">AVG COST</th>
                <th class="p-4 border-b border-tactical-border text-right">MARKET VALUE</th>
                <th class="p-4 border-b border-tactical-border text-right">TOTAL VALUE</th>
                <th class="p-4 border-b border-tactical-border text-right">P&L</th>
                <th class="p-4 border-b border-tactical-border text-center">OPS</th>
              </tr>
            </thead>
            <tbody class="text-[11px] font-mono">
              @if (holdings().length === 0) {
                <tr>
                  <td colspan="7" class="p-12 text-center text-zinc-600">
                    <mat-icon class="text-4xl mb-2 opacity-30">inventory_2</mat-icon>
                    <p class="uppercase tracking-widest text-[10px]">No resources detected in inventory.</p>
                  </td>
                </tr>
              }
              @for (holding of holdings(); track holding.id) {
                <tr class="border-b border-tactical-border hover:bg-tactical-green/5 transition-colors group">
                  <td class="p-4 font-black text-white flex items-center gap-3">
                    <div class="w-7 h-7 rounded border border-tactical-border bg-zinc-900 flex items-center justify-center text-[9px] font-black text-tactical-green">
                      {{ holding.asset.substring(0, 3) }}
                    </div>
                    {{ holding.asset }}
                  </td>
                  <td class="p-4 text-right text-zinc-300">{{ holding.amount | number:'1.2-6' }}</td>
                  <td class="p-4 text-right text-zinc-500">{{ holding.avgBuyPrice | currency:'USD':'symbol':'1.2-4' }}</td>
                  <td class="p-4 text-right text-white">{{ getCurrentPrice(holding.asset) | currency:'USD':'symbol':'1.2-4' }}</td>
                  <td class="p-4 text-right font-black text-white">{{ (holding.amount * getCurrentPrice(holding.asset)) | currency:'USD':'symbol':'1.2-2' }}</td>
                  <td class="p-4 text-right font-black"
                      [class.text-tactical-green]="getPnL(holding) >= 0"
                      [class.text-tactical-red]="getPnL(holding) < 0">
                    {{ getPnL(holding) >= 0 ? '+' : '' }}{{ getPnL(holding) | currency:'USD':'symbol':'1.2-2' }}
                    <div class="text-[8px] opacity-70">{{ getPnLPercent(holding) >= 0 ? '+' : '' }}{{ getPnLPercent(holding) | number:'1.2-2' }}%</div>
                  </td>
                  <td class="p-4 text-center">
                    <button (click)="removeHolding(holding.id)" class="text-zinc-600 hover:text-tactical-red transition-colors p-1.5 rounded opacity-0 group-hover:opacity-100">
                      <mat-icon class="text-[16px]">delete_forever</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Holding Modal -->
      @if (showAddModal) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div class="tactical-panel w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up border-tactical-green/30">
            <div class="p-4 border-b border-tactical-border flex justify-between items-center bg-zinc-950">
              <h3 class="text-xs font-black text-white uppercase tracking-[0.2em]">Add Resource to Inventory</h3>
              <button (click)="showAddModal = false" class="text-zinc-500 hover:text-white transition-colors">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label for="assetIdentifier" class="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Asset Identifier (e.g., BTC, ETH)</label>
                <input id="assetIdentifier" [(ngModel)]="newAsset" type="text" class="w-full bg-zinc-950 border border-tactical-border rounded px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-tactical-green/50 transition-all uppercase" placeholder="BTC">
              </div>
              <div>
                <label for="assetQuantity" class="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Quantity</label>
                <input id="assetQuantity" [(ngModel)]="newAmount" type="number" class="w-full bg-zinc-950 border border-tactical-border rounded px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-tactical-green/50 transition-all" placeholder="0.00">
              </div>
              <div>
                <label for="acquisitionCost" class="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Acquisition Cost (USD)</label>
                <input id="acquisitionCost" [(ngModel)]="newPrice" type="number" class="w-full bg-zinc-950 border border-tactical-border rounded px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-tactical-green/50 transition-all" placeholder="0.00">
              </div>
            </div>
            <div class="p-4 border-t border-tactical-border bg-zinc-950 flex justify-end gap-3">
              <button (click)="showAddModal = false" class="px-4 py-2 text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">ABORT</button>
              <button (click)="addHolding()" class="tactical-btn-primary px-6 py-2 text-[10px]">CONFIRM ACQUISITION</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.3s ease-out forwards;
    }
  `]
})
export class PortfolioComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  
  holdings = signal<Holding[]>([
    { id: '1', asset: 'BTC', amount: 0.5, avgBuyPrice: 42000 },
    { id: '2', asset: 'ETH', amount: 4.2, avgBuyPrice: 2800 },
    { id: '3', asset: 'SOL', amount: 50, avgBuyPrice: 95 }
  ]);

  currentPrices = signal<Record<string, number>>({});
  private marketSub?: Subscription;

  showAddModal = false;
  newAsset = '';
  newAmount: number | null = null;
  newPrice: number | null = null;

  totalBalance = computed(() => {
    return this.holdings().reduce((total, h) => total + (h.amount * this.getCurrentPrice(h.asset)), 0);
  });

  totalInvested = computed(() => {
    return this.holdings().reduce((total, h) => total + (h.amount * h.avgBuyPrice), 0);
  });

  totalPnL = computed(() => {
    return this.totalBalance() - this.totalInvested();
  });

  totalPnLPercent = computed(() => {
    const invested = this.totalInvested();
    if (invested === 0) return 0;
    return (this.totalPnL() / invested) * 100;
  });

  ngOnInit() {
    this.marketSub = this.apiService.marketData$.subscribe(data => {
      this.currentPrices.set({
        'BTC': data.btc,
        'ETH': data.eth,
        'SOL': data.sol,
        'BNB': data.bnb,
        'ADA': data.ada,
        'XRP': data.xrp
      });
    });
  }

  ngOnDestroy() {
    this.marketSub?.unsubscribe();
  }

  getCurrentPrice(asset: string): number {
    const prices = this.currentPrices();
    return prices[asset.toUpperCase()] || 0;
  }

  getPnL(holding: Holding): number {
    const currentPrice = this.getCurrentPrice(holding.asset);
    if (!currentPrice) return 0;
    return (currentPrice - holding.avgBuyPrice) * holding.amount;
  }

  getPnLPercent(holding: Holding): number {
    const currentPrice = this.getCurrentPrice(holding.asset);
    if (!currentPrice || holding.avgBuyPrice === 0) return 0;
    return ((currentPrice - holding.avgBuyPrice) / holding.avgBuyPrice) * 100;
  }

  addHolding() {
    if (!this.newAsset || !this.newAmount || !this.newPrice) return;
    
    const newH: Holding = {
      id: Date.now().toString(),
      asset: this.newAsset.toUpperCase(),
      amount: this.newAmount,
      avgBuyPrice: this.newPrice
    };
    
    this.holdings.update(h => [...h, newH]);
    this.showAddModal = false;
    this.newAsset = '';
    this.newAmount = null;
    this.newPrice = null;
  }

  removeHolding(id: string) {
    this.holdings.update(h => h.filter(item => item.id !== id));
  }

  connectExchange() {
    alert('Exchange connection simulation. In a real app, this would open an OAuth flow for Binance, Coinbase, etc.');
  }
}
