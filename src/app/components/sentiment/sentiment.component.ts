import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';

interface SentimentData {
  score: number;
  label: string;
  summary: string;
  narratives: string[];
}

@Component({
  selector: 'app-sentiment',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="tactical-panel p-6 h-full flex flex-col relative overflow-hidden group">
      <!-- Background Glow -->
      <div class="absolute top-0 right-0 w-48 h-48 bg-tactical-green/5 blur-[80px] rounded-full group-hover:bg-tactical-green/10 transition-colors duration-700"></div>
      
      <div class="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 class="text-white font-black text-lg flex items-center gap-2 tracking-tighter uppercase font-mono">
            <mat-icon class="text-tactical-green">psychology</mat-icon>
            Market Sentiment
          </h3>
          <p class="text-[8px] text-zinc-600 mt-1 font-mono uppercase tracking-[0.3em]">Global Intelligence Surveillance</p>
        </div>
        <div class="px-3 py-1 rounded border text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-500 font-mono"
             [class.bg-tactical-green/10]="(sentiment()?.score ?? 0) >= 60"
             [class.text-tactical-green]="(sentiment()?.score ?? 0) >= 60"
             [class.border-tactical-green/40]="(sentiment()?.score ?? 0) >= 60"
             [class.bg-tactical-red/10]="(sentiment()?.score ?? 0) <= 40"
             [class.text-tactical-red]="(sentiment()?.score ?? 0) <= 40"
             [class.border-tactical-red/40]="(sentiment()?.score ?? 0) <= 40"
             [class.bg-zinc-950]="(sentiment()?.score ?? 0) > 40 && (sentiment()?.score ?? 0) < 60"
             [class.text-zinc-500]="(sentiment()?.score ?? 0) > 40 && (sentiment()?.score ?? 0) < 60"
             [class.border-tactical-border]="(sentiment()?.score ?? 0) > 40 && (sentiment()?.score ?? 0) < 60">
          {{ sentiment()?.label || 'ANALYZING...' }}
        </div>
      </div>

      @if (isLoading()) {
        <div class="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[200px]">
          <div class="relative w-12 h-12">
            <div class="absolute inset-0 border-2 border-tactical-green/20 rounded-full"></div>
            <div class="absolute inset-0 border-2 border-tactical-green border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p class="text-[9px] text-tactical-green animate-pulse font-mono uppercase tracking-[0.3em]">Scanning Intel Streams...</p>
        </div>
      } @else {
        <div class="flex-1 flex flex-col gap-8 relative z-10 animate-fade-in-up" style="animation: fadeInUp 0.5s ease-out forwards;">
          <!-- Gauge Visualization -->
          <div>
            <div class="flex justify-between items-end mb-2">
              <span class="text-3xl font-mono font-black text-white">{{ sentiment()?.score }}<span class="text-[10px] text-zinc-700 ml-1">/100</span></span>
            </div>
            <div class="relative h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-tactical-border">
              <div class="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-tactical-red via-tactical-orange to-tactical-green opacity-10"></div>
              <div class="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-tactical-red via-tactical-orange to-tactical-green opacity-40" [style.clip-path]="'inset(0 ' + (100 - (sentiment()?.score ?? 0)) + '% 0 0)'"></div>
              <div class="absolute top-0 h-full w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,1)] transition-all duration-1000 ease-out z-10"
                   [style.left.%]="sentiment()?.score"></div>
            </div>
            <div class="flex justify-between text-[7px] text-zinc-700 font-black uppercase tracking-[0.3em] mt-2 font-mono">
              <span>Extreme Fear</span>
              <span>Neutral</span>
              <span>Extreme Greed</span>
            </div>
          </div>

          <!-- Summary -->
          <div class="bg-zinc-950/80 rounded p-4 border border-tactical-border relative overflow-hidden">
            <p class="text-[10px] text-zinc-400 leading-relaxed relative z-10 font-sans italic uppercase tracking-wider">
              "{{ sentiment()?.summary }}"
            </p>
          </div>

          <!-- Top Narratives -->
          <div class="flex-1">
            <h4 class="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2 font-mono">
              <mat-icon class="text-[12px]">trending_up</mat-icon> Strategic Narratives
            </h4>
            <div class="space-y-2">
              @for (narrative of sentiment()?.narratives; track narrative; let i = $index) {
                <div class="flex items-start gap-3 p-2 rounded border border-transparent hover:border-tactical-green/20 hover:bg-tactical-green/5 transition-all duration-300"
                     [style.animation-delay]="(i * 100) + 'ms'"
                     style="animation: fadeInUp 0.5s ease-out both;">
                  <div class="w-5 h-5 rounded border border-tactical-green/30 flex items-center justify-center shrink-0 mt-0.5 bg-zinc-950">
                    <span class="text-tactical-green text-[8px] font-black font-mono">{{ i + 1 }}</span>
                  </div>
                  <span class="text-[10px] text-zinc-400 font-black font-mono uppercase tracking-wider leading-tight">{{ narrative }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SentimentComponent implements OnInit {
  private apiService = inject(ApiService);
  
  sentiment = signal<SentimentData | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.apiService.getSentiment().subscribe({
      next: (data) => {
        this.sentiment.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }
}
