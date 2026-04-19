import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-market-ticker',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="bg-zinc-950 border-b border-tactical-border px-6 py-3 flex items-center gap-8 overflow-hidden relative z-20">
    <!-- Live Indicator -->
    <div class="flex items-center gap-3 shrink-0">
      <div class="relative flex h-2.5 w-2.5">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-tactical-green opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-tactical-green"></span>
      </div>
      <span class="text-[10px] font-mono font-black text-tactical-green uppercase tracking-[0.3em]">Live Intel Feed</span>
    </div>

    <!-- Ticker Items -->
    <div class="flex items-center gap-10 whitespace-nowrap overflow-hidden">
      <div class="flex items-center gap-3 group cursor-default bg-zinc-900/50 px-3 py-1.5 rounded border border-tactical-border hover:border-tactical-green/30 transition-all duration-300">
        <span class="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">BTC</span>
        <span class="text-[11px] font-mono font-black text-white" [class.text-tactical-green]="(data()?.btc || 0) > 45000" [class.text-tactical-red]="(data()?.btc || 0) <= 45000">
          {{ data()?.btc | number:'1.2-2' }}
        </span>
      </div>
      <div class="flex items-center gap-3 group cursor-default bg-zinc-900/50 px-3 py-1.5 rounded border border-tactical-border hover:border-tactical-green/30 transition-all duration-300">
        <span class="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">ETH</span>
        <span class="text-[11px] font-mono font-black text-white" [class.text-tactical-green]="(data()?.eth || 0) > 3200" [class.text-tactical-red]="(data()?.eth || 0) <= 3200">
          {{ data()?.eth | number:'1.2-2' }}
        </span>
      </div>
      <div class="flex items-center gap-3 group cursor-default bg-zinc-900/50 px-3 py-1.5 rounded border border-tactical-border hover:border-tactical-green/30 transition-all duration-300">
        <span class="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">SOL</span>
        <span class="text-[11px] font-mono font-black text-white" [class.text-tactical-green]="(data()?.sol || 0) > 110" [class.text-tactical-red]="(data()?.sol || 0) <= 110">
          {{ data()?.sol | number:'1.2-2' }}
        </span>
      </div>
    </div>

    <!-- System Info -->
    <div class="ml-auto flex items-center gap-6 shrink-0 border-l border-tactical-border pl-8">
      <div class="flex flex-col items-end">
        <span class="text-[7px] font-mono text-zinc-600 uppercase tracking-[0.3em]">Chief Strategist</span>
        <span class="text-[9px] font-mono font-black text-white uppercase tracking-widest">Marwan Negm</span>
      </div>
      <div class="flex flex-col items-end">
        <span class="text-[7px] font-mono text-zinc-600 uppercase tracking-[0.3em]">Network Latency</span>
        <span class="text-[9px] font-mono font-black text-tactical-green uppercase tracking-widest">14ms</span>
      </div>
    </div>
  </div>
  `,
})
export class MarketTickerComponent {
  private apiService = inject(ApiService);
  data = toSignal(this.apiService.marketData$);
}
