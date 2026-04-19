import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Intelligence } from '../../services/api.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-intelligence',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-4">
      @for (intel of intelligence(); track intel.id) {
        <div class="tactical-panel p-4 border-l-4 transition-all duration-300 hover:bg-white/5 group"
             [class.border-l-tactical-red]="intel.impact === 'HIGH'"
             [class.border-l-tactical-orange]="intel.impact === 'MEDIUM'"
             [class.border-l-tactical-green]="intel.impact === 'LOW'">
          
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
              <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-zinc-900 border border-tactical-border text-zinc-500 uppercase tracking-widest">{{ intel.type }}</span>
              <h4 class="text-[11px] font-black text-white uppercase tracking-wider group-hover:text-tactical-green transition-colors">{{ intel.title }}</h4>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-[7px] font-black uppercase tracking-widest"
                    [class.text-tactical-red]="intel.sentiment === 'HAWKISH' || intel.sentiment === 'BEARISH'"
                    [class.text-tactical-green]="intel.sentiment === 'DOVISH' || intel.sentiment === 'BULLISH'"
                    [class.text-zinc-500]="intel.sentiment === 'NEUTRAL'">
                {{ intel.sentiment }}
              </span>
              <mat-icon class="text-[14px] h-3.5 w-3.5" 
                        [class.text-tactical-red]="intel.impact === 'HIGH'"
                        [class.text-tactical-orange]="intel.impact === 'MEDIUM'"
                        [class.text-tactical-green]="intel.impact === 'LOW'">
                {{ intel.impact === 'HIGH' ? 'priority_high' : intel.impact === 'MEDIUM' ? 'warning' : 'info' }}
              </mat-icon>
            </div>
          </div>
          
          <p class="text-[10px] text-zinc-400 leading-relaxed font-mono uppercase tracking-tight">{{ intel.description }}</p>
          
          <div class="mt-3 flex items-center justify-between text-[7px] font-black text-zinc-600 uppercase tracking-[0.3em]">
            <span>SOURCE: GLOBAL INTEL NETWORK</span>
            <span>IMPACT: {{ intel.impact }}</span>
          </div>
        </div>
      } @empty {
        <div class="p-8 text-center text-zinc-600 font-mono text-[10px] uppercase tracking-widest animate-pulse">
          Awaiting Global Intelligence Feed...
        </div>
      }
    </div>
  `
})
export class IntelligenceComponent implements OnInit {
  private apiService = inject(ApiService);
  intelligence = signal<Intelligence[]>([]);

  ngOnInit() {
    this.apiService.getIntelligence().subscribe(data => {
      this.intelligence.set(data);
    });
  }
}
