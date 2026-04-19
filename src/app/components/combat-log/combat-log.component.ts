import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, CombatLogEntry } from '../../services/api.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-combat-log',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="overflow-x-auto custom-scrollbar">
      <table class="w-full border-collapse">
        <thead>
          <tr class="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] border-b border-tactical-border text-left">
            <th class="pb-3 pl-2">TIMESTAMP</th>
            <th class="pb-3">ASSET</th>
            <th class="pb-3">TYPE</th>
            <th class="pb-3">ENTRY</th>
            <th class="pb-3">STATUS</th>
            <th class="pb-3 text-right pr-2">PNL</th>
          </tr>
        </thead>
        <tbody class="text-[10px] font-mono">
          @for (entry of combatLog(); track entry.id) {
            <tr class="border-b border-tactical-border/30 hover:bg-white/5 transition-colors group">
              <td class="py-3 pl-2 text-zinc-500">{{ entry.timestamp | date:'HH:mm:ss' }}</td>
              <td class="py-3 font-black text-white uppercase tracking-wider">{{ entry.pair }}</td>
              <td class="py-3">
                <span class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest"
                      [class.bg-tactical-green/10]="entry.type === 'LONG'"
                      [class.text-tactical-green]="entry.type === 'LONG'"
                      [class.bg-tactical-red/10]="entry.type === 'SHORT'"
                      [class.text-tactical-red]="entry.type === 'SHORT'">
                  {{ entry.type }}
                </span>
              </td>
              <td class="py-3 text-zinc-300">{{ entry.entry | number:'1.2-4' }}</td>
              <td class="py-3">
                <div class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full" 
                        [class.bg-tactical-green]="entry.status === 'ACTIVE'"
                        [class.bg-zinc-700]="entry.status === 'COMPLETED'"></span>
                  <span class="text-[8px] font-black uppercase tracking-widest"
                        [class.text-tactical-green]="entry.status === 'ACTIVE'"
                        [class.text-zinc-600]="entry.status === 'COMPLETED'">
                    {{ entry.status }}
                  </span>
                </div>
              </td>
              <td class="py-3 text-right pr-2 font-black"
                  [class.text-tactical-green]="+entry.pnl > 0"
                  [class.text-tactical-red]="+entry.pnl < 0"
                  [class.text-zinc-500]="+entry.pnl === 0">
                {{ +entry.pnl > 0 ? '+' : '' }}{{ entry.pnl }}%
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6" class="py-8 text-center text-zinc-700 uppercase tracking-[0.4em] text-[9px]">No Combat Data Recorded</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class CombatLogComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  combatLog = signal<CombatLogEntry[]>([]);
  private refreshInterval: ReturnType<typeof setInterval> | undefined;

  ngOnInit() {
    this.loadCombatLog();
    // Refresh every 30 seconds
    this.refreshInterval = setInterval(() => this.loadCombatLog(), 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadCombatLog() {
    this.apiService.getCombatLog().subscribe(data => {
      this.combatLog.set(data);
    });
  }
}
